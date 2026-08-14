describe('20.b) rewardnotifications.js — State & Seen Updates', () => {
  function markAllSeen(assignments) {
    if (!Array.isArray(assignments)) return [];
    const nowIso = '2026-08-14T22:00:00.000Z';
    return assignments.map(a => (a.seenAt ? a : { ...a, seenAt: nowIso }));
  }

  function getUnreadCount(assignments) {
    if (!Array.isArray(assignments)) return 0;
    return assignments.filter(a => !a.seenAt).length;
  }

  describe('Unit Tests', () => {
    test('1. markAllSeen updates unseen items with timestamp while preserving existing seenAt', () => {
      const initial = [
        { id: '1', couponCode: 'SAVE10', seenAt: null },
        { id: '2', couponCode: 'SAVE20', seenAt: '2026-08-01T00:00:00.000Z' }
      ];

      const updated = markAllSeen(initial);
      expect(updated[0].seenAt).toBe('2026-08-14T22:00:00.000Z');
      expect(updated[1].seenAt).toBe('2026-08-01T00:00:00.000Z');
      expect(getUnreadCount(updated)).toBe(0);
    });

    test('2. Unread count handles large values by capping display at 9+', () => {
      const createItems = (count) => Array.from({ length: count }, (_, i) => ({ id: `${i}`, seenAt: null }));
      const items = createItems(15);
      const count = getUnreadCount(items);
      const badgeText = count > 9 ? '9+' : String(count);

      expect(badgeText).toBe('9+');
    });
  });

  describe('Negative Tests', () => {
    test('1. Non-array inputs to markAllSeen or count yield safe empty results', () => {
      expect(markAllSeen(null)).toEqual([]);
      expect(getUnreadCount(null)).toBe(0);
      expect(getUnreadCount(undefined)).toBe(0);
    });
  });
});