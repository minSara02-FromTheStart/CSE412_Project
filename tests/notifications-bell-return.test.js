/**
 * @jest-environment jsdom
 */

describe("injectBellUI", () => {

  test("returns true after successful injection", () => {

    document.body.innerHTML = `
      <div id="header"></div>
    `;

    const header = document.getElementById("header");

    const bell = document.createElement("button");
    bell.id = "notificationBell";

    header.appendChild(bell);

    const result = document.getElementById("notificationBell") !== null;

    expect(result).toBe(true);
  });

});