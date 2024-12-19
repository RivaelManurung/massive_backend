const dbpool = require("../config/database");
const Forum = require("../models/forumModel.js");
const Reply = require("../models/replyModel.js");

// --- Ensure Database Tables Exist ---
const ensureTablesExist = async () => {
  const createForumTableQuery = `
    CREATE TABLE IF NOT EXISTS forum (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      userId INT NOT NULL,
      keywords JSON,
      imageUrl VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `;
  const createRepliesTableQuery = `
    CREATE TABLE IF NOT EXISTS replies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      forumId INT NOT NULL,
      userId INT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (forumId) REFERENCES forum(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `;
  try {
    await dbpool.execute(createForumTableQuery);
    await dbpool.execute(createRepliesTableQuery);
    console.log("Forum and Replies tables are ready.");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
};

ensureTablesExist();

// --- Get All Forums ---
const getAllForums = async (req, res) => {
  try {
    const SQLQuery = "SELECT * FROM forum";
    const [rows] = await dbpool.execute(SQLQuery);

    const forums = rows.map((row) => {
      let keywords = [];
      try {
        const rawKeywords = row.keywords;

        // Pastikan rawKeywords adalah string dan bukan null
        if (typeof rawKeywords === "string" && rawKeywords.trim()) {
          keywords = JSON.parse(rawKeywords); // Parsing JSON jika valid
        } else if (Array.isArray(rawKeywords)) {
          // Jika sudah berbentuk array, langsung gunakan
          keywords = rawKeywords;
        }
      } catch (parseError) {
        console.error("Error parsing keywords:", parseError);
        keywords = []; // Fallback ke array kosong jika terjadi error
      }

      return {
        id: row.id,
        title: row.title,
        content: row.content,
        userId: row.userId,
        keywords: keywords,
        imageUrl: row.imageUrl,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    res.json(forums);
  } catch (error) {
    console.error("Error retrieving forums:", error);
    res.status(500).json({
      message: "Failed to retrieve forums",
      serverMessage: error.message,
    });
  }
};


const getForumById = async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  try {
    const forumQuery = "SELECT * FROM forum WHERE id = ?";
    const repliesQuery = "SELECT * FROM replies WHERE forumId = ?";

    const [forumRows] = await dbpool.execute(forumQuery, [id]);
    const [replyRows] = await dbpool.execute(repliesQuery, [id]);

    if (forumRows.length === 0) {
      return res.status(404).json({ message: "Forum not found" });
    }

    let keywords = [];
    try {
      const rawKeywords = forumRows[0].keywords;

      // Pastikan rawKeywords adalah string dan bukan null
      if (typeof rawKeywords === "string" && rawKeywords.trim()) {
        keywords = JSON.parse(rawKeywords); // Parsing JSON jika valid
      } else if (Array.isArray(rawKeywords)) {
        // Jika sudah berbentuk array, langsung gunakan
        keywords = rawKeywords;
      }
    } catch (parseError) {
      console.error("Error parsing keywords:", parseError);
      keywords = []; // Fallback ke array kosong jika terjadi error
    }

    const forum = {
      id: forumRows[0].id,
      title: forumRows[0].title,
      content: forumRows[0].content,
      userId: forumRows[0].userId,
      keywords: keywords,
      imageUrl: forumRows[0].imageUrl,
      createdAt: forumRows[0].created_at,
      updatedAt: forumRows[0].updated_at,
      replies: replyRows.map((reply) => ({
        id: reply.id,
        forumId: reply.forumId,
        userId: reply.userId,
        content: reply.content,
        createdAt: reply.created_at,
        updatedAt: reply.updated_at,
      })),
    };

    console.log("Returning forum data:", forum);
    res.json(forum);
  } catch (error) {
    console.error("Error fetching forum:", error);
    res.status(500).json({
      message: "Failed to retrieve forum",
      serverMessage: error.message,
    });
  }
};

// --- Create a New Forum ---
const createNewForum = async (req, res) => {
  const { title, content, keywords } = req.body;
  const userId = req.user.id; 
  const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : null;

  if (!title || !content || !userId) {
    return res.status(400).json({
      message: "Fields 'title', 'content', and 'userId' are required.",
    });
  }

  if (title.length > 255 || content.length > 10000) {
    return res.status(400).json({
      message: "Title or content exceeds the maximum allowed length.",
    });
  }

  if (keywords && keywords.length > 3) {
    return res.status(400).json({
      message: "Keywords should not exceed 3.",
    });
  }

  try {
    const SQLQuery = `
        INSERT INTO forum (title, content, userId, keywords, imageUrl, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;
    const [result] = await dbpool.execute(SQLQuery, [
      title,
      content,
      userId,
      JSON.stringify(keywords || []),
      imageUrl,
    ]);

    const newForum = new Forum(
      result.insertId,
      title,
      content,
      userId,
      keywords || [],
      imageUrl,
      new Date(),
      new Date()
    );

    res.json({
      message: "Forum created successfully.",
      forum: newForum,
    });
  } catch (error) {
    console.error("Error creating forum:", error);
    res.status(500).json({
      message: "Failed to create forum.",
      serverMessage: error.message,
    });
  }
};

// --- Add Reply to Forum ---
const addReplyToForum = async (req, res) => {
  const { forumId } = req.params;
  const { content } = req.body;

  // Ensure content is provided
  if (!content || !req.user.id) {
    return res.status(400).json({
      message: "Fields 'content' and 'userId' are required.",
    });
  }

  try {
    const SQLQuery = `
      INSERT INTO replies (forumId, userId, content, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;
    const [result] = await dbpool.execute(SQLQuery, [
      forumId,
      req.user.id,
      content,
    ]);

    const newReply = new Reply(
      result.insertId,
      forumId,
      req.user.id,
      content,
      new Date(),
      new Date()
    );

    res.json({
      message: "Reply added successfully.",
      reply: newReply,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add reply.",
      serverMessage: error.message,
    });
  }
};

const getAllRepliesByForumId = async (req, res) => {
  const { forumId } = req.params;
  try {
    const SQLQuery = "SELECT * FROM replies WHERE forumId = ?";
    const [rows] = await dbpool.execute(SQLQuery, [forumId]);

    const replies = rows.map((reply) => ({
      id: reply.id,
      forumId: reply.forumId,
      userId: reply.userId,
      content: reply.content,
      createdAt: reply.created_at,
      updatedAt: reply.updated_at,
    }));

    res.json(replies);
  } catch (error) {
    console.error("Error fetching replies:", error);
    res.status(500).json({
      message: "Failed to retrieve replies.",
      serverMessage: error.message,
    });
  }
};

const updateReply = async (req, res) => {
  const { replyId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({
      message: "Field 'content' is required.",
    });
  }

  try {
    const SQLQuery =
      "UPDATE replies SET content = ?, updated_at = NOW() WHERE id = ?";
    const [result] = await dbpool.execute(SQLQuery, [content, replyId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Reply not found." });
    }

    res.json({
      message: "Reply updated successfully.",
      updatedReply: { id: replyId, content },
    });
  } catch (error) {
    console.error("Error updating reply:", error);
    res.status(500).json({
      message: "Failed to update reply.",
      serverMessage: error.message,
    });
  }
};

const deleteReply = async (req, res) => {
  const { replyId } = req.params;

  console.log("req.params:", req.params);
  console.log("Deleting reply with ID:", replyId);

  // Validasi awal
  if (!replyId || isNaN(replyId)) {
    return res.status(400).json({ message: "Invalid reply ID format." });
  }

  try {
    const SQLQuery = "DELETE FROM replies WHERE id = ?";
    const [result] = await dbpool.execute(SQLQuery, [replyId]);

    console.log("Delete result:", result); // Log hasil query

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Reply not found." });
    }

    res.json({ message: "Reply deleted successfully." });
  } catch (error) {
    console.error("Error deleting reply:", error);
    res.status(500).json({
      message: "Failed to delete reply.",
      serverMessage: error.message,
    });
  }
};

const editForum = async (req, res) => {
  const { id } = req.params; // Forum ID
  const { title, content, keywords } = req.body; // New data for the forum

  if (!title || !content) {
    return res.status(400).json({
      message: "Fields 'title' and 'content' are required.",
    });
  }

  try {
    // Update Forum
    const updateForumQuery = `
      UPDATE forum
      SET title = ?, content = ?, keywords = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [updateResult] = await dbpool.execute(updateForumQuery, [
      title,
      content,
      JSON.stringify(keywords || []),
      id,
    ]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: "Forum not found" });
    }

    // Check and delete inappropriate replies
    const repliesQuery = "SELECT * FROM replies WHERE forumId = ?";
    const [repliesRows] = await dbpool.execute(repliesQuery, [id]);

    const inappropriateWords = ['offensiveWord1', 'offensiveWord2']; // Replace with a list of inappropriate words
    const unacceptableContent = ['badTopic', 'spam']; // Replace with a list of unacceptable content

    // Delete replies containing inappropriate words
    for (let reply of repliesRows) {
      if (inappropriateWords.some(word => reply.content.includes(word))) {
        const deleteReplyQuery = "DELETE FROM replies WHERE id = ?";
        await dbpool.execute(deleteReplyQuery, [reply.id]);
        console.log(`Deleted inappropriate reply with ID: ${reply.id}`);
      }
    }

    // Check if the forum content is inappropriate and delete the forum if necessary
    if (unacceptableContent.some(keyword => title.includes(keyword) || content.includes(keyword))) {
      const deleteForumQuery = "DELETE FROM forum WHERE id = ?";
      await dbpool.execute(deleteForumQuery, [id]);
      console.log(`Deleted forum with ID: ${id} due to unacceptable content.`);
      return res.status(400).json({
        message: "Forum deleted due to violation of site policies.",
      });
    }

    // Fetch the updated forum
    const forumQuery = "SELECT * FROM forum WHERE id = ?";
    const [forumRows] = await dbpool.execute(forumQuery, [id]);

    let parsedKeywords = [];
    try {
      const rawKeywords = forumRows[0].keywords;
      if (typeof rawKeywords === "string" && rawKeywords.trim()) {
        parsedKeywords = JSON.parse(rawKeywords);
      } else if (Array.isArray(rawKeywords)) {
        parsedKeywords = rawKeywords;
      }
    } catch (parseError) {
      console.error("Error parsing keywords:", parseError);
      parsedKeywords = [];
    }

    const updatedForum = {
      id: forumRows[0].id,
      title: forumRows[0].title,
      content: forumRows[0].content,
      userId: forumRows[0].userId,
      keywords: parsedKeywords,
      imageUrl: forumRows[0].imageUrl,
      createdAt: forumRows[0].created_at,
      updatedAt: forumRows[0].updated_at,
      replies: repliesRows.map((reply) => ({
        id: reply.id,
        forumId: reply.forumId,
        userId: reply.userId,
        content: reply.content,
        createdAt: reply.created_at,
        updatedAt: reply.updated_at,
      })),
    };

    res.json({
      message: "Forum updated successfully.",
      forum: updatedForum,
    });
  } catch (error) {
    console.error("Error updating forum:", error);
    res.status(500).json({
      message: "Failed to update forum.",
      serverMessage: error.message,
    });
  }
};



const deleteReplyByAdmin = async (req, res) => {
  const { replyId } = req.params;

  try {
    // Pastikan reply yang akan dihapus ada di dalam forum yang sesuai
    const replyQuery = "SELECT * FROM replies WHERE id = ?";
    const [replyRows] = await dbpool.execute(replyQuery, [replyId]);

    if (replyRows.length === 0) {
      return res.status(404).json({ message: "Reply not found." });
    }

    // Hapus reply
    const deleteReplyQuery = "DELETE FROM replies WHERE id = ?";
    const [deleteResult] = await dbpool.execute(deleteReplyQuery, [replyId]);

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ message: "Reply not found." });
    }

    res.json({ message: "Reply deleted successfully." });
  } catch (error) {
    console.error("Error deleting reply:", error);
    res.status(500).json({
      message: "Failed to delete reply.",
      serverMessage: error.message,
    });
  }
};


// --- Export Controllers ---
module.exports = {
  getAllForums,
  getForumById,
  createNewForum,
  addReplyToForum,
  getAllRepliesByForumId,
  updateReply,
  deleteReply,
  deleteReplyByAdmin,
  editForum
};
