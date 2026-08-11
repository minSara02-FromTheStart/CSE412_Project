const newsletter = require('../js/newsletterService');

describe('newsletter saveSubscriberEmail empty email', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
  });

  test('returns unchanged array for empty email', () => {
    expect(newsletter.saveSubscriberEmail('')).toEqual([]);
    expect(newsletter.saveSubscriberEmail('   ')).toEqual([]);
  });
});
