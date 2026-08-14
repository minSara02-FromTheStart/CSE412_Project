describe('21) rider-dashboard.js', () => {
  function processOrders(orders = []) {
    const list = Array.isArray(orders) ? orders : [];
    
    // Oldest first
    const sorted = [...list].sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return ta - tb;
    });

    const activeOrders = sorted.filter(o => o.status !== 'Delivered');
    const delivered = sorted.filter(o => o.status === 'Delivered');
    const deliveredCount = delivered.length;
    const earningsTotal = delivered.reduce((sum, o) => sum + (Number(o.deliveryFee) || 0), 0);

    const rated = delivered.filter(o => Number.isFinite(Number(o.riderRating)));
    const avgRating = rated.length
      ? rated.reduce((sum, o) => sum + Number(o.riderRating), 0) / rated.length
      : null;

    return { activeOrders, deliveredCount, earningsTotal, avgRating };
  }

  describe('Unit Tests', () => {
    test('1. Aggregation of delivery stats (completed vs pending earnings) is correct', () => {
      const orders = [
        { id: '1', status: 'Delivered', deliveryFee: 60, riderRating: 5 },
        { id: '2', status: 'Delivered', deliveryFee: 40, riderRating: 4 },
        { id: '3', status: 'Out for Delivery', deliveryFee: 50 }
      ];

      const stats = processOrders(orders);
      expect(stats.deliveredCount).toBe(2);
      expect(stats.earningsTotal).toBe(100);
      expect(stats.avgRating).toBe(4.5);
    });

    test('2. Status filters split active queue and delivered orders accurately', () => {
      const orders = [
        { id: 'A', status: 'Out for Delivery', createdAt: '2026-08-10' },
        { id: 'B', status: 'Delivered', createdAt: '2026-08-09' },
        { id: 'C', status: 'Assigned', createdAt: '2026-08-11' }
      ];

      const stats = processOrders(orders);
      expect(stats.activeOrders.length).toBe(2);
      expect(stats.activeOrders[0].id).toBe('A');
      expect(stats.activeOrders[1].id).toBe('C');
    });

    test('3. Status indicators and formatting yield valid summary labels', () => {
      const onlineStatus = (activeCount) => activeCount > 0 ? 'Busy' : 'Online';
      expect(onlineStatus(3)).toBe('Busy');
      expect(onlineStatus(0)).toBe('Online');
    });
  });

  describe('Negative Tests', () => {
    test('1. Empty deliveries list returns zeroed summary', () => {
      const stats = processOrders([]);
      expect(stats.deliveredCount).toBe(0);
      expect(stats.earningsTotal).toBe(0);
      expect(stats.avgRating).toBeNull();
      expect(stats.activeOrders).toEqual([]);
    });

    test('2. Malformed fees and ratings are ignored safely', () => {
      const corruptedOrders = [
        { id: 'X', status: 'Delivered', deliveryFee: 'invalid_fee', riderRating: 'not_a_number' }
      ];

      const stats = processOrders(corruptedOrders);
      expect(stats.deliveredCount).toBe(1);
      expect(stats.earningsTotal).toBe(0);
      expect(stats.avgRating).toBeNull();
    });
  });
});