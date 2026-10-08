import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import {
  seedUsers,
  seedListings,
  seedOffers,
  seedConversations,
  seedMessages,
  seedSavedListings,
} from "./seedData.js";

const DB_FILE = path.join(config.dataDir, "unideal.json");

// In-memory cache synced with disk
let dbCache = null;
let saveTimeout = null;

function ensureDataDirectory() {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
}

function loadDatabase() {
  ensureDataDirectory();

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (
        parsed.users &&
        parsed.listings &&
        parsed.offers &&
        parsed.messages &&
        parsed.savedListings
      ) {
        dbCache = parsed;
        return dbCache;
      }
    } catch (err) {
      console.warn("Could not parse existing database file. Re-initializing with seed data.", err);
    }
  }

  // Initialize with seed data
  dbCache = {
    version: "1.0",
    initializedAt: new Date().toISOString(),
    users: [...seedUsers],
    listings: [...seedListings],
    offers: [...seedOffers],
    conversations: [...seedConversations],
    messages: [...seedMessages],
    savedListings: [...seedSavedListings],
  };

  persistDatabaseSync();
  return dbCache;
}

function persistDatabaseSync() {
  ensureDataDirectory();
  try {
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(dbCache, null, 2), "utf-8");
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error("Failed to write database file:", err);
  }
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    persistDatabaseSync();
  }, 100);
}

function getDb() {
  if (!dbCache) {
    loadDatabase();
  }
  return dbCache;
}

/* ============================================================
   USER OPERATIONS
   ============================================================ */
export function getAllUsers() {
  return getDb().users.map(({ passwordHash, ...safeUser }) => safeUser);
}

