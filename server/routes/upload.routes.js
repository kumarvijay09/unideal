import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

// POST /api/upload - Upload single image file
router.post("/", authRequired, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to upload file.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided.",
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: "Image uploaded successfully.",
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
  });
});

export default router;
