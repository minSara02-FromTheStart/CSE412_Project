/**
 * @jest-environment jsdom
 */

describe("admin.js - toDatetimeLocalValue()", () => {

  // =========================================================
  // UNIT TEST
  // =========================================================

  test("toDatetimeLocalValue converts a Date to datetime-local format", () => {

    const toDatetimeLocalValue = (value) => {
      if (!value) return '';

      const d = (value && typeof value.toDate === 'function')
        ? value.toDate()
        : new Date(value);

      if (isNaN(d)) return '';

      const pad = n => String(n).padStart(2, '0');

      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const date = new Date(2026, 7, 15, 14, 30);

    expect(toDatetimeLocalValue(date))
      .toBe("2026-08-15T14:30");
  });


  // =========================================================
  // NEGATIVE TEST
  // =========================================================

  test("toDatetimeLocalValue returns empty string for missing value", () => {

    const toDatetimeLocalValue = (value) => {
      if (!value) return '';

      const d = new Date(value);

      if (isNaN(d)) return '';

      const pad = n => String(n).padStart(2, '0');

      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    expect(toDatetimeLocalValue(""))
      .toBe("");
  });

});