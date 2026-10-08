import { Router } from "express";
import {
  getConversationsForUser,
  getMessagesForConversation,
  createMessage,
  getOrCreateConversation,
  getListingById,
  getUserById,
} from "../database/db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

// GET /api/messages/conversations - List all chats for current user
router.get("/conversations", authRequired, (req, res) => {
  try {
    const convs = getConversationsForUser(req.user.id);
    res.json({
      success: true,
      conversations: convs,
      total: convs.length,
    });
  } catch (err) {
    console.error("Get conversations error:", err);
    res.status(500).json({ success: false, message: "Could not retrieve conversations." });
  }
});

// GET /api/messages/conversations/:id - Get full chat thread
router.get("/conversations/:id", authRequired, (req, res) => {
  try {
    const { id } = req.params;
    const messages = getMessagesForConversation(id, req.user.id);
    res.json({
      success: true,
      messages,
      total: messages.length,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    console.error("Get messages error:", err);
    res.status(500).json({ success: false, message: "Could not retrieve messages." });
  }
});

// POST /api/messages/start - Find or initialize conversation for a listing
router.post("/start", authRequired, (req, res) => {
  try {
    const { listingId, sellerId } = req.body;

    if (!listingId) {
      return res.status(400).json({ success: false, message: "listingId is required." });
    }

    const listing = getListingById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found." });
    }

    const targetSellerId = sellerId || listing.sellerId;
    if (targetSellerId === req.user.id) {
      return res.status(400).json({ success: false, message: "You cannot message yourself." });
    }

    const conv = getOrCreateConversation({
      listingId: Number(listingId),
      buyerId: req.user.id,
      sellerId: targetSellerId,
    });

    const partner = getUserById(targetSellerId);
    const messages = getMessagesForConversation(conv.id, req.user.id);

    res.json({
      success: true,
      conversation: {
        ...conv,
        partner,
        listing,
      },
      messages,
    });
  } catch (err) {
    console.error("Start conversation error:", err);
    res.status(500).json({ success: false, message: "Could not initiate conversation." });
  }
});

// POST /api/messages/send - Send a chat message
router.post("/send", authRequired, (req, res) => {
  try {
    let { conversationId, listingId, receiverId, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Message text cannot be empty." });
    }

    let conv = null;
    if (conversationId) {
      const convs = getConversationsForUser(req.user.id);
      conv = convs.find((c) => c.id === conversationId);
      if (!conv) {
        return res.status(404).json({ success: false, message: "Conversation not found." });
      }
      listingId = conv.listingId;
      receiverId = conv.buyerId === req.user.id ? conv.sellerId : conv.buyerId;
    } else if (listingId && receiverId) {
      conv = getOrCreateConversation({
        listingId: Number(listingId),
        buyerId: req.user.id,
        sellerId: receiverId,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Either conversationId or (listingId and receiverId) must be provided.",
      });
    }

    const receiver = getUserById(receiverId);

    const message = createMessage({
      conversationId: conv.id,
      listingId,
      senderId: req.user.id,
      senderName: req.user.name,
      receiverId,
      receiverName: receiver?.name || "Student",
      text,
    });

    res.status(201).json({
      success: true,
      message,
    });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ success: false, message: "Failed to send message." });
  }
});

export default router;
