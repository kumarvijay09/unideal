import { Router } from "express";
import { getStats, getListings } from "../database/db.js";

const router = Router();

const CATEGORY_DEFINITIONS = [
  { label: "Books", icon: "book", color: "bg-[#EEE9FF]" },
  { label: "Electronics", icon: "laptop", color: "bg-[#E0F1FF]" },
  { label: "Hostel Items", icon: "home", color: "bg-[#FFF0D9]" },
  { label: "Sports", icon: "ball", color: "bg-[#E6F8E9]" },
  { label: "Clothing", icon: "shirt", color: "bg-[#FFE8EA]" },
  { label: "Accessories", icon: "bag", color: "bg-[#F1ECDF]" },
  { label: "Vehicles", icon: "vehicle", color: "bg-[#E0F4FF]" },
  { label: "Other", icon: "more", color: "bg-[#E9EDF1]" },
];

const CAMPUS_LOCATIONS = [
  "North Campus",
  "South Campus",
  "Hostel Block A",
  "Hostel Block B",
  "Hostel Block C",
  "Girls Hostel 1",
  "Girls Hostel 2",
  "Library Gate",
  "Central Cafeteria",
  "Sports Complex",
  "Academic Block",
];

const CONDITIONS = ["Brand new", "Like new", "Good", "Fair"];

// GET /api/meta - App metadata with live category counts
router.get("/", (req, res) => {
  const stats = getStats();
  const allListings = getListings({ limit: 100 }).listings.filter(
    (item) => item.status !== "sold",
  );

  const categories = CATEGORY_DEFINITIONS.map((cat) => {
    const count = allListings.filter(
      (item) => item.category?.toLowerCase() === cat.label.toLowerCase(),
    ).length;
    return {
      ...cat,
      count: `${count} item${count === 1 ? "" : "s"}`,
      rawCount: count,
    };
  });

  res.json({
    success: true,
    campus: "Delhi Technological University & Regional Campuses",
    categories,
    locations: CAMPUS_LOCATIONS,
    conditions: CONDITIONS,
    stats,
  });
});

// GET /api/meta/stats - Quick platform metrics
router.get("/stats", (req, res) => {
  const stats = getStats();
  res.json({
    success: true,
    stats,
  });
});

export default router;
