import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAJOWu8ZYEyUms8nF1uVBw2m9v4ApNaT4s",
  authDomain: "nutrinest-408d4.firebaseapp.com",
  projectId: "nutrinest-408d4",
  storageBucket: "nutrinest-408d4.firebasestorage.app",
  messagingSenderId: "44196278510",
  appId: "1:44196278510:web:11acb64840e2d536c843ff"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const riderNameEl = document.getElementById('riderName');
const riderAvatarEl = document.getElementById('riderAvatar');
const riderIdEl = document.getElementById('riderId');
const runsCountEl = document.getElementById('runsCount');
const earningsAmountEl = document.getElementById('earningsAmount');
const ratingValueEl = document.getElementById('ratingValue');
const orderIdEl = document.getElementById('orderId');
const deliveryStatusEl = document.getElementById('deliveryStatus');
const deliveryAddressEl = document.getElementById('deliveryAddress');
const deliveryDistanceEl = document.getElementById('deliveryDistance');
const deliveryEtaEl = document.getElementById('deliveryEta');
const markDeliveredBtn = document.getElementById('markDeliveredBtn');
const navigateBtn = document.getElementById('navigateBtn');
const callBtn = document.getElementById('callBtn');
const riderStatusDotEl = document.getElementById('riderStatusDot');
const riderStatusTextEl = document.getElementById('riderStatusText');
const upNextListEl = document.getElementById('upNextList');
const upNextCountEl = document.getElementById('upNextCount');

let currentDelivery = null;
let upcomingOrders = [];
let riderData = {};

function getInitials(name) {
  return name
    .split(' ')
    .map(part => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('');
}

function setDeliveryData(delivery) {
  if (!delivery) {
    currentDelivery = {
      orderId: 'No active order',
      address: 'No delivery assigned yet',
      distance: '—',
      eta: '—',
      phone: '',
      status: 'Waiting for assignment'
    };
    return;
  }

  currentDelivery = {
    orderId: delivery.orderId || 'No active order',
    address: delivery.address || 'No delivery assigned yet',
    distance: delivery.distance || '—',
    eta: delivery.eta || '—',
    phone: delivery.phone || '',
    status: delivery.status || 'Waiting for assignment'
  };
}

function setUpcomingOrders(orders) {
  upcomingOrders = Array.isArray(orders) ? orders : [];
}

function renderRiderInfo(userData) {
  const name = userData.fullName || 'Rider';
  riderNameEl.textContent = name;
  riderAvatarEl.textContent = getInitials(name);
  riderIdEl.textContent = `Rider ID: ${userData.riderId || 'RD-0192'}`;
}

function renderCurrentDelivery() {
  orderIdEl.textContent = currentDelivery.orderId;
  deliveryStatusEl.textContent = currentDelivery.status;
  deliveryAddressEl.textContent = currentDelivery.address;
  deliveryDistanceEl.textContent = currentDelivery.distance;
  deliveryEtaEl.textContent = currentDelivery.eta;
  callBtn.disabled = !currentDelivery.phone;
  navigateBtn.disabled = currentDelivery.address === 'No delivery assigned yet' || currentDelivery.address === '—';
  if (currentDelivery.orderId === 'No active order') {
    markDeliveredBtn.textContent = 'No active delivery';
    markDeliveredBtn.disabled = true;
  } else {
    markDeliveredBtn.textContent = currentDelivery.status === 'Delivered' ? 'Delivered' : 'Mark as delivered';
    markDeliveredBtn.disabled = currentDelivery.status === 'Delivered';
  }
}

function renderUpNext() {
  if (upcomingOrders.length === 0) {
    upNextListEl.innerHTML = `
      <div class="up-next-item">
        <h3>No orders in queue</h3>
        <p>Waiting for assignments from the dispatch team.</p>
      </div>
    `;
    upNextCountEl.textContent = '0 orders waiting';
    return;
  }

  upNextListEl.innerHTML = upcomingOrders.map(order => `
    <div class="up-next-item">
      <h3>Order ${order.orderId || order.id}</h3>
      <p>${order.address || order.location} · ${order.distance || '—'}</p>
      <span class="up-next-status">${order.status || 'Waiting'}</span>
    </div>
  `).join('');
  upNextCountEl.textContent = `${upcomingOrders.length} orders waiting`;
}

function updateStats() {
  runsCountEl.textContent = riderData.runs != null ? riderData.runs : 0;
  earningsAmountEl.textContent = `৳${riderData.earnings != null ? riderData.earnings : 0}`;
  ratingValueEl.textContent = riderData.rating != null ? Number(riderData.rating).toFixed(1) : '0.0';
}

function renderRiderStatus(status) {
  const normalized = (status || 'Online').toString().trim();
  riderStatusTextEl.textContent = normalized;
  riderStatusDotEl.classList.remove('online', 'offline', 'busy');

  const lower = normalized.toLowerCase();
  if (lower.includes('online') || lower.includes('available')) {
    riderStatusDotEl.classList.add('online');
  } else if (lower.includes('deliver') || lower.includes('on the way') || lower.includes('assigned') || lower.includes('busy')) {
    riderStatusDotEl.classList.add('busy');
  } else {
    riderStatusDotEl.classList.add('offline');
  }
}

async function saveRiderState() {
  const user = auth.currentUser;
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);

  const savedDelivery = currentDelivery.orderId === 'No active order' ? null : currentDelivery;
  await updateDoc(userRef, {
    currentDelivery: savedDelivery,
    upcomingOrders: upcomingOrders,
    runs: riderData.runs || 0,
    earnings: riderData.earnings || 0,
    rating: riderData.rating || 0,
    completedDeliveries: riderData.completedDeliveries || 0
  });
}

function openMaps() {
  const query = encodeURIComponent(currentDelivery.address);
  window.open(`https://www.google.com/maps/search/${query}`, '_blank');
}

function makeCall() {
  window.location.href = `tel:${currentDelivery.phone.replace(/\s+/g, '')}`;
}

async function markDelivered() {
  if (currentDelivery.orderId === 'No active order' || currentDelivery.status === 'Delivered') return;
  currentDelivery.status = 'Delivered';
  riderData.completedDeliveries = (riderData.completedDeliveries || 0) + 1;
  renderCurrentDelivery();

  if (upcomingOrders.length) {
    const nextOrder = upcomingOrders.shift();
    setDeliveryData({
      orderId: nextOrder.orderId || nextOrder.id,
      address: nextOrder.address || nextOrder.location,
      distance: nextOrder.distance || '—',
      eta: nextOrder.eta || '10 min',
      phone: nextOrder.phone || currentDelivery.phone,
      status: 'On the way'
    });
  } else {
    setDeliveryData(null);
  }

  renderCurrentDelivery();
  renderUpNext();
  updateStats();
  await saveRiderState();
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

  if (userData.role !== 'Deliveryman') {
    window.location.href = 'login.html';
    return;
  }

  riderData = userData;
  renderRiderInfo(userData);
  renderRiderStatus(userData.status || 'Online');
  setDeliveryData(userData.currentDelivery);
  setUpcomingOrders(userData.upcomingOrders);
  renderCurrentDelivery();
  renderUpNext();
  updateStats();
});
