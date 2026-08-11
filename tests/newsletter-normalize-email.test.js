const newsletter = require('../js/newsletterService');

describe('newsletter saveSubscriberEmail normalization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('trims whitespace and lowercases the email before saving', () => {
    newsletter.saveSubscriberEmail('  MIXED@Email.COM  ');

    expect(newsletter.getStoredSubscriberEmails()).toEqual(['mixed@email.com']);
  });
});
