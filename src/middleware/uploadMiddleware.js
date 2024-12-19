const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Membuat folder jika belum ada
const ensureFolderExists = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`Folder '${folderPath}' created.`);
  }
};

// Path untuk folder uploads
const uploadsPath = path.join(__dirname, "../../uploads");
const thumbnailsPath = path.join(uploadsPath, "thumbnails");
const videosPath = path.join(uploadsPath, "videos");
const imagesPath = path.join(uploadsPath, "images");

// Pastikan folder yang diperlukan ada
ensureFolderExists(thumbnailsPath);
ensureFolderExists(videosPath);
ensureFolderExists(imagesPath);

// Konfigurasi storage untuk menyimpan file di folder yang sesuai
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Menentukan folder tujuan berdasarkan fieldname
    if (file.fieldname === "thumbnailUrl") {
      cb(null, thumbnailsPath); // Folder untuk thumbnail
    } else if (file.fieldname === "videoUrl") {
      cb(null, videosPath); // Folder untuk video
    } else if (file.fieldname === "imageUrl") {
      cb(null, imagesPath); // Folder untuk gambar artikel
    } else {
      cb(new Error("Invalid file field!"), false); // Jika field tidak valid
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Filter untuk memastikan hanya file tertentu yang bisa diunggah
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/png"];
  const allowedVideoTypes = ["video/mp4"];

  // Validasi berdasarkan fieldname
  if (file.fieldname === "thumbnailUrl" || file.fieldname === "imageUrl") {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpeg and .png files are allowed for images!"), false);
    }
  } else if (file.fieldname === "videoUrl") {
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .mp4 files are allowed for videos!"), false);
    }
  } else {
    cb(new Error("Invalid file field!"), false);
  }
};

// Konfigurasi multer untuk upload file
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // Set batasan ukuran file maksimal 200MB
});

module.exports = upload;
