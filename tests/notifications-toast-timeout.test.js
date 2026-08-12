/**
 * @jest-environment jsdom
 */

describe("showNotifToast", () => {

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("removes the toast after timeout", () => {

    const toast = document.createElement("div");
    toast.className = "notification-toast";

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);

    expect(document.querySelector(".notification-toast")).not.toBeNull();

    jest.advanceTimersByTime(3000);

    expect(document.querySelector(".notification-toast")).toBeNull();
  });

});