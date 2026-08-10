const newsletter = require('../js/newsletterService');

describe('newsletter getStoredSubscriberEmails invalid storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('returns an empty array when localStorage contains invalid JSON', () => {
    localStorage.setItem('nn_subscribers', 'invalid-json');

    expect(newsletter.getStoredSubscriberEmails()).toEqual([]);
  });
});
