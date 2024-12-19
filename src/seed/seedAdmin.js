require("dotenv").config();
const mysql = require("mysql2");

const dbpool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

(async () => {
  try {
    const [rows] = await dbpool.promise().query("SELECT 1");
    console.log("Koneksi berhasil:", rows);
  } catch (error) {
    console.error("Error koneksi database:", error.message);
  }
})();
