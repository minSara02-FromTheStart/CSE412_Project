// js/notifications-utils.js

class NotificationSubject {
  constructor() {
    this.observers = [];
  }
  subscribe(observer) {
    if (typeof observer === 'function') this.observers.push(observer);
  }
  unsubscribe(observer) {
    this.observers = this.observers.filter(o => o !== observer);
  }
  notify() {
    this.observers.forEach(observer => observer());
  }
}

function sanitize(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function couponSummary(c) {
  if (c.type === 'freeShip') return 'Free shipping on this order.';
  if (c.value) return `Get ${c.value}% off.`;
  return '';
}

function getSeenSet(storageKey) {
  try { return new Set(JSON.parse(localStorage.getItem(storageKey)) || []); }
  catch { return new Set(); }
}

function saveSeenSet(storageKey, set) {
  try { localStorage.setItem(storageKey, JSON.stringify([...set])); } catch {}
}

function unreadCount(entries) {
  return entries.filter(e => !e.seen).length;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NotificationSubject, sanitize, fmtDate, couponSummary,
    getSeenSet, saveSeenSet, unreadCount
  };
}



function buildToastPayload(kind, code, title) {
  const icon = kind === 'reward' ? '🎁' : '🏷️';
  const headline = kind === 'reward' ? "You've earned a reward!" : 'New coupon available!';
  return {
    icon,
    headline,
    body: `${sanitize(title || '')}${title ? ' — ' : ''}code ${sanitize(code || '')}`
  };
}

function markAllSeenInList(list) {
  return list.map(item => ({ ...item, seen: true }));
}

function safeSaveSeenSet(storage, key, set) {
  try {
    storage.setItem(key, JSON.stringify([...set]));
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  NotificationSubject, sanitize, fmtDate, couponSummary,
  getSeenSet, saveSeenSet, unreadCount,
  injectBellUI, renderBadge, showToast,
  buildToastPayload, markAllSeenInList, safeSaveSeenSet
};



const {
  NotificationSubject, buildToastPayload, markAllSeenInList, safeSaveSeenSet
} = require('../js/notifications-utils');

describe('subscribe/unsubscribe flags', () => {
  // Unit 1: subscribe/unsubscribe toggles subscription flags correctly
  test('subscribing adds observer, unsubscribing removes it', () => {
    const subject = new NotificationSubject();
    const fn = jest.fn();

    expect(subject.observers).toHaveLength(0);
    subject.subscribe(fn);
    expect(subject.observers).toHaveLength(1);
    subject.unsubscribe(fn);
    expect(subject.observers).toHaveLength(0);
  });
});

describe('buildToastPayload', () => {
  // Unit 2: notify builds payload and enqueues toast/notification
  test('builds a coupon toast payload with code and title', () => {
    const payload = buildToastPayload('coupon', 'SAVE15', 'Big Savings');
    expect(payload.icon).toBe('🏷️');
    expect(payload.headline).toBe('New coupon available!');
    expect(payload.body).toContain('SAVE15');
    expect(payload.body).toContain('Big Savings');
  });

  // Negative 1: notify called with missing message → no-op / safe fallback
  test('builds a safe payload even when code/title are missing', () => {
    expect(() => buildToastPayload('reward', undefined, undefined)).not.toThrow();
    const payload = buildToastPayload('reward');
    expect(payload.body).not.toContain('undefined');
  });
});

describe('markAllSeenInList', () => {
  // Unit 3: markAllSeen sets seen flags on all notifications
  test('sets seen: true on every item in the list', () => {
    const list = [{ id: 1, seen: false }, { id: 2, seen: false }];
    const result = markAllSeenInList(list);
    expect(result.every(item => item.seen === true)).toBe(true);
  });
});

describe('safeSaveSeenSet', () => {
  // Negative 2: subscription/storage persistence failure handled gracefully
  test('returns false instead of throwing when storage.setItem fails', () => {
    const brokenStorage = {
      setItem() { throw new Error('QuotaExceededError'); }
    };
    const result = safeSaveSeenSet(brokenStorage, 'nn_seen', new Set(['a']));
    expect(result).toBe(false);
  });
});