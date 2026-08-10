const newsletter = require('../js/newsletterService');

describe('newsletter saveSubscriberEmail duplicate handling', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('does not save duplicate emails twice', () => {
    newsletter.saveSubscriberEmail('duplicate@example.com');
    newsletter.saveSubscriberEmail('duplicate@example.com');

    expect(newsletter.getStoredSubscriberEmails()).toEqual(['duplicate@example.com']);
  });
});
