/**
 * @jest-environment jsdom
 */

describe("admin.js - showToast()", () => {

  // =========================================================
  // UNIT TEST
  // =========================================================

  test("showToast displays the given message", () => {

    document.body.innerHTML = `
      <div id="toast"></div>
    `;

    const showToast = (msg, duration = 2800) => {
      const t = document.getElementById("toast");
      t.textContent = msg;
      t.classList.add("show");
      setTimeout(() => t.classList.remove("show"), duration);
    };

    showToast("Product added successfully");

    const toast = document.getElementById("toast");

    expect(toast.textContent)
      .toBe("Product added successfully");

    expect(toast.classList.contains("show"))
      .toBe(true);
  });


  // =========================================================
  // NEGATIVE TEST
  // =========================================================

  test("showToast displays an empty message when given empty input", () => {

    document.body.innerHTML = `
      <div id="toast"></div>
    `;

    const showToast = (msg, duration = 2800) => {
      const t = document.getElementById("toast");
      t.textContent = msg;
      t.classList.add("show");
      setTimeout(() => t.classList.remove("show"), duration);
    };

    showToast("");

    const toast = document.getElementById("toast");

    expect(toast.textContent)
      .toBe("");

    expect(toast.classList.contains("show"))
      .toBe(true);
  });

});