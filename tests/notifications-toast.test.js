/**
 * @jest-environment jsdom
 */

describe("showNotifToast", () => {

  test("adds a toast element to the document", () => {

    const toast = document.createElement("div");

    toast.className = "notification-toast";
    toast.textContent = "New notification";

    document.body.appendChild(toast);

    expect(document.querySelector(".notification-toast")).not.toBeNull();
    expect(document.querySelector(".notification-toast").textContent)
      .toBe("New notification");
  });

});