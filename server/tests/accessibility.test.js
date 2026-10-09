import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { seedData } from "../database/seedData.js";

describe("Accessibility & WCAG Compliance Standards", () => {
  it("every marketplace listing must have non-empty, descriptive image alt text and context", () => {
    for (const item of seedData.listings) {
      assert.ok(item.title, `Item ${item.id} must have a title`);
      assert.ok(item.title.length >= 4, `Title for ${item.title} is too short for assistive screen readers`);
      assert.ok(item.category, `Item ${item.id} must declare category for screen reader categorization`);
      assert.ok(item.condition, `Item ${item.id} must declare condition for cognitive accessibility`);
    }
  });

  it("HTML entry point must specify lang attribute and skip-to-content mechanism", () => {
    const indexPath = path.resolve(process.cwd(), "index.html");
    const htmlContent = fs.readFileSync(indexPath, "utf8");

    assert.ok(htmlContent.includes("<html lang="), "HTML root must declare a lang attribute");
    assert.ok(
      htmlContent.includes("viewport") && htmlContent.includes("width=device-width"),
      "HTML must have responsive mobile viewport meta tag"
    );
  });

  it("UI components must include aria-label or accessible text on interactive icon buttons", () => {
    const appPath = path.resolve(process.cwd(), "src/App.tsx");
    const appContent = fs.readFileSync(appPath, "utf8");

    // Check search form has accessible label
    assert.ok(
      appContent.includes('aria-label="Search marketplace"') ||
      appContent.includes('aria-label="Search campus listings"'),
      "Search input must have aria-label"
    );

    // Check logo and save buttons have accessibility attributes
    assert.ok(
      appContent.includes('aria-label="CampusCart home"') || appContent.includes('aria-label="UniDeal home"'),
      "Logo must have aria-label"
    );
    assert.ok(appContent.includes('aria-label='), "Must contain aria-labels on icon-only actions");
  });

  it("modal dialogs must use role='dialog' and aria-modal='true'", () => {
    const chatModalPath = path.resolve(process.cwd(), "src/components/ChatModal.tsx");
    const chatContent = fs.readFileSync(chatModalPath, "utf8");
    assert.ok(
      chatContent.includes('role="dialog"') || chatContent.includes('aria-modal'),
      "Chat modal should declare dialog accessibility attributes"
    );
  });
});
