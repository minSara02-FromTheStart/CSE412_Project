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