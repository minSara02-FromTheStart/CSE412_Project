/**
 * @jest-environment jsdom
 */

describe("NotificationSubject", () => {

  test("notify calls all subscribed observers", () => {

    const observers = [];

    const subscribe = (observer) => {
      observers.push(observer);
    };

    const notify = (data) => {
      observers.forEach(observer => observer(data));
    };

    const observer1 = jest.fn();
    const observer2 = jest.fn();

    subscribe(observer1);
    subscribe(observer2);

    notify("new notification");

    expect(observer1).toHaveBeenCalledWith("new notification");
    expect(observer2).toHaveBeenCalledWith("new notification");
  });

});