/* =============================================================
   notifications.js  —  NutriNest Unified Notification Bell
   ------------------------------------------------------------
   Drop this + notifications.css into ANY page (guest or logged
   in) and it will:

   1. Inject a bell icon into the first ".nav-right" element it
      finds — no HTML markup needed on the page itself.
   2. Watch Firestore `custom_coupons` in real time, so the
      moment admin creates a coupon on the Loyalty & Coupons
      page, every visitor (including guests) sees it — as a
      badge on the bell AND a toast if they're on the site live.
   3. If the visitor is a signed-in customer, ALSO watch
      `loyalty_assignments` for personal "you were rewarded"
      coupons and merge them into the same bell/list.
   4. Guests have no account to store "seen" state against, so
      seen/unseen for general coupons is tracked in
      localStorage on the visitor's browser. Personal rewards
      (logged-in only) keep using the existing Firestore
      `seenAt` field.

   Requires: Firestore rule that allows public (unauthenticated)
   read on the `custom_coupons` collection, since guests need to
   read it too. If that collection is currently locked to
   authenticated users only, guests will not see coupon alerts —
   check your Firestore rules.
   ============================================================= */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, query, where, onSnapshot,
  doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAJOWu8ZYEyUms8nF1uVBw2m9v4ApNaT4s",
    authDomain: "nutrinest-408d4.firebaseapp.com",
    projectId: "nutrinest-408d4",
    storageBucket: "nutrinest-408d4.firebasestorage.app",
    messagingSenderId: "44196278510",
    appId: "1:44196278510:web:11acb64840e2d536c843ff"
};

const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const SEEN_KEY = 'nutrinest_seen_coupons';

/* =============================================================
   STATE
   ============================================================= */
let coupons = [];          // live docs from `custom_coupons`
let rewards = [];          // live docs from `loyalty_assignments` (logged-in only)
let knownCouponIds = new Set();
let knownRewardIds = new Set();
let firstCouponLoad = true;
let firstRewardLoad = true;

function getSeenSet() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)) || []); }
  catch { return new Set(); }
}
function saveSeenSet(set) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...set])); } catch {}
}
let seenCoupons = getSeenSet();

/* =============================================================
   HELPERS
   ============================================================= */
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

/* =============================================================
   BELL UI — injected into the page, no markup needed upstream
   ============================================================= */
function injectBellUI() {
  if (document.getElementById('nnNotifWrap')) return true;
  const navRight = document.querySelector('.nav-right');
  if (!navRight) return false;

  const wrap = document.createElement('div');
  wrap.className = 'nn-notif-wrap';
  wrap.id = 'nnNotifWrap';
  wrap.innerHTML = `
    <button class="nn-notif-bell" id="nnNotifBell" type="button" aria-label="Notifications">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3a6 6 0 0 0-6 6v3.6c0 .5-.16.99-.46 1.4L4.2 15.7c-.6.8-.02 1.95.98 1.95h13.64c1 0 1.58-1.15.98-1.95l-1.34-1.7A2.3 2.3 0 0 1 18 12.6V9a6 6 0 0 0-6-6Z"
              stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
        <path d="M9.5 19a2.5 2.5 0 0 0 5 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
      </svg>
      <span class="nn-notif-badge" id="nnNotifBadge">0</span>
    </button>
    <div class="nn-notif-dropdown" id="nnNotifDropdown">
      <div class="nn-notif-head">Notifications</div>
      <div class="nn-notif-list" id="nnNotifList">
        <div class="nn-notif-empty">No notifications yet.</div>
      </div>
    </div>
  `;
  navRight.insertBefore(wrap, navRight.firstChild);

  document.getElementById('nnNotifBell').addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById('nnNotifDropdown');
    const isOpen = dropdown.classList.toggle('open');
    if (isOpen) markAllSeen();
  });

  document.addEventListener('click', (e) => {
    const wrapEl = document.getElementById('nnNotifWrap');
    const dropdown = document.getElementById('nnNotifDropdown');
    if (wrapEl && dropdown && !wrapEl.contains(e.target)) dropdown.classList.remove('open');
  });

  return true;
}

/* =============================================================
   TOAST
   ============================================================= */
function showNotifToast(kind, code, title) {
  const icon = kind === 'reward' ? '🎁' : '🏷️';
  const headline = kind === 'reward' ? "You've earned a reward!" : 'New coupon available!';

  const toast = document.createElement('div');
  toast.className = 'nn-toast';
  toast.innerHTML = `
    <span class="nn-toast-icon">${icon}</span>
    <div>
      <div class="nn-toast-title">${headline}</div>
      <div class="nn-toast-body">${sanitize(title || '')} ${title ? '— ' : ''}code <strong>${sanitize(code)}</strong></div>
    </div>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 6000);
}

/* =============================================================
   MERGE + RENDER
   ============================================================= */
function buildEntries() {
  const couponEntries = coupons.map(c => ({
    id: 'coupon_' + c.id,
    _rawId: c.id,
    kind: 'coupon',
    code: c.code,
    title: c.title || c.code,
    desc: [c.description, couponSummary(c)].filter(Boolean).join(' '),
    timestamp: c.createdAt,
    seen: seenCoupons.has(c.id)
  }));

  const rewardEntries = rewards.map(r => ({
    id: 'reward_' + r.id,
    _rawId: r.id,
    kind: 'reward',
    code: r.couponCode,
    title: 'A reward, just for you',
    desc: "You've been rewarded this coupon for being one of our top customers. Apply it at checkout.",
    timestamp: r.assignedAt,
    seen: !!r.seenAt,
    used: !!r.usedAt
  }));

  return [...couponEntries, ...rewardEntries]
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
}

function renderDropdown() {
  if (!injectBellUI()) return;

  const badge = document.getElementById('nnNotifBadge');
  const bell  = document.getElementById('nnNotifBell');
  const list  = document.getElementById('nnNotifList');
  if (!badge || !list) return;

  const entries = buildEntries();
  const unseen = entries.filter(e => !e.seen).length;

  badge.textContent = unseen > 9 ? '9+' : String(unseen);
  badge.style.display = unseen > 0 ? 'flex' : 'none';
  bell.classList.toggle('nn-has-unseen', unseen > 0);

  if (!entries.length) {
    list.innerHTML = `<div class="nn-notif-empty">No notifications yet. New coupons will show up here.</div>`;
    return;
  }

  list.innerHTML = entries.map(e => `
    <div class="nn-notif-item ${e.seen ? '' : 'unseen'}">
      <span class="nn-notif-icon">${e.kind === 'reward' ? '🎁' : '🏷️'}</span>
      <div class="nn-notif-content">
        <div class="nn-notif-title-row">
          <span class="nn-notif-code">${sanitize(e.code)}</span>
          ${e.kind === 'reward' ? '<span class="nn-notif-tag">For you</span>' : ''}
        </div>
        <div class="nn-notif-desc">${sanitize(e.desc)}</div>
        <div class="nn-notif-date">${fmtDate(e.timestamp)}${e.used ? ' · Already used' : ''}</div>
      </div>
    </div>
  `).join('');
}

/* =============================================================
   MARK ALL SEEN
   ============================================================= */
async function markAllSeen() {
  let changed = false;
  coupons.forEach(c => {
    if (!seenCoupons.has(c.id)) { seenCoupons.add(c.id); changed = true; }
  });
  if (changed) saveSeenSet(seenCoupons);

  const unseenRewards = rewards.filter(r => !r.seenAt);
  if (unseenRewards.length) {
    const nowIso = new Date().toISOString();
    await Promise.all(unseenRewards.map(r =>
      updateDoc(doc(db, 'loyalty_assignments', r.id), { seenAt: nowIso }).catch(() => {})
    ));
    rewards = rewards.map(r => r.seenAt ? r : { ...r, seenAt: nowIso });
  }

  renderDropdown();
}

/* =============================================================
   LIVE WATCHERS
   ============================================================= */
function watchCoupons() {
  onSnapshot(collection(db, 'custom_coupons'), (snap) => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!firstCouponLoad) {
      docs.forEach(c => {
        if (!knownCouponIds.has(c.id) && !seenCoupons.has(c.id)) {
          showNotifToast('coupon', c.code, c.title);
        }
      });
    }
    docs.forEach(c => knownCouponIds.add(c.id));
    firstCouponLoad = false;

    coupons = docs;
    renderDropdown();
  }, (err) => console.error('Coupon notification listener error:', err));
}

function watchRewards(uid) {
  const q = query(collection(db, 'loyalty_assignments'), where('customerId', '==', uid));
  onSnapshot(q, (snap) => {
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!firstRewardLoad) {
      docs.forEach(r => {
        if (!knownRewardIds.has(r.id) && !r.seenAt) {
          showNotifToast('reward', r.couponCode);
        }
      });
    }
    docs.forEach(r => knownRewardIds.add(r.id));
    firstRewardLoad = false;

    rewards = docs;
    renderDropdown();
  }, (err) => console.error('Reward notification listener error:', err));
}

/* =============================================================
   INIT
   ============================================================= */
function start() {
  injectBellUI();
  watchCoupons(); // always — guests included

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      rewards = [];
      firstRewardLoad = true;
      renderDropdown();
      return;
    }
    watchRewards(user.uid);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}