import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CURRENCY = "\u09F3";

const customerNameEl = document.getElementById("customerName");
const customerAvatarEl = document.getElementById("customerAvatar");
const customerEmailEl = document.getElementById("customerEmail");
const customerPhoneEl = document.getElementById("customerPhone");
const memberSinceEl = document.getElementById("memberSince");

const pointsValueEl = document.getElementById("pointsValue");
const tierNameEl = document.getElementById("tierName");
const tierProgressBar = document.getElementById("tierProgressBar");
const tierProgressText = document.getElementById("tierProgressText");

const activeOrdersList = document.getElementById("activeOrdersList");
const historyBody = document.getElementById("historyBody");
const offersGrid = document.getElementById("offersGrid");

const statOrdersEl = document.getElementById("statOrders");
const statSpentEl = document.getElementById("statSpent");
const statDeliveredEl = document.getElementById("statDelivered");

const TIERS = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 50 },
  { name: "Gold", min: 150 },
  { name: "Platinum", min: 300 }
];

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

function getTier(points) {
  let current = TIERS[0];
  let next = null;

  for (let i = 0; i < TIERS.length; i++) {
    if (points >= TIERS[i].min) {
      current = TIERS[i];
      next = TIERS[i + 1] || null;
    }
  }

  return { current, next };
}

function fmtCurrency(n) {
  const num = Number(n) || 0;
  return CURRENCY + num.toLocaleString();
}

