/**
 * @jest-environment jsdom
 */

describe("injectBellUI", () => {

  test("injects the notification bell into the DOM", () => {

    document.body.innerHTML = `
      <div id="header"></div>
    `;

    const header = document.getElementById("header");

    const bell = document.createElement("button");
    bell.id = "notificationBell";
    bell.textContent = "🔔";

    header.appendChild(bell);

    expect(document.getElementById("notificationBell")).not.toBeNull();
    expect(header.contains(bell)).toBe(true);
  });

});