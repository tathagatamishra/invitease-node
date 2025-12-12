// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "replace_me_with_a_strong_secret";

exports.verifyToken = (req, res, next) => {
  const auth = req.headers.authorization || req.headers["x-access-token"] || "";
  const token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : (auth || null);

  if (!token) return res.status(401).json({ ok: false, message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: "Invalid or expired token" });
  }
};
