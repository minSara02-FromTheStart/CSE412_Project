/**
 * @jest-environment jsdom
 */

describe("NotificationSubject", () => {

  test("subscribe adds an observer function", () => {

    const observers = [];

    const subscribe = (observer) => {
      observers.push(observer);
    };

    const observer = jest.fn();

    subscribe(observer);

    expect(observers).toContain(observer);
    expect(observers).toHaveLength(1);
  });

})