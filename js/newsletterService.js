(function (global) {
  const STORAGE_KEY = 'nn_subscribers';
  const DEFAULT_OFFER = {
    title: 'Flash Sale Alert',
    description: 'A new flash sale or special offer is now live on NutriNest.'
  };

  function getStoredSubscriberEmails() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch (error) {
      return [];
    }
  }

  function saveSubscriberEmail(email) {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized) return [];

    const existing = getStoredSubscriberEmails();
    const next = existing.includes(normalized) ? existing : [...existing, normalized];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function buildOfferAlertMessage(title = DEFAULT_OFFER.title, description = DEFAULT_OFFER.description) {
    return {
      subject: title,
      body: `${title}\n\n${description}\n\nVisit NutriNest today to grab the deal before it ends.`
    };
  }

  async function sendOfferAlertToSubscribers(title, description) {
    const subscribers = getStoredSubscriberEmails();
    const message = buildOfferAlertMessage(title, description);
    const results = [];

    // Ensure EmailJS is loaded
    if (typeof emailjs === "undefined") {
      console.error('EmailJS not loaded');
      results.push({ success: false, error: 'EmailJS not loaded' });
      return { subscribers, message, results };
    }

    for (const email of subscribers) {
      try {
        console.log(`Sending alert to ${email}...`);
        const response = await window.emailjs.send('service_ts8i42n', 'template_g5y02xn', {
          to_email: email,
          subject: message.subject,
          message_body: message.body,
          to_name: 'Subscriber'
        });
        console.log(`Success for ${email}:`, response);
        results.push({ email, success: true });
      } catch (error) {
        console.error(`Failed for ${email}:`, error);
        results.push({ email, success: false, error: error.text || error.message });
      }
    }

    return { subscribers, message, results };
  }

  const api = {
    STORAGE_KEY,
    getStoredSubscriberEmails,
    saveSubscriberEmail,
    buildOfferAlertMessage,
    sendOfferAlertToSubscribers
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.newsletterService = api;
})(typeof window !== 'undefined' ? window : globalThis);
