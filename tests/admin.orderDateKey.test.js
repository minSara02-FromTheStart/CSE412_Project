/**
 * @jest-environment jsdom
 */

describe("admin.js - orderDateKey()", () => {

  // =========================================================
  // UNIT TEST
  // =========================================================

  test("orderDateKey returns date in YYYY-MM-DD format", () => {

    const orderDateKey = (o) => {
      const ts = o.createdAt;

      const d = (ts && ts.toDate)
        ? ts.toDate()
        : new Date(ts || Date.now());

      if (isNaN(d)) return null;

      return d.toISOString().slice(0, 10);
    };

    const order = {
      createdAt: "2026-08-15T10:30:00.000Z"
    };

    expect(orderDateKey(order))
      .toBe("2026-08-15");
  });


  // =========================================================
  // NEGATIVE TEST
  // =========================================================

  test("orderDateKey returns null for an invalid date", () => {

    const orderDateKey = (o) => {
      const ts = o.createdAt;

      const d = (ts && ts.toDate)
        ? ts.toDate()
        : new Date(ts || Date.now());

      if (isNaN(d)) return null;

      return d.toISOString().slice(0, 10);
    };

    const order = {
      createdAt: "invalid-date"
    };

    expect(orderDateKey(order))
      .toBeNull();
  });

});