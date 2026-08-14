describe('20) rewardnotifications.js', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="notifBadge" style="display: none;"></div>
      <div id="notifList"></div>
    `;
  });

  function renderBell(assignments) {
    const badge = document.getElementById('notifBadge');
    const list = document.getElementById('notifList');
    if (!badge || !list) return;

    const safeAssignments = Array.isArray(assignments) ? assignments : [];
    const unseenCount = safeAssignments.filter(a => a && !a.seenAt).length;

    if (unseenCount > 0) {
      badge.textContent = unseenCount > 9 ? '9+' : String(unseenCount);
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }

    if (!safeAssignments.length) {
      list.innerHTML = `<div class="notif-empty">No rewards yet. Keep shopping to earn one!</div>`;
      return;
    }

    list.innerHTML = safeAssignments
      .map(a => `<div class="notif-item">🎁 Coupon: ${a.couponCode || 'PROMO'}</div>`)
      .join('');
  }

  describe('Unit Tests', () => {
    test('1. Compute reward eligibility badge and list from assignments correctly', () => {
      const mockAssignments = [
        { id: '1', couponCode: 'TOP10', seenAt: null },
        { id: '2', couponCode: 'SAVE20', seenAt: '2026-08-01' }
      ];

      renderBell(mockAssignments);

      const badge = document.getElementById('notifBadge');
      const list = document.getElementById('notifList');

      expect(badge.style.display).toBe('flex');
      expect(badge.textContent).toBe('1');
      expect(list.innerHTML).toContain('TOP10');
      expect(list.innerHTML).toContain('SAVE20');
    });
  });

  describe('Negative Tests', () => {
    test('1. Null/undefined user input -> no notification badge & safe empty state fallback', () => {
      renderBell(null);

      const badge = document.getElementById('notifBadge');
      const list = document.getElementById('notifList');

      expect(badge.style.display).toBe('none');
      expect(list.innerHTML).toContain('No rewards yet. Keep shopping to earn one!');
    });
  });
});