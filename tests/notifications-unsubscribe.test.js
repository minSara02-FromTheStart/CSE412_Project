/**
 * @jest-environment jsdom
 */

describe("NotificationSubject", () => {

  test("unsubscribe removes an observer", () => {

    const observers = [];

    const subscribe = (observer) => {
      observers.push(observer);
    };

    const unsubscribe = (observer) => {
      const index = observers.indexOf(observer);

      if (index !== -1) {
        observers.splice(index, 1);
      }
    };

    const observer = jest.fn();

    subscribe(observer);
    unsubscribe(observer);

    expect(observers).not.toContain(observer);
    expect(observers).toHaveLength(0);
  });

});