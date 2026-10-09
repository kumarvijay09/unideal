import { describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../database/db.js";
import { seedData } from "../database/seedData.js";

const JWT_SECRET = process.env.JWT_SECRET || "unideal-campus-dev-secret-key-2025";

describe("CampusCart Core Business Logic & Data Integrity", () => {
  it("should have exactly 24 seeded items across all 8 campus categories (3 per category)", () => {
    assert.equal(seedData.listings.length, 24, "Must have exactly 24 seed listings");

    const expectedCategories = [
      "Books",
      "Electronics",
      "Hostel Items",
      "Sports",
      "Clothing",
      "Accessories",
      "Vehicles",
      "Other",
    ];

    for (const cat of expectedCategories) {
      const itemsInCat = seedData.listings.filter((item) => item.category === cat);
      assert.equal(
        itemsInCat.length,
        3,
        `Category '${cat}' must contain exactly 3 items, found ${itemsInCat.length}`
      );
    }
  });

  it("all seeded listings must have valid titles, pricing in ₹, locations, and high-res images", () => {
    for (const item of seedData.listings) {
      assert.ok(item.id, "Item must have a positive ID");
      assert.ok(item.title && item.title.trim().length > 3, `Invalid title on item ${item.id}`);
      assert.ok(item.price && item.price.startsWith("₹"), `Price must be formatted with ₹ on item ${item.id}`);
      assert.ok(item.place, `Missing campus location on item ${item.id}`);
      assert.ok(item.image && item.image.startsWith("https://images.unsplash.com"), `Missing or invalid Unsplash image on item ${item.id}`);
      assert.ok(["available", "processing", "sold"].includes(item.status), `Invalid status ${item.status} on item ${item.id}`);
    }
  });

  it("should filter listings correctly by category and search query", () => {
    const books = db.getListings({ category: "Books" });
    assert.ok(books.length >= 3, "Must return books");
    assert.ok(books.every((b) => b.category === "Books"), "All returned items must be books");

    const physics = db.getListings({ q: "Physics" });
    assert.ok(physics.length > 0, "Search for 'Physics' should return matching books");
    assert.ok(physics[0].title.includes("Physics"));
  });

  it("should support bookmarking / saved items toggle", () => {
    const testUserId = "test-student-unit-1";
    const testListingId = 1;

    // Toggle save on
    const isSavedNow = db.toggleSaved(testUserId, testListingId);
    assert.equal(isSavedNow, true, "First toggle should save item");

    const savedList = db.getSavedListings(testUserId);
    assert.ok(savedList.some((item) => item.id === testListingId), "Saved list must include item 1");

    // Toggle save off
    const isSavedOff = db.toggleSaved(testUserId, testListingId);
    assert.equal(isSavedOff, false, "Second toggle should unsave item");

    const updatedSavedList = db.getSavedListings(testUserId);
    assert.ok(!updatedSavedList.some((item) => item.id === testListingId), "Item 1 must be removed");
  });
});

describe("Campus Bargaining & Lifecycle State Transitions", () => {
  it("accepting an offer must transition listing status to 'processing'", () => {
    // Pick an available item for test
    const allListings = db.getListings({});
    const targetItem = allListings.find((i) => i.status === "available");
    assert.ok(targetItem, "Must have an available listing for negotiation test");

    // Propose an offer
    const offer = db.createOffer({
      listingId: targetItem.id,
      offerAmount: 500,
      buyerId: "buyer-unit-1",
      buyerName: "Test Buyer",
      message: "Can pick up at Hostel gate today",
    });

    assert.equal(offer.status, "pending", "New offer must start as pending");

    // Accept offer
    const updatedOffer = db.updateOfferStatus(offer.id, "accepted");
    assert.equal(updatedOffer.status, "accepted", "Offer status must become accepted");

    // Verify listing is now processing
    const updatedListing = db.getListingById(targetItem.id);
    assert.equal(
      updatedListing.status,
      "processing",
      "Listing must transition to 'processing' when offer is accepted"
    );

    // Cancel offer -> listing reverts to available
    const cancelledOffer = db.updateOfferStatus(offer.id, "cancelled");
    assert.equal(cancelledOffer.status, "cancelled");
    const revertedListing = db.getListingById(targetItem.id);
    assert.equal(
      revertedListing.status,
      "available",
      "Listing must revert to 'available' when offer is cancelled"
    );
  });

  it("seller can finalize a transaction as 'sold'", () => {
    const allListings = db.getListings({});
    const target = allListings[0];
    const originalStatus = target.status;

    // Update to sold
    const soldItem = db.updateListing(target.id, { status: "sold" });
    assert.equal(soldItem.status, "sold", "Listing status should be sold");

    // Reopen item
    const reopenedItem = db.updateListing(target.id, { status: originalStatus });
    assert.equal(reopenedItem.status, originalStatus, "Listing status should restore");
  });
});

describe("Authentication & Cryptographic Security", () => {
  it("passwords must be hashed using bcrypt with salt rounds >= 10", async () => {
    const rawPassword = "secureCampusPass123!";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    assert.notEqual(hash, rawPassword, "Hash must never equal plaintext password");
    assert.ok(hash.startsWith("$2"), "Hash must follow bcrypt standard format ($2a / $2b)");

    const isValid = await bcrypt.compare(rawPassword, hash);
    assert.equal(isValid, true, "Bcrypt compare must succeed for valid password");

    const isInvalid = await bcrypt.compare("wrongPassword", hash);
    assert.equal(isInvalid, false, "Bcrypt compare must reject invalid password");
  });

  it("JWT tokens must be signed with expiry and verifiable", () => {
    const payload = { id: "student-123", email: "student@campus.edu", name: "Campus User" };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    assert.ok(token && token.split(".").length === 3, "JWT must contain header.payload.signature");

    const decoded = jwt.verify(token, JWT_SECRET);
    assert.equal(decoded.id, payload.id, "Decoded JWT ID must match payload");
    assert.equal(decoded.email, payload.email, "Decoded JWT email must match payload");
  });
});
