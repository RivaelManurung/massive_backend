const dbpool = require("../config/database");
const CategoryArtikel = require("../models/categoryArtikelModel.js");

// Membuat tabel categoryArtikel jika belum ada
const ensureCategoryArtikelTableExists = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS categoryArtikel (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;
  try {
    await dbpool.execute(createTableQuery);
    console.log("CategoryArtikel table created or already exists.");
  } catch (error) {
    console.error("Error creating CategoryArtikel table:", error);
  }
};
ensureCategoryArtikelTableExists();

// Mendapatkan semua kategori artikel
const getAllCategoryArtikel = async (req, res) => {
  try {
    await ensureCategoryArtikelTableExists();
    const SQLQuery = "SELECT * FROM categoryArtikel";
    const [rows] = await dbpool.execute(SQLQuery);

    const categoryArtikels = rows.map(
      (row) => new CategoryArtikel(row.id, row.name, row.created_at, row.updated_at)
    );

    res.json(categoryArtikels);
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve category artikels",
      ServerMessage: error.message,
    });
  }
};

// Membuat kategori artikel baru
const createNewCategoryArtikel = async (req, res) => {
  const { name } = req.body;
  try {
    await ensureCategoryArtikelTableExists();

    const SQLQuery = `
      INSERT INTO categoryArtikel (name)
      VALUES (?)
    `;
    const [result] = await dbpool.execute(SQLQuery, [name]);

    const newCategoryArtikel = new CategoryArtikel(result.insertId, name, new Date(), new Date());
    res.json({
      message: "CREATE NEW CATEGORY ARTIKEL SUCCESS",
      categoryArtikel: newCategoryArtikel,
    });
  } catch (error) {
    res.status(500).json({
      message: "CREATE NEW CATEGORY ARTIKEL FAILED",
      ServerMessage: error.message,
    });
  }
};

// Memperbarui kategori artikel
const updateCategoryArtikel = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    await ensureCategoryArtikelTableExists();

    const SQLQuery = `
      UPDATE categoryArtikel
      SET name = ?, updated_at = NOW()
      WHERE id = ?
    `;
    await dbpool.execute(SQLQuery, [name, id]);

    const updatedCategoryArtikel = new CategoryArtikel(id, name, new Date());
    res.json({
      message: "UPDATE CATEGORY ARTIKEL SUCCESS",
      categoryArtikel: updatedCategoryArtikel,
    });
  } catch (error) {
    res.status(500).json({
      message: "UPDATE CATEGORY ARTIKEL FAILED",
      ServerMessage: error.message,
    });
  }
};

// Menghapus kategori artikel
const deleteCategoryArtikel = async (req, res) => {
  const { id } = req.params;
  try {
    await ensureCategoryArtikelTableExists();

    const SQLQuery = "DELETE FROM categoryArtikel WHERE id = ?";
    await dbpool.execute(SQLQuery, [id]);

    res.json({
      message: "DELETE CATEGORY ARTIKEL SUCCESS",
      deletedCategoryArtikelId: id,
    });
  } catch (error) {
    res.status(500).json({
      message: "DELETE CATEGORY ARTIKEL FAILED",
      ServerMessage: error.message,
    });
  }
};

const getCategoryArtikelById = async (req, res) => {
  const { id } = req.params;
  try {
    await ensureCategoryArtikelTableExists();
    const SQLQuery = "SELECT * FROM categoryArtikel WHERE id = ?";
    const [rows] = await dbpool.execute(SQLQuery, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Category Artikel not found",
      });
    }

    const categoryArtikel = new CategoryArtikel(
      rows[0].id,
      rows[0].name,
      rows[0].created_at,
      rows[0].updated_at
    );

    res.json(categoryArtikel);
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve category artikel by ID",
      ServerMessage: error.message,
    });
  }
};
module.exports = {
  getAllCategoryArtikel,
  createNewCategoryArtikel,
  updateCategoryArtikel,
  deleteCategoryArtikel,
  getCategoryArtikelById,
  ensureCategoryArtikelTableExists,
};
