/**
 * @jest-environment jsdom
 */

describe('category filter helper', () => {
  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = `
      <div class="card" data-category="snacks healthy"></div>
      <div class="card" data-category="beverages"></div>
      <div class="card" data-category="snacks"></div>
    `;
  });

  test('hides cards that do not match the category query param', () => {
    const { applyCategoryFilter } = require('../js/categoryFilter');
    applyCategoryFilter('?category=snacks');

    const cards = document.querySelectorAll('.card');
    expect(cards[0].style.display).toBe('');
    expect(cards[1].style.display).toBe('none');
    expect(cards[2].style.display).toBe('');
  });

  test('does nothing when the category query param is missing', () => {
    const { applyCategoryFilter } = require('../js/categoryFilter');
    applyCategoryFilter('');

    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      expect(card.style.display).toBe('');
    });
  });
});
