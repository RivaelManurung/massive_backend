const jwt = require("jsonwebtoken");

// Middleware untuk memverifikasi token JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error("JWT Error:", err); // Logging error
        return res.status(403).json({ message: "Invalid or expired token" });
      }
      req.user = user; // Menyimpan user dari token
      next();
    });
  } else {
    return res.status(401).json({
      message: "Unauthorized: No token provided or token format invalid",
    });
  }
};

// Middleware untuk memastikan hanya admin yang bisa mengakses
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next(); // Lanjutkan jika user adalah admin
};

module.exports = {
  authenticateJWT,
  adminMiddleware,
};
