describe('reviews.js helper validation and rendering', () => {
  function starHtml(rating) {
    const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    return "★".repeat(r) + "☆".repeat(5 - r);
  }

  function validateReviewInput(rating, comment) {
    const trimmedComment = (comment || "").trim();
    const numericRating = Number(rating);

    if (!trimmedComment) throw new Error("Please write a comment.");
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      throw new Error("Please choose a rating from 1 to 5.");
    }
    return { rating: numericRating, comment: trimmedComment };
  }

  function renderReviewsList(reviews) {
    if (!reviews || !reviews.length) {
      return `<p>No reviews yet. Be the first to share your feedback!</p>`;
    }
    return reviews.map(r => `<div><strong>${r.customerName}</strong><span>${starHtml(r.rating)}</span></div>`).join('');
  }

  describe('Unit Tests', () => {
    test('1. starHtml generates correct filled and empty star symbols', () => {
      expect(starHtml(5)).toBe('★★★★★');
      expect(starHtml(3)).toBe('★★★☆☆');
      expect(starHtml(0)).toBe('☆☆☆☆☆');
    });

    test('2. Valid review submission parameters are parsed cleanly', () => {
      const valid = validateReviewInput(4, '  Great organic product!  ');
      expect(valid.rating).toBe(4);
      expect(valid.comment).toBe('Great organic product!');
    });

    test('3. renderReviewsList renders filled reviews list markup', () => {
      const list = [{ customerName: 'Alice', rating: 5 }];
      const html = renderReviewsList(list);
      expect(html).toContain('Alice');
      expect(html).toContain('★★★★★');
    });
  });

  describe('Negative Tests', () => {
    test('1. Submitting empty comment throws specific error', () => {
      expect(() => validateReviewInput(5, '')).toThrow('Please write a comment.');
      expect(() => validateReviewInput(5, '   ')).toThrow('Please write a comment.');
    });

    test('2. Invalid rating out of range throws specific error', () => {
      expect(() => validateReviewInput(0, 'Good')).toThrow('Please choose a rating from 1 to 5.');
      expect(() => validateReviewInput(6, 'Good')).toThrow('Please choose a rating from 1 to 5.');
      expect(() => validateReviewInput('bad', 'Good')).toThrow('Please choose a rating from 1 to 5.');
    });

    test('3. Empty or null reviews array returns fallback empty state', () => {
      expect(renderReviewsList([])).toContain('No reviews yet.');
      expect(renderReviewsList(null)).toContain('No reviews yet.');
    });
  });
});