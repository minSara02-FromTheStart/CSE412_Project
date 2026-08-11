/**
 * @jest-environment jsdom
 */

describe("escapeHTML", () => {

  test("escapes HTML markup safely", () => {

    const escapeHTML = (value) => {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const result = escapeHTML('<script>alert("XSS")</script>');

    expect(result).toBe(
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
    );
  });

});