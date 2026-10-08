import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  getUserByEmail,
  getUserWithPasswordByEmail,
  getUserById,
  createUser,
  getAllUsers,
  getSavedListingIdsForUser,
  getListings,
  getOffersForUser,
} from "../database/db.js";
import { signToken, authRequired } from "../middleware/auth.js";

const router = Router();

// GET /api/auth/demo-users - List demo accounts for easy testing
router.get("/demo-users", (req, res) => {
  const users = getAllUsers();
  res.json({
    success: true,
    users: users.slice(0, 5),
  });
});

// POST /api/auth/demo-login - Instant login as a demo student
router.post("/demo-login", (req, res) => {
  const { email = "aarav@campus.edu", userId } = req.body;
  let user = null;

  if (userId) {
    user = getUserById(userId);
  } else if (email) {
    user = getUserByEmail(email);
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Demo student not found.",
    });
  }

  const token = signToken(user);
  res.json({
    success: true,
    message: `Logged in as ${user.name}`,
    token,
    user,
  });
});

// POST /api/auth/register - Register new student account
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, university, campusLocation, hostel, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, campus email, and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const existing = getUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists. Please log in.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = createUser({
      name,
      email,
      passwordHash,
      university: university || "Campus University",
      campusLocation: campusLocation || "North Campus",
      hostel,
      phone,
    });

    const token = signToken(newUser);
    res.status(201).json({
      success: true,
      message: "Student account created successfully!",
      token,
      user: newUser,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during registration.",
    });
  }
});

// POST /api/auth/login - Student login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const userWithPw = getUserWithPasswordByEmail(email);
    if (!userWithPw) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const match = await bcrypt.compare(password, userWithPw.passwordHash);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const { passwordHash, ...safeUser } = userWithPw;
    const token = signToken(safeUser);

    res.json({
      success: true,
      message: `Welcome back, ${safeUser.name}!`,
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
});

// GET /api/auth/me - Current student profile with metrics
router.get("/me", authRequired, (req, res) => {
  const userId = req.user.id;
  const savedIds = getSavedListingIdsForUser(userId);
  const myListings = getListings({ sellerId: userId, status: "any" }).listings;
  const myOffers = getOffersForUser(userId);

  res.json({
    success: true,
    user: {
      ...req.user,
      stats: {
        savedCount: savedIds.length,
        myListingsCount: myListings.length,
        activeOffersCount: myOffers.filter((o) => o.status === "pending").length,
      },
    },
  });
});

export default router;
