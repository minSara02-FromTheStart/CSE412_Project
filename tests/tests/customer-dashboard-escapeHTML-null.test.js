/**
 * @jest-environment jsdom
 */

describe("escapeHTML", () => {

  test("returns empty string for null", () => {

    const escapeHTML = (value) => {
      if (value === null || value === undefined) {
        return "";
      }

      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    expect(escapeHTML(null)).toBe("");
  });

});