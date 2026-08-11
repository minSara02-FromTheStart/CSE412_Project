describe('newsletter subscription helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
  });

  test('saves a new subscriber email without duplicating it', () => {
    const newsletter = require('../js/newsletterService');

    expect(newsletter.getStoredSubscriberEmails()).toEqual([]);

    newsletter.saveSubscriberEmail('hello@example.com');
    newsletter.saveSubscriberEmail('hello@example.com');

    expect(newsletter.getStoredSubscriberEmails()).toEqual(['hello@example.com']);
  });

  test('trims and lowercases email before saving', () => {
    const newsletter = require('../js/newsletterService');

    newsletter.saveSubscriberEmail('  HELLO@Example.COM  ');
    expect(newsletter.getStoredSubscriberEmails()).toEqual(['hello@example.com']);
  });

  test('returns an empty array when stored JSON is invalid', () => {
    localStorage.setItem('nn_subscribers', 'not-valid-json');
    const newsletter = require('../js/newsletterService');

    expect(newsletter.getStoredSubscriberEmails()).toEqual([]);
  });

  test('builds a sale alert message with the offer title', () => {
    const newsletter = require('../js/newsletterService');

    const result = newsletter.buildOfferAlertMessage('Flash Sale', 'Get 20% off today only');

    expect(result.subject).toBe('Flash Sale');
    expect(result.body).toContain('Flash Sale');
    expect(result.body).toContain('Get 20% off today only');
  });
});
