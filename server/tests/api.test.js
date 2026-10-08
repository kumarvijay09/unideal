// Smoke test suite for UniDeal Backend API
const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000";

async function runTests() {
  console.log(`Starting UniDeal API verification tests against ${BASE_URL}...`);
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Health check
  await test("GET /api/health", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== "ok") throw new Error(`Invalid status: ${data.status}`);
  });

  // 2. Metadata & categories
  await test("GET /api/meta", async () => {
    const res = await fetch(`${BASE_URL}/api/meta`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.categories || data.categories.length === 0) throw new Error("No categories returned");
    if (!data.locations || data.locations.length === 0) throw new Error("No campus locations returned");
  });

  // 3. Demo login
  let aaravToken = "";
  let aaravUser = null;
  await test("POST /api/auth/demo-login (Aarav)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/demo-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "aarav@campus.edu" }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.token) throw new Error("No token returned");
    aaravToken = data.token;
    aaravUser = data.user;
  });

  // 4. Verify auth /me
  await test("GET /api/auth/me", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${aaravToken}` },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.user.email !== "aarav@campus.edu") throw new Error(`Wrong user: ${data.user.email}`);
  });

  // 5. Register new student
  let studentToken = "";
  const testEmail = `student_${Date.now()}@campus.edu`;
  await test("POST /api/auth/register", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Campus Student",
        email: testEmail,
        password: "securepassword123",
        university: "Delhi Technological University",
        campusLocation: "North Campus",
      }),
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.token) throw new Error("No token returned from register");
    studentToken = data.token;
  });

  // 6. Get all listings
  await test("GET /api/listings", async () => {
    const res = await fetch(`${BASE_URL}/api/listings`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.listings) || data.listings.length === 0) {
      throw new Error("No listings returned");
    }
  });

  // 7. Filter listings by category
  await test("GET /api/listings?category=Books", async () => {
    const res = await fetch(`${BASE_URL}/api/listings?category=Books`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.listings.every((l) => l.category === "Books")) {
      throw new Error("Returned non-book listings");
    }
  });

  // 8. Search listings
  await test("GET /api/listings?q=Engineering", async () => {
    const res = await fetch(`${BASE_URL}/api/listings?q=Engineering`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.listings.length === 0) throw new Error("Engineering books not found in search");
  });

  // 9. Create a new listing as authenticated student
  let createdListingId = null;
  await test("POST /api/listings (Create Item)", async () => {
    const res = await fetch(`${BASE_URL}/api/listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        title: "Scientific Graphing Calculator TI-84",
        price: 1500,
        category: "Electronics",
        condition: "Like new",
        place: "Hostel Block A",
        description: "Barely used for one calculus semester. Comes with USB cable.",
      }),
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.listing || !data.listing.id) throw new Error("Listing creation failed");
    createdListingId = data.listing.id;
  });

  // 10. Toggle save / wishlist
  await test("POST /api/listings/:id/save (Bookmark)", async () => {
    const res = await fetch(`${BASE_URL}/api/listings/3/save`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (typeof data.saved !== "boolean") throw new Error("Invalid save response");
  });

  // 11. View saved listings
  await test("GET /api/listings/saved", async () => {
    const res = await fetch(`${BASE_URL}/api/listings/saved`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.listings) || data.listings.length === 0) {
      throw new Error("Saved listings empty after saving");
    }
  });

  // 12. Make an offer on created listing
  let offerId = null;
  await test("POST /api/offers (Make bargain offer)", async () => {
    const res = await fetch(`${BASE_URL}/api/offers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aaravToken}`,
      },
      body: JSON.stringify({
        listingId: createdListingId,
        offerAmount: 1300,
        message: "Can pick up at Hostel Block A today for 1300!",
      }),
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.offer || !data.offer.id) throw new Error("Offer creation failed");
    offerId = data.offer.id;
  });

  // 13. Accept offer as creator
  await test("PATCH /api/offers/:id/status (Accept offer)", async () => {
    const res = await fetch(`${BASE_URL}/api/offers/${offerId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ status: "accepted" }),
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.offer.status !== "accepted") throw new Error("Status was not updated to accepted");
  });

  // 14. Messaging: send message in conversation
  await test("POST /api/messages/send", async () => {
    const res = await fetch(`${BASE_URL}/api/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        listingId: 1,
        receiverId: aaravUser.id,
        text: "Thanks Aarav! See you at 5pm.",
      }),
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.message) throw new Error("Message send failed");
  });

  // 15. Conversations list
  await test("GET /api/messages/conversations", async () => {
    const res = await fetch(`${BASE_URL}/api/messages/conversations`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.conversations) || data.conversations.length === 0) {
      throw new Error("No conversations returned");
    }
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test suite execution failed:", err);
  process.exit(1);
});
