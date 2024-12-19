// Controller: artikelController.js
const dbpool = require("../config/database");
const Artikel = require("../models/artikelModel.js");
const path = require("path");

// Ensure Artikel table exists
const ensureArtikelTableExists = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS artikel (
      id INT AUTO_INCREMENT PRIMARY KEY,
      judul VARCHAR(255) NOT NULL,
      deskripsi TEXT NOT NULL,
      imageUrl VARCHAR(255),
      categoryArtikelId INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (categoryArtikelId) REFERENCES categoryArtikel(id) ON DELETE CASCADE
    );
  `;
  try {
    await dbpool.execute(createTableQuery);
    console.log("Artikel table created or already exists.");
  } catch (error) {
    console.error("Error creating Artikel table:", error);
  }
};

ensureArtikelTableExists();

// Helper function to map rows to artikels
const mapArtikelRows = (rows) => {
  return rows.map((row) => ({
    id: row.id,
    title: row.judul,
    description: row.deskripsi,
    imageUrl: row.imageUrl,
    categoryArtikelId: row.categoryArtikelId,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

// Get all articles
const getAllArtikel = async (req, res) => {
  try {
    const SQLQuery = "SELECT * FROM artikel";
    const [rows] = await dbpool.execute(SQLQuery);
    res.json(mapArtikelRows(rows));
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve articles", error: error.message });
  }
};

// Get article by ID
const getArtikelById = async (req, res) => {
  const { id } = req.params;
  try {
    const SQLQuery = "SELECT * FROM artikel WHERE id = ?";
    const [rows] = await dbpool.execute(SQLQuery, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.json(mapArtikelRows(rows)[0]);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve article", error: error.message });
  }
};

// Create a new article with image upload
const createNewArtikel = async (req, res) => {
  const { judul, deskripsi, categoryArtikelId = null } = req.body;
  const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : null;

  if (!judul || !deskripsi) {
    return res.status(400).json({
      message: "CREATE NEW ARTIKEL FAILED",
      error: "Fields 'judul' and 'deskripsi' are required.",
    });
  }

  try {
    const SQLQuery = `
      INSERT INTO artikel (judul, deskripsi, imageUrl, categoryArtikelId, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await dbpool.execute(SQLQuery, [judul, deskripsi, imageUrl, categoryArtikelId]);

    res.json({
      message: "CREATE NEW ARTIKEL SUCCESS",
      artikel: {
        id: result.insertId,
        judul,
        deskripsi,
        imageUrl,
        categoryArtikelId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "CREATE NEW ARTIKEL FAILED",
      error: error.message,
    });
  }
};

// Update article by ID
const updateArtikel = async (req, res) => {
  const { id } = req.params;
  const { judul, deskripsi, categoryArtikelId } = req.body;
  const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : null;

  const updatedFields = { judul, deskripsi, categoryArtikelId, imageUrl };

  // Remove undefined fields
  Object.keys(updatedFields).forEach((key) => {
    if (!updatedFields[key]) delete updatedFields[key];
  });

  if (Object.keys(updatedFields).length === 0) {
    return res.status(400).json({ message: "At least one field must be provided to update." });
  }

  const setClause = Object.keys(updatedFields)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = [...Object.values(updatedFields), id];

  try {
    const SQLQuery = `UPDATE artikel SET ${setClause}, updated_at = NOW() WHERE id = ?`;
    const [result] = await dbpool.execute(SQLQuery, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.json({ message: "Article updated successfully", artikel: { id, ...updatedFields } });
  } catch (error) {
    res.status(500).json({ message: "Error updating article", error: error.message });
  }
};

// Delete article by ID
const deleteArtikel = async (req, res) => {
  const { id } = req.params;
  try {
    const SQLQuery = "DELETE FROM artikel WHERE id = ?";
    const [result] = await dbpool.execute(SQLQuery, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.json({ message: "Article deleted successfully", deletedArtikelId: id });
  } catch (error) {
    res.status(500).json({ message: "Error deleting article", error: error.message });
  }
};

module.exports = {
  getAllArtikel,
  getArtikelById,
  createNewArtikel,
  updateArtikel,
  deleteArtikel,
};