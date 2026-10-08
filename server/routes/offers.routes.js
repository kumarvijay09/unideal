import { Router } from "express";
import {
  getOffersForUser,
  getOffersForListing,
  getOfferById,
  createOffer,
  updateOfferStatus,
  getListingById,
} from "../database/db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

// GET /api/offers - Get incoming & outgoing offers for current student
router.get("/", authRequired, (req, res) => {
  try {
    const userId = req.user.id;
    const offers = getOffersForUser(userId);

    const incoming = offers.filter((o) => o.sellerId === userId);
    const outgoing = offers.filter((o) => o.buyerId === userId);

    res.json({
      success: true,
      incoming,
      outgoing,
      total: offers.length,
    });
  } catch (err) {
    console.error("Get offers error:", err);
    res.status(500).json({ success: false, message: "Could not retrieve offers." });
  }
});

// GET /api/offers/listing/:listingId - Get offers on a listing
router.get("/listing/:listingId", authRequired, (req, res) => {
  try {
    const { listingId } = req.params;
    const listing = getListingById(listingId);

    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found." });
    }

    if (listing.sellerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the seller can view all offers on this listing.",
      });
    }

    const offers = getOffersForListing(listingId);
    res.json({
      success: true,
      offers,
    });
  } catch (err) {
    console.error("Get listing offers error:", err);
    res.status(500).json({ success: false, message: "Could not retrieve listing offers." });
  }
});

// POST /api/offers - Propose a bargain / make an offer
router.post("/", authRequired, (req, res) => {
  try {
    const { listingId, offerAmount, message } = req.body;

    if (!listingId || !offerAmount) {
      return res.status(400).json({
        success: false,
        message: "listingId and offerAmount are required.",
      });
    }

    const offer = createOffer({
      listingId,
      buyerUser: req.user,
      offerAmount,
      message,
    });

    res.status(201).json({
      success: true,
      message: `Offer of ₹${Number(offerAmount).toLocaleString("en-IN")} submitted to seller!`,
      offer,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    console.error("Create offer error:", err);
    res.status(500).json({ success: false, message: "Failed to submit offer." });
  }
});

// PATCH /api/offers/:id/status - Accept, reject, or cancel an offer
router.patch("/:id/status", authRequired, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'accepted', 'rejected', or 'cancelled'.",
      });
    }

    const updated = updateOfferStatus(id, status, req.user.id);

    res.json({
      success: true,
      message: `Offer ${status} successfully.`,
      offer: updated,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    console.error("Update offer status error:", err);
    res.status(500).json({ success: false, message: "Failed to update offer status." });
  }
});

export default router;
