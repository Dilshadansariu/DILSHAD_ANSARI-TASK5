// middleware/auth.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

// checks if request has a valid token
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  // header format: "Bearer <token>"
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, name, email }
    next();
  } catch (err) {
    console.log("token error:", err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

// only allow admin (professor) role
function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
}

// only allow student role
function isStudent(req, res, next) {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Students only" });
  }
  next();
}

module.exports = { verifyToken, isAdmin, isStudent };