function toDate(ts) {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDate(ts) {
  const d = toDate(ts);
  if (!d) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function estimateDelivery(order) {
  const placed = toDate(order.createdAt) || new Date();
  const type = (order.deliveryType || "").toLowerCase();
  const status = order.status || "Pending";

  if (status === "Delivered") return "Delivered";
  if (status === "Out for Delivery") return "Arriving soon";

  if (type.includes("instant")) {
    return "Expected today";
  }

  if (type.includes("pickup")) {
    return "Ready at pickup point";
  }

  const earliest = new Date(placed);
  const latest = new Date(placed);
  earliest.setDate(earliest.getDate() + 3);
  latest.setDate(latest.getDate() + 7);

  const opts = { day: "numeric", month: "short" };
  return `Expected ${earliest.toLocaleDateString("en-GB", opts)} - ${latest.toLocaleDateString("en-GB", opts)}`;
}

function orderItemsSummary(order) {
  if (!Array.isArray(order.items) || order.items.length === 0) {
    return escapeHTML(order.product || "-");
  }

  return order.items
    .map(item => `${escapeHTML(item.name)} x ${Number(item.qty) || 1}`)
    .join(", ");
}

function statusPillClass(status) {
  switch (status) {
    case "Delivered":
      return "pill pill-delivered";
    case "Out for Delivery":
      return "pill pill-outfordelivery";
    case "Processing":
      return "pill pill-processing";
    default:
      return "pill pill-pending";
  }
}

function getInitials(name) {
  return (name || "Customer")
    .split(" ")
    .map(part => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "C";
}

function orderPoints(order) {
  if (Number.isFinite(Number(order.pointsEarned))) {
    return Number(order.pointsEarned);
  }

  return Math.floor((Number(order.grandTotal || order.total) || 0) / 1500);
}

function safePhoneHref(phone) {
  return "tel:" + String(phone || "").replace(/[^\d+]/g, "");
}

function renderProfile(userData) {
  const name = userData.fullName || "Customer";
  const initials = getInitials(name);
  const sideNameEl = document.getElementById("customerNameSide");
  const sideAvatarEl = document.getElementById("customerAvatarLg");

  customerNameEl.textContent = name;
  if (customerAvatarEl) customerAvatarEl.textContent = initials;

  if (sideNameEl) sideNameEl.textContent = name;
  if (sideAvatarEl) sideAvatarEl.textContent = initials;

  customerEmailEl.textContent = userData.email || "-";
  customerPhoneEl.textContent = userData.phone || "-";
  memberSinceEl.textContent = userData.createdAt ? fmtDate(userData.createdAt) : "-";
}

function renderLoyalty(orders) {
  const points = orders.reduce((sum, order) => sum + orderPoints(order), 0);
  const { current, next } = getTier(points);

  pointsValueEl.textContent = points.toLocaleString();
  tierNameEl.textContent = current.name;

  if (next) {
    const span = next.min - current.min;
    const progress = Math.min(100, Math.round(((points - current.min) / span) * 100));
    tierProgressBar.style.width = progress + "%";
    tierProgressText.textContent = `${(next.min - points).toLocaleString()} points to ${next.name}`;
  } else {
    tierProgressBar.style.width = "100%";
    tierProgressText.textContent = "Highest loyalty tier unlocked.";
  }

  return points;
}

function renderOffers(points) {
  const { current } = getTier(points);
  const currentIndex = TIERS.findIndex(t => t.name === current.name);

  const offers = [
    {
      icon: "10%",
      title: "Welcome Bonus",
      desc: "Member-only pricing on selected dry fruit packs.",
      tierIndex: 0
    },
    {
      icon: "FREE",
      title: "Free Standard Delivery",
      desc: "Use your Silver tier to remove standard delivery fees.",
      tierIndex: 1
    },
    {
      icon: "24H",
      title: "Early Flash Sale Access",
      desc: "Gold members see selected flash deals first.",
      tierIndex: 2
    },
    {
      icon: "VIP",
      title: "Priority Bundles",
      desc: "Platinum members get private bundle offers.",
      tierIndex: 3
    }
  ];

  offersGrid.innerHTML = offers.map(offer => {
    const unlocked = currentIndex >= offer.tierIndex;
    return `
      <div class="offer-card ${unlocked ? "" : "locked"}">
        <div class="offer-icon">${offer.icon}</div>
        <h4>${offer.title}</h4>
        <p>${offer.desc}</p>
        <span class="offer-badge ${unlocked ? "unlocked" : ""}">
          ${unlocked ? "Unlocked" : `Unlocks at ${TIERS[offer.tierIndex].name}`}
        </span>
      </div>
    `;
  }).join("");
}

function renderActiveOrders(orders) {
  const active = orders.filter(order => (order.status || "Pending") !== "Delivered");

  if (active.length === 0) {
    activeOrdersList.innerHTML = `
      <div class="empty-state">
        <p>No active orders right now.</p>
        <a href="products.html" class="btn-link">Browse products</a>
      </div>
    `;
    return;
  }

  activeOrdersList.innerHTML = active.map(order => {
    const status = order.status || "Pending";
    const riderName = order.riderName ? escapeHTML(order.riderName) : "Not assigned yet";
    const riderPhone = order.riderPhone
      ? `<a href="${safePhoneHref(order.riderPhone)}">${escapeHTML(order.riderPhone)}</a>`
      : "-";

    return `
      <div class="order-track-card">
        <div class="order-track-head">
          <div>
            <p class="order-id-label">Order #${escapeHTML(order.id.slice(-6).toUpperCase())}</p>
            <p class="order-date">Placed ${fmtDate(order.createdAt)}</p>
          </div>
          <span class="${statusPillClass(status)}">${escapeHTML(status)}</span>
        </div>

        <p class="order-items">${orderItemsSummary(order)}</p>

        <div class="order-track-grid">
          <div>
            <p class="track-label">Delivery rider</p>
            <p class="track-value">${riderName}</p>
          </div>
          <div>
            <p class="track-label">Rider phone</p>
            <p class="track-value">${riderPhone}</p>
          </div>
          <div>
            <p class="track-label">Estimated delivery</p>
            <p class="track-value">${escapeHTML(estimateDelivery(order))}</p>
          </div>
          <div>
            <p class="track-label">Order total</p>
            <p class="track-value">${fmtCurrency(order.grandTotal || order.total)}</p>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderHistory(orders) {
  if (orders.length === 0) {
    historyBody.innerHTML = `<tr><td colspan="5" class="empty-cell">No orders yet. Your purchases will show up here.</td></tr>`;
    return;
  }

  historyBody.innerHTML = orders.map(order => {
    const status = order.status || "Pending";
    return `
      <tr>
        <td>#${escapeHTML(order.id.slice(-6).toUpperCase())}</td>
        <td>${fmtDate(order.createdAt)}</td>
        <td>${orderItemsSummary(order)}</td>
        <td>${fmtCurrency(order.grandTotal || order.total)}</td>
        <td><span class="${statusPillClass(status)}">${escapeHTML(status)}</span></td>
      </tr>
    `;
  }).join("");
}

function renderStats(orders) {
  const delivered = orders.filter(order => order.status === "Delivered").length;
  const totalSpent = orders.reduce((sum, order) => sum + (Number(order.grandTotal || order.total) || 0), 0);

  statOrdersEl.textContent = orders.length;
  statSpentEl.textContent = fmtCurrency(totalSpent);
  statDeliveredEl.textContent = delivered;
}

async function loadOrders(uid) {
  const ordersQuery = query(collection(db, "orders"), where("uid", "==", uid));
  const snap = await getDocs(ordersQuery).catch(() => ({ docs: [] }));
  const orders = snap.docs.map(orderDoc => ({ id: orderDoc.id, ...orderDoc.data() }));

  orders.sort((a, b) => {
    const ta = toDate(a.createdAt)?.getTime() || 0;
    const tb = toDate(b.createdAt)?.getTime() || 0;
    return tb - ta;
  });

  return orders;
}

async function init(user, userData) {
  const profile = {
    ...userData,
    email: userData.email || user.email
  };

  renderProfile(profile);

  const orders = await loadOrders(user.uid);
  const points = renderLoyalty(orders);
  renderOffers(points);
  renderActiveOrders(orders);
  renderHistory(orders);
  renderStats(orders);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.exists() ? userDoc.data() : {};
  const role = userData.role || "Customer";

  if (role === "Admin") {
    window.location.href = "admin.html";
    return;
  }

  if (role === "Deliveryman") {
    window.location.href = "rider-dashboard.html";
    return;
  }

  init(user, userData);
});


