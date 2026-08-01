/* =============================================================
   rewardsNotifications.js  —  Customer-facing reward bell
   Shows a notification bell with an unread badge for coupons the
   admin's "Auto-Reward Top Spenders" tool has assigned to the
   signed-in customer, read live from Firestore's
   `loyalty_assignments` collection (matched by customerId === uid).

   This file initializes its own Firebase app instance so it can
   be dropped into any customer-facing page independently of how
   that page's own script is structured. If a Firebase app is
   already running on the page, it reuses it instead of creating
   a duplicate.
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

let myAssignments = [];
let knownIds = new Set();   // assignments we've already reacted to with a toast
let firstLoad = true;       // suppress the toast burst on initial page load

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function sanitize(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

/* =============================================================
   TOAST — a real, in-the-moment notification, not just a badge
   ============================================================= */
function showRewardToast(couponCode) {
  const toast = document.createElement('div');
  toast.className = 'reward-toast';
  toast.innerHTML = `🎉 <strong>You've earned a reward!</strong><br>Use coupon <strong>${sanitize(couponCode)}</strong> at checkout.`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 6000);
}

/* =============================================================
   RENDER
   ============================================================= */
function renderBell() {
  const badge = document.getElementById('notifBadge');
  const list  = document.getElementById('notifList');
  if (!badge || !list) return;

  const unseenCount = myAssignments.filter(a => !a.seenAt).length;

  if (unseenCount > 0) {
    badge.textContent = unseenCount > 9 ? '9+' : String(unseenCount);
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }

  if (!myAssignments.length) {
    list.innerHTML = `<div class="notif-empty">No rewards yet. Keep shopping to earn one!</div>`;
    return;
  }

  list.innerHTML = [...myAssignments]
    .sort((a, b) => new Date(b.assignedAt || 0) - new Date(a.assignedAt || 0))
    .map(a => `
      <div class="notif-item ${a.seenAt ? '' : 'unseen'}">
        <div class="notif-code">🎁 Coupon: ${sanitize(a.couponCode)}</div>
        <div class="notif-desc">You've been rewarded this coupon for being one of our top customers. Apply it at checkout.</div>
        <div class="notif-date">Assigned ${fmtDate(a.assignedAt)}${a.usedAt ? ' · Already used' : ''}</div>
      </div>
    `).join('');
}

/* =============================================================
   DATA — live listener, so a reward assigned while the customer
   is browsing shows up immediately, without a page refresh.
   ============================================================= */
function watchMyAssignments(uid) {
  const q = query(collection(db, 'loyalty_assignments'), where('customerId', '==', uid));

  onSnapshot(q, (snap) => {
    myAssignments = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!firstLoad) {
      myAssignments.forEach(a => {
        if (!knownIds.has(a.id) && !a.seenAt) {
          showRewardToast(a.couponCode); // pop a toast for anything genuinely new
        }
      });
    }
    myAssignments.forEach(a => knownIds.add(a.id));
    firstLoad = false;

    renderBell();
  }, (err) => console.error('Reward listener error:', err));
}

async function markAllSeen() {
  const unseen = myAssignments.filter(a => !a.seenAt);
  if (!unseen.length) return;

  const nowIso = new Date().toISOString();
  await Promise.all(
    unseen.map(a =>
      updateDoc(doc(db, 'loyalty_assignments', a.id), { seenAt: nowIso }).catch(() => {})
    )
  );
  myAssignments = myAssignments.map(a => a.seenAt ? a : { ...a, seenAt: nowIso });
  renderBell();
}

/* =============================================================
   INTERACTION
   ============================================================= */
function setupBellInteraction() {
  const bell = document.getElementById('notifBell');
  const dropdown = document.getElementById('notifDropdown');
  if (!bell || !dropdown) return;

  bell.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle('open');
    if (isOpen) markAllSeen(); // mark as read the moment the customer opens it
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== bell) {
      dropdown.classList.remove('open');
    }
  });
}

/* =============================================================
   INIT
   ============================================================= */
onAuthStateChanged(auth, (user) => {
  if (!user) return; // not logged in — bell just stays at 0
  watchMyAssignments(user.uid);
});

setupBellInteraction();