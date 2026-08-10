const newsletter = require('../js/newsletterService');

describe('newsletter sendOfferAlertToSubscribers with missing EmailJS', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
  });

  test('returns error result when emailjs is unavailable', async () => {
    delete global.emailjs;
    const result = await newsletter.sendOfferAlertToSubscribers('Flash', 'Offer details');

    expect(result.results).toHaveLength(1);
    expect(result.results[0].success).toBe(false);
    expect(result.results[0].error).toBe('EmailJS not loaded');
  });
});
