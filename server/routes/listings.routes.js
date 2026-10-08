import { Router } from "express";
import {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  toggleSaveListing,
  getSavedListingsForUser,
  getSavedListingIdsForUser,
  incrementViews,
} from "../database/db.js";
import { authRequired, optionalAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/listings/saved - Get all saved listings for current user
router.get("/saved", authRequired, (req, res) => {
  try {
    const saved = getSavedListingsForUser(req.user.id);
    const enriched = saved.map((item) => ({ ...item, isSaved: true }));
    res.json({
      success: true,
      listings: enriched,
      total: enriched.length,
    });
  } catch (err) {
    console.error("Get saved listings error:", err);
    res.status(500).json({ success: false, message: "Could not retrieve saved listings." });
  }
});

// GET /api/listings - Browse and search listings with multiple filters
router.get("/", optionalAuth, (req, res) => {
  try {
    const {
      q,
      category,
      tab,
      campus,
      condition,
      minPrice,
      maxPrice,
      sellerId,
      status,
      page,
      limit,
    } = req.query;

    const result = getListings({
      q,
      category,
      tab,
      campus,
      condition,
      minPrice,
      maxPrice,
      sellerId,
      status,
      page,
      limit,
    });

    // Enrich with user's saved state if authenticated
    let savedIds = new Set();
    if (req.user) {
      savedIds = new Set(getSavedListingIdsForUser(req.user.id));
    }

    const enrichedListings = result.listings.map((item) => ({
      ...item,
      isSaved: savedIds.has(item.id),
    }));

    res.json({
      success: true,
      ...result,
      listings: enrichedListings,
    });
  } catch (err) {
    console.error("Listings query error:", err);
    res.status(500).json({ success: false, message: "Could not retrieve listings." });
  }
});

// GET /api/listings/:id - Detailed listing view with seller profile
router.get("/:id", optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const listing = getListingById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found.",
      });
    }

    incrementViews(id);

    let isSaved = false;
    if (req.user) {
      const savedIds = new Set(getSavedListingIdsForUser(req.user.id));
      isSaved = savedIds.has(listing.id);
    }

    res.json({
      success: true,
      listing: {
        ...listing,
        isSaved,
      },
    });
  } catch (err) {
    console.error("Get listing error:", err);
    res.status(500).json({ success: false, message: "Could not retrieve listing details." });
  }
});

// POST /api/listings - Post a new campus listing
router.post("/", authRequired, (req, res) => {
  try {
    const {
      title,
      price,
      category,
      condition = "Good",
      place,
      description = "",
      image,
    } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, price, and category are required.",
      });
    }

    const campusPlace = place || req.user.campusLocation || "Campus";

    const newListing = createListing({
      title,
      price,
      category,
      condition,
      place: campusPlace,
      description,
      image,
      sellerUser: req.user,
    });

    res.status(201).json({
      success: true,
      message: "Listing posted to campus marketplace successfully!",
      listing: newListing,
    });
  } catch (err) {
    console.error("Create listing error:", err);
    res.status(500).json({ success: false, message: "Failed to create listing." });
  }
});

// PUT /api/listings/:id - Update existing listing
router.put("/:id", authRequired, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = updateListing(id, updates, req.user.id);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Listing not found.",
      });
    }

    res.json({
      success: true,
      message: "Listing updated successfully.",
      listing: updated,
    });
  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ success: false, message: err.message });
    }
    console.error("Update listing error:", err);
    res.status(500).json({ success: false, message: "Failed to update listing." });
  }
});

// DELETE /api/listings/:id - Remove listing
router.delete("/:id", authRequired, (req, res) => {
  try {
    const { id } = req.params;
    const deleted = deleteListing(id, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Listing not found.",
      });
    }

    res.json({
      success: true,
      message: "Listing removed from marketplace.",
    });
  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ success: false, message: err.message });
    }
    console.error("Delete listing error:", err);
    res.status(500).json({ success: false, message: "Failed to delete listing." });
  }
});

// PATCH /api/listings/:id - Partial update (mark as sold, reopen, etc.)
router.patch("/:id", authRequired, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = updateListing(id, updates, req.user.id);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Listing not found.",
      });
    }

    res.json({
      success: true,
      message: "Listing updated successfully.",
      listing: updated,
    });
  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ success: false, message: err.message });
    }
    console.error("Patch listing error:", err);
    res.status(500).json({ success: false, message: "Failed to update listing." });
  }
});

// POST /api/listings/:id/save - Toggle bookmark/wishlist
router.post("/:id/save", authRequired, (req, res) => {
  try {
    const { id } = req.params;
    const result = toggleSaveListing(req.user.id, id);

    res.json({
      success: true,
      saved: result.saved,
      savesCount: result.savesCount,
      message: result.saved ? "Saved to your campus wishlist" : "Removed from saved listings",
    });
  } catch (err) {
    console.error("Save listing error:", err);
    res.status(500).json({ success: false, message: "Failed to update saved status." });
  }
});

export default router;