export function getUserById(id) {
  const user = getDb().users.find((u) => u.id === id);
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export function getUserWithPasswordByEmail(email) {
  return getDb().users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function getUserByEmail(email) {
  const user = getUserWithPasswordByEmail(email);
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export function createUser({ name, email, passwordHash, university, campusLocation, hostel, phone, avatar }) {
  const db = getDb();
  const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const newUser = {
    id,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    university: university || "Campus University",
    campusLocation: campusLocation || "Main Campus",
    hostel: hostel || "",
    phone: phone || "",
    avatar:
      avatar ||
      `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80`,
    verified: true, // Auto-verified for campus student community
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  scheduleSave();

  const { passwordHash: _, ...safeUser } = newUser;
  return safeUser;
}

export function updateUser(id, updates) {
  const db = getDb();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;

  const user = db.users[idx];
  const updated = {
    ...user,
    ...updates,
    id: user.id, // prevent ID overwrite
    email: updates.email ? updates.email.toLowerCase() : user.email,
  };

  db.users[idx] = updated;
  scheduleSave();

  const { passwordHash, ...safeUser } = updated;
  return safeUser;
}

/* ============================================================
   LISTING OPERATIONS
   ============================================================ */
export function getListings({
  q = "",
  category = "All",
  tab = "All",
  condition = "",
  campus = "",
  minPrice,
  maxPrice,
  sellerId = "",
  status = "any",
  limit = 50,
  page = 1,
} = {}) {
  const db = getDb();
  let results = [...db.listings];

  // Status filter (unless requesting all)
  if (status && status !== "any") {
    results = results.filter((item) => (item.status || "available") === status);
  }

  // Category filter
  if (category && category !== "All") {
    results = results.filter(
      (item) => item.category?.toLowerCase() === category.toLowerCase(),
    );
  }

  // Campus location filter
  if (campus && campus !== "All") {
    results = results.filter(
      (item) => item.place?.toLowerCase().includes(campus.toLowerCase()),
    );
  }

  // Condition filter
  if (condition) {
    results = results.filter(
      (item) => item.condition?.toLowerCase() === condition.toLowerCase(),
    );
  }

  // Seller filter
  if (sellerId) {
    results = results.filter((item) => item.sellerId === sellerId);
  }

  // Search query
  if (q && q.trim()) {
    const query = q.trim().toLowerCase();
    results = results.filter(
      (item) =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.place?.toLowerCase().includes(query) ||
        item.seller?.toLowerCase().includes(query),
    );
  }

  // Price range filters
  if (minPrice !== undefined && !isNaN(minPrice)) {
    results = results.filter((item) => (item.numericPrice || 0) >= Number(minPrice));
  }
  if (maxPrice !== undefined && !isNaN(maxPrice)) {
    results = results.filter((item) => (item.numericPrice || 0) <= Number(maxPrice));
  }

  // Tab sort & filter logic
  if (tab === "Newest") {
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (tab === "Near you") {
    // Priority to hostel and campus core locations
    results.sort((a, b) => {
      const aScore = a.place?.toLowerCase().includes("hostel") ? 1 : 0;
      const bScore = b.place?.toLowerCase().includes("hostel") ? 1 : 0;
      return bScore - aScore;
    });
  } else {
    // Default newest order
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const total = results.length;
  const start = (page - 1) * limit;
  const paginated = results.slice(start, start + limit);

  return {
    listings: paginated,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
}

export function getListingById(id) {
  const db = getDb();
  const listingId = Number(id);
  const listing = db.listings.find((item) => item.id === listingId);
  if (!listing) return null;

  // Seller info
  const seller = listing.sellerId ? getUserById(listing.sellerId) : null;
  return {
    ...listing,
    sellerProfile: seller,
  };
}

export function incrementViews(id) {
  const db = getDb();
  const listingId = Number(id);
  const listing = db.listings.find((item) => item.id === listingId);
  if (listing) {
    listing.viewsCount = (listing.viewsCount || 0) + 1;
    scheduleSave();
  }
}

export function createListing({
  title,
  price,
  category,
  condition = "Good",
  place = "Campus",
  description = "",
  image,
  sellerUser,
}) {
  const db = getDb();
  const nextId = db.listings.length > 0 ? Math.max(...db.listings.map((l) => l.id)) + 1 : 1;

  // Normalize price
  const numPrice = typeof price === "number" ? price : parseFloat(String(price).replace(/[^0-9.]/g, "")) || 0;
  const formattedPrice = `₹${numPrice.toLocaleString("en-IN")}`;

  const defaultImage =
    image ||
    "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=900&q=85";

  const newListing = {
    id: nextId,
    title: title.trim(),
    price: formattedPrice,
    numericPrice: numPrice,
    tag: condition,
    condition,
    place: place.trim(),
    time: "Just now",
    seller: sellerUser?.name?.split(" ")[0] || "Student",
    sellerId: sellerUser?.id || "anonymous",
    category: category || "Other",
    description: description.trim(),
    image: defaultImage,
    status: "available",
    savesCount: 0,
    viewsCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.listings.unshift(newListing);
  scheduleSave();
  return newListing;
}

export function updateListing(id, updates, sellerId) {
  const db = getDb();
  const listingId = Number(id);
  const idx = db.listings.findIndex((item) => item.id === listingId);
  if (idx === -1) return null;

  const item = db.listings[idx];
  if (sellerId && item.sellerId !== sellerId) {
    const error = new Error("Not authorized to edit this listing");
    error.status = 403;
    throw error;
  }

  let formattedPrice = item.price;
  let numPrice = item.numericPrice;
  if (updates.price !== undefined) {
    numPrice = typeof updates.price === "number"
      ? updates.price
      : parseFloat(String(updates.price).replace(/[^0-9.]/g, "")) || numPrice;
    formattedPrice = `₹${numPrice.toLocaleString("en-IN")}`;
  }

  const updated = {
    ...item,
    ...updates,
    price: formattedPrice,
    numericPrice: numPrice,
    tag: updates.condition || item.tag,
    updatedAt: new Date().toISOString(),
  };

  db.listings[idx] = updated;
  scheduleSave();
  return updated;
}

export function deleteListing(id, sellerId) {
  const db = getDb();
  const listingId = Number(id);
  const idx = db.listings.findIndex((item) => item.id === listingId);
  if (idx === -1) return false;

  if (sellerId && db.listings[idx].sellerId !== sellerId) {
    const error = new Error("Not authorized to delete this listing");
    error.status = 403;
    throw error;
  }

  db.listings.splice(idx, 1);
  // remove associated bookmarks
  db.savedListings = db.savedListings.filter((s) => s.listingId !== listingId);
  scheduleSave();
  return true;
}

/* ============================================================
   SAVED LISTINGS / WISHLIST
   ============================================================ */
export function toggleSaveListing(userId, listingId) {
  const db = getDb();
  const lid = Number(listingId);
  const existingIdx = db.savedListings.findIndex(
    (s) => s.userId === userId && s.listingId === lid,
  );

  const listing = db.listings.find((l) => l.id === lid);

  if (existingIdx !== -1) {
    // Unsave
    db.savedListings.splice(existingIdx, 1);
    if (listing && listing.savesCount > 0) listing.savesCount -= 1;
    scheduleSave();
    return { saved: false, savesCount: listing ? listing.savesCount : 0 };
  } else {
    // Save
    db.savedListings.push({
      id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      listingId: lid,
      savedAt: new Date().toISOString(),
    });
    if (listing) listing.savesCount = (listing.savesCount || 0) + 1;
    scheduleSave();
    return { saved: true, savesCount: listing ? listing.savesCount : 1 };
  }
}

export function getSavedListingIdsForUser(userId) {
  const db = getDb();
  return db.savedListings
    .filter((s) => s.userId === userId)
    .map((s) => s.listingId);
}

export function getSavedListingsForUser(userId) {
  const db = getDb();
  const savedIds = new Set(getSavedListingIdsForUser(userId));
  return db.listings.filter((item) => savedIds.has(item.id));
}

/* ============================================================
   OFFER & BARGAINING OPERATIONS
   ============================================================ */
export function getOffersForUser(userId) {
  const db = getDb();
  return db.offers.filter(
    (offer) => offer.buyerId === userId || offer.sellerId === userId,
  );
}

export function getOffersForListing(listingId) {
  const db = getDb();
  const lid = Number(listingId);
  return db.offers.filter((offer) => offer.listingId === lid);
}

export function getOfferById(id) {
  const db = getDb();
  return db.offers.find((offer) => offer.id === id) || null;
}

export function createOffer({ listingId, buyerUser, offerAmount, message = "" }) {
  const db = getDb();
  const lid = Number(listingId);
  const listing = db.listings.find((l) => l.id === lid);
  if (!listing) {
    const error = new Error("Listing not found");
    error.status = 404;
    throw error;
  }

  if (listing.sellerId === buyerUser.id) {
    const error = new Error("You cannot make an offer on your own listing");
    error.status = 400;
    throw error;
  }

  const numOffer = Number(offerAmount);
  if (isNaN(numOffer) || numOffer <= 0) {
    const error = new Error("Please enter a valid offer amount");
    error.status = 400;
    throw error;
  }

  const seller = getUserById(listing.sellerId);

  const offer = {
    id: `offer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    listingId: lid,
    listingTitle: listing.title,
    originalPrice: listing.numericPrice,
    offerAmount: numOffer,
    buyerId: buyerUser.id,
    buyerName: buyerUser.name,
    sellerId: listing.sellerId,
    sellerName: seller?.name || listing.seller,
    status: "pending",
    message: message.trim() || `I'd like to offer ₹${numOffer.toLocaleString("en-IN")} for this item!`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.offers.unshift(offer);

  // Automatically start or update conversation
  const conv = getOrCreateConversation({
    listingId: lid,
    buyerId: buyerUser.id,
    sellerId: listing.sellerId,
  });

  // Post message in conversation
  createMessage({
    conversationId: conv.id,
    listingId: lid,
    senderId: buyerUser.id,
    senderName: buyerUser.name,
    receiverId: listing.sellerId,
    receiverName: offer.sellerName,
    text: `Offer made: ₹${numOffer.toLocaleString("en-IN")}${message ? ` - "${message.trim()}"` : ""}`,
  });

  scheduleSave();
  return offer;
}

export function updateOfferStatus(offerId, status, actorId) {
  const db = getDb();
  const offer = db.offers.find((o) => o.id === offerId);
  if (!offer) {
    const error = new Error("Offer not found");
    error.status = 404;
    throw error;
  }

  // Only seller can accept or reject
  // Buyer can cancel
  if (status === "accepted" || status === "rejected") {
    if (offer.sellerId !== actorId) {
      const error = new Error("Only the seller can accept or reject this offer");
      error.status = 403;
      throw error;
    }
  } else if (status === "cancelled") {
    if (offer.buyerId !== actorId) {
      const error = new Error("Only the buyer can cancel this offer");
      error.status = 403;
      throw error;
    }
  }

  offer.status = status;
  offer.updatedAt = new Date().toISOString();

  // If accepted, mark listing status as processing
  if (status === "accepted") {
    const listing = db.listings.find((l) => l.id === offer.listingId);
    if (listing && (listing.status === "available" || listing.status === "reserved")) {
      listing.status = "processing";
    }
  } else if (status === "rejected" || status === "cancelled") {
    const listing = db.listings.find((l) => l.id === offer.listingId);
    if (listing && (listing.status === "processing" || listing.status === "reserved")) {
      listing.status = "available";
    }
  }

  // Notify in conversation
  const conv = getOrCreateConversation({
    listingId: offer.listingId,
    buyerId: offer.buyerId,
    sellerId: offer.sellerId,
  });

  const actor = getUserById(actorId);
  const statusText =
    status === "accepted"
      ? `Deal accepted! Offer for ₹${offer.offerAmount.toLocaleString("en-IN")} was agreed. Ready to meet on campus!`
      : `Offer for ₹${offer.offerAmount.toLocaleString("en-IN")} was ${status}.`;

  createMessage({
    conversationId: conv.id,
    listingId: offer.listingId,
    senderId: actorId,
    senderName: actor?.name || "Student",
    receiverId: actorId === offer.sellerId ? offer.buyerId : offer.sellerId,
    receiverName: actorId === offer.sellerId ? offer.buyerName : offer.sellerName,
    text: statusText,
  });

  scheduleSave();
  return offer;
}

/* ============================================================
   CONVERSATION & MESSAGING OPERATIONS
   ============================================================ */
export function getOrCreateConversation({ listingId, buyerId, sellerId }) {
  const db = getDb();
  const lid = Number(listingId);
  let conv = db.conversations.find(
    (c) =>
      c.listingId === lid &&
      ((c.buyerId === buyerId && c.sellerId === sellerId) ||
        (c.buyerId === sellerId && c.sellerId === buyerId)),
  );

  if (!conv) {
    conv = {
      id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      listingId: lid,
      buyerId,
      sellerId,
      lastMessage: "Conversation started",
      lastMessageAt: new Date().toISOString(),
      unreadCountBuyer: 0,
      unreadCountSeller: 0,
    };
    db.conversations.unshift(conv);
    scheduleSave();
  }

  return conv;
}

export function getConversationsForUser(userId) {
  const db = getDb();
  const userConvs = db.conversations.filter(
    (c) => c.buyerId === userId || c.sellerId === userId,
  );

  return userConvs.map((conv) => {
    const partnerId = conv.buyerId === userId ? conv.sellerId : conv.buyerId;
    const partner = getUserById(partnerId);
    const listing = db.listings.find((l) => l.id === conv.listingId);
    return {
      ...conv,
      partner,
      listing,
    };
  });
}

export function getMessagesForConversation(conversationId, userId) {
  const db = getDb();
  const conv = db.conversations.find((c) => c.id === conversationId);
  if (!conv) return [];

  // Check authorization
  if (conv.buyerId !== userId && conv.sellerId !== userId) {
    const error = new Error("Not authorized to view this conversation");
    error.status = 403;
    throw error;
  }

  // Reset unread for this user
  if (conv.buyerId === userId) {
    conv.unreadCountBuyer = 0;
  } else {
    conv.unreadCountSeller = 0;
  }
  scheduleSave();

  return db.messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export function createMessage({
  conversationId,
  listingId,
  senderId,
  senderName,
  receiverId,
  receiverName,
  text,
}) {
  const db = getDb();
  const msg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    conversationId,
    listingId: Number(listingId),
    senderId,
    senderName,
    receiverId,
    receiverName,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };

  db.messages.push(msg);

  // Update conversation last message
  const conv = db.conversations.find((c) => c.id === conversationId);
  if (conv) {
    conv.lastMessage = text.trim();
    conv.lastMessageAt = msg.createdAt;
    if (conv.buyerId === receiverId) {
      conv.unreadCountBuyer = (conv.unreadCountBuyer || 0) + 1;
    } else {
      conv.unreadCountSeller = (conv.unreadCountSeller || 0) + 1;
    }
  }

  scheduleSave();
  return msg;
}

/* ============================================================
   STATS & METADATA
   ============================================================ */
export function getStats() {
  const db = getDb();
  const activeListings = db.listings.filter((l) => l.status === "available").length;
  const verifiedStudents = db.users.filter((u) => u.verified).length;
  const totalDealsAgreed = db.offers.filter((o) => o.status === "accepted").length;
  const activeOffers = db.offers.filter((o) => o.status === "pending").length;

  const categoryCounts = {};
  for (const item of db.listings) {
    const cat = item.category || "Other";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  return {
    activeListings,
    verifiedStudents,
    totalDealsAgreed,
    activeOffers,
    categoryCounts,
    campus: "Delhi Technological University & Allied Campuses",
  };
}
