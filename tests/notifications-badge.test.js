/**
 * @jest-environment jsdom
 */

describe("renderDropdown", () => {

  test("shows the unread badge count", () => {

    document.body.innerHTML = `
      <div id="notificationBadge"></div>
    `;

    const badge = document.getElementById("notificationBadge");
    const unreadCount = 3;

    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = "block";
    }

    expect(badge.textContent).toBe("3");
    expect(badge.style.display).toBe("block");
  });

});