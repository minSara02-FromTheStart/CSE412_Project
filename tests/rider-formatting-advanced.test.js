describe('22.b) rider-utils.js — Formatting & Calculations', () => {
  function getInitials(name) {
    return (name || 'Rider')
      .split(' ')
      .map(part => part[0]?.toUpperCase())
      .slice(0, 2)
      .join('');
  }

  function calculateAverageRating(ratings) {
    const validRatings = ratings
      .map(r => Number(r))
      .filter(n => Number.isFinite(n) && n >= 1 && n <= 5);

    if (!validRatings.length) return null;
    return validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length;
  }

  describe('Unit Tests', () => {
    test('1. getInitials extracts first letter of up to two words', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Mohammad Tanvir Hasan')).toBe('MT');
      expect(getInitials('SingleName')).toBe('S');
    });

    test('2. calculateAverageRating computes accurate float averages', () => {
      const avg = calculateAverageRating([5, 4, 4, 5]);
      expect(avg).toBe(4.5);
    });

    test('3. Average rating format displays to 1 decimal place', () => {
      const avg = calculateAverageRating([5, 4, 4]);
      expect(avg.toFixed(1)).toBe('4.3');
    });
  });

  describe('Negative Tests', () => {
    test('1. getInitials handles empty string or whitespace gracefully', () => {
      expect(getInitials('')).toBe('R');
      expect(getInitials(null)).toBe('R');
      expect(getInitials(undefined)).toBe('R');
    });

    test('2. Ratings with non-numeric, null, or out-of-bounds items return null or ignore bad data', () => {
      expect(calculateAverageRating([])).toBeNull();
      expect(calculateAverageRating(['bad', null, undefined])).toBeNull();
      expect(calculateAverageRating([5, 'corrupted', 0, 10])).toBe(5);
    });
  });
});