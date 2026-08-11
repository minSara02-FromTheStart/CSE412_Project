const { toDate } = require('../js/customer-dashboard-utils');

describe('77. toDate converts Firestore-like timestamp objects', () => {
  test('calls toDate() on timestamp object', () => {
    const fakeDate = new Date('2026-01-01');

    const fakeTimestamp = {
      toDate: () => fakeDate
    };

    expect(toDate(fakeTimestamp)).toBe(fakeDate);
  });
});