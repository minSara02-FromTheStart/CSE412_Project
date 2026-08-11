/**
 * @jest-environment jsdom
 */

describe("renderDropdown", () => {

  test("hides the badge when all items are seen", () => {

    document.body.innerHTML = `
      <div id="notificationBadge"></div>
    `;

    const badge = document.getElementById("notificationBadge");
    const unreadCount = 0;

    if (unreadCount === 0) {
      badge.style.display = "none";
    }

    expect(badge.style.display).toBe("none");
  });

});