import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { getUserById } from "../database/db.js";

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      verified: user.verified,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in with your student account.",
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User session expired or user no longer exists.",
      });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authorization token.",
    });
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = getUserById(decoded.id);
    req.user = user || null;
  } catch (err) {
    req.user = null;
  }
  next();
}
