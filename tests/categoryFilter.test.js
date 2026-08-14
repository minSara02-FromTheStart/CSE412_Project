/**
 * @jest-environment jsdom
 */

describe("category filter helper", () => {

  beforeEach(() => {
    jest.resetModules();

    document.body.innerHTML = `
      <div class="card" data-category="snacks healthy"></div>
      <div class="card" data-category="beverages drinks"></div>
      <div class="card" data-category="snacks"></div>
    `;
  });


  // =========================================================
  // UNIT TESTS
  // =========================================================

  test("hides cards that do not match the category query param", () => {

    const { applyCategoryFilter } = require("../js/categoryFilter");

    applyCategoryFilter("?category=snacks");

    const cards = document.querySelectorAll(".card");

    expect(cards[0].style.display).toBe("");
    expect(cards[1].style.display).toBe("none");
    expect(cards[2].style.display).toBe("");
  });


  test("does nothing when the category query param is missing", () => {

    const { applyCategoryFilter } = require("../js/categoryFilter");

    applyCategoryFilter("");

    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {
      expect(card.style.display).toBe("");
    });
  });


  test("shows cards when category matches one of multiple categories", () => {

    const { applyCategoryFilter } = require("../js/categoryFilter");

    applyCategoryFilter("?category=healthy");

    const cards = document.querySelectorAll(".card");

    expect(cards[0].style.display).toBe("");
    expect(cards[1].style.display).toBe("none");
    expect(cards[2].style.display).toBe("none");
  });


  // =========================================================
  // NEGATIVE TESTS
  // =========================================================

  test("hides all cards when category does not exist", () => {

    const { applyCategoryFilter } = require("../js/categoryFilter");

    applyCategoryFilter("?category=unknown");

    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {
      expect(card.style.display).toBe("none");
    });
  });


  test("handles undefined search input safely", () => {

    const { applyCategoryFilter } = require("../js/categoryFilter");

    expect(() => applyCategoryFilter(undefined)).not.toThrow();

    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {
      expect(card.style.display).toBe("");
    });
  });

});