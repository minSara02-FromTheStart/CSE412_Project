import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, updateDoc,
  collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const riderNameEl = document.getElementById('riderName');
const riderAvatarEl = document.getElementById('riderAvatar');
const riderIdEl = document.getElementById('riderId');
const runsCountEl = document.getElementById('runsCount');
const earningsAmountEl = document.getElementById('earningsAmount');
const ratingValueEl = document.getElementById('ratingValue');
const orderIdEl = document.getElementById('orderId');
const deliveryStatusEl = document.getElementById('deliveryStatus');
const deliveryAddressEl = document.getElementById('deliveryAddress');
const deliveryDistanceEl = document.getElementById('deliveryDistance'); // repurposed: Payment method
const deliveryEtaEl = document.getElementById('deliveryEta');           // repurposed: Order total
const markDeliveredBtn = document.getElementById('markDeliveredBtn');
const navigateBtn = document.getElementById('navigateBtn');
const callBtn = document.getElementById('callBtn');
const riderStatusDotEl = document.getElementById('riderStatusDot');
const riderStatusTextEl = document.getElementById('riderStatusText');
const upNextListEl = document.getElementById('upNextList');
const upNextCountEl = document.getElementById('upNextCount');

let riderUid = null;
let activeOrders = [];   // all non-delivered orders assigned to this rider, oldest first
let deliveredCount = 0;
let earningsTotal = 0;
let avgRating = null;    // average of customer-submitted riderRating values, null if none yet

function getInitials(name) {
  return (name || 'Rider')
    .split(' ')
    .map(part => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('');
}

function fmtCurrency(n) {
  const num = Number(n);
  return isNaN(num) ? '৳0' : '৳' + num.toLocaleString();
}

function orderItemsSummary(order) {
  return Array.isArray(order.items)
    ? order.items.map(it => `${it.name} ×${it.qty}`).join(', ')
    : (order.product || '—');
}

function renderRiderInfo(userData) {
  const name = userData.fullName || 'Rider';
  riderNameEl.textContent = name;
  riderAvatarEl.textContent = getInitials(name);
  riderIdEl.textContent = `Rider ID: ${userData.riderId || ('RD-' + riderUid.slice(0, 4).toUpperCase())}`;
}

function renderCurrentDelivery() {
  const current = activeOrders[0];

  if (!current) {
    orderIdEl.textContent = 'No active order';
    deliveryStatusEl.textContent = 'Waiting for assignment';
    deliveryAddressEl.textContent = 'No delivery assigned yet';
    deliveryDistanceEl.textContent = '—';
    deliveryEtaEl.textContent = '—';
    callBtn.disabled = true;
    navigateBtn.disabled = true;
    markDeliveredBtn.textContent = 'No active delivery';
    markDeliveredBtn.disabled = true;
    return;
  }

  orderIdEl.textContent = '#' + current.id.slice(-6).toUpperCase();
  deliveryStatusEl.textContent = current.status || 'Out for Delivery';
  deliveryAddressEl.textContent = current.address || '—';
  deliveryDistanceEl.textContent = current.paymentMethod || 'Cash On Delivery';
  deliveryEtaEl.textContent = fmtCurrency(current.grandTotal || current.total || 0);
  callBtn.disabled = !current.phone;
  navigateBtn.disabled = !current.address;
  markDeliveredBtn.textContent = 'Mark as delivered';
  markDeliveredBtn.disabled = false;
}

function renderUpNext() {
  const upcoming = activeOrders.slice(1);

  if (upcoming.length === 0) {
    upNextListEl.innerHTML = `
      <div class="up-next-item">
        <h3>No orders in queue</h3>
        <p>Waiting for assignments from the dispatch team.</p>
      </div>
    `;
    upNextCountEl.textContent = '0 orders waiting';
    return;
  }

  upNextListEl.innerHTML = upcoming.map(order => `
    <div class="up-next-item">
      <h3>Order #${order.id.slice(-6).toUpperCase()}</h3>
      <p>${order.address || '—'} · ${orderItemsSummary(order)}</p>
      <span class="up-next-status">${order.status || 'Out for Delivery'}</span>
    </div>
  `).join('');
  upNextCountEl.textContent = `${upcoming.length} order${upcoming.length === 1 ? '' : 's'} waiting`;
}

function updateStats() {
  runsCountEl.textContent = deliveredCount;
  earningsAmountEl.textContent = fmtCurrency(earningsTotal);
  ratingValueEl.textContent = avgRating !== null ? avgRating.toFixed(1) : 'New';
}

function renderRiderStatus() {
  const online = activeOrders.length > 0 ? 'Busy' : 'Online';
  riderStatusTextEl.textContent = online;
  riderStatusDotEl.classList.remove('online', 'offline', 'busy');
  riderStatusDotEl.classList.add(online === 'Busy' ? 'busy' : 'online');
}

async function loadAssignedOrders() {
  // All orders assigned to this rider, delivered or not
  const q = query(collection(db, 'orders'), where('riderId', '==', riderUid));
  const snap = await getDocs(q).catch(() => ({ docs: [] }));
  const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Sort oldest-assigned-first for the queue
  orders.sort((a, b) => {
    const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
    const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
    return ta - tb;
  });

  activeOrders = orders.filter(o => o.status !== 'Delivered');
  const delivered = orders.filter(o => o.status === 'Delivered');
  deliveredCount = delivered.length;
  earningsTotal = delivered.reduce((sum, o) => sum + (Number(o.deliveryFee) || 0), 0);

  const rated = delivered.filter(o => Number.isFinite(Number(o.riderRating)));
  avgRating = rated.length
    ? rated.reduce((sum, o) => sum + Number(o.riderRating), 0) / rated.length
    : null;
}

async function refreshDashboard() {
  await loadAssignedOrders();
  renderCurrentDelivery();
  renderUpNext();
  updateStats();
  renderRiderStatus();
}

function openMaps() {
  const current = activeOrders[0];
  if (!current || !current.address) return;
  const mapQuery = encodeURIComponent(current.address);
  window.open(`https://www.google.com/maps/search/${mapQuery}`, '_blank');
}

function makeCall() {
  const current = activeOrders[0];
  if (!current || !current.phone) return;
  window.location.href = `tel:${current.phone.replace(/\s+/g, '')}`;
}

async function markDelivered() {
  const current = activeOrders[0];
  if (!current) return;

  markDeliveredBtn.disabled = true;
  markDeliveredBtn.textContent = 'Updating...';

  try {
    await updateDoc(doc(db, 'orders', current.id), { status: 'Delivered' });
    await refreshDashboard();
  } catch (err) {
    console.error('Failed to mark delivered:', err);
    markDeliveredBtn.disabled = false;
    markDeliveredBtn.textContent = 'Mark as delivered';
  }
}

navigateBtn.addEventListener('click', openMaps);
callBtn.addEventListener('click', makeCall);
markDeliveredBtn.addEventListener('click', markDelivered);

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userData = userDoc.exists() ? userDoc.data() : {};

  if (userData.role !== 'Deliveryman' || userData.riderStatus !== 'approved') {
    window.location.href = 'login.html';
    return;
  }

  riderUid = user.uid;
  renderRiderInfo(userData);
  await refreshDashboard();
});
