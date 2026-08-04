import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  TIERS, escapeHTML, getTier, fmtCurrency, toDate, fmtDate,
  estimateDelivery, orderItemsSummary, statusPillClass, getInitials,
  orderPoints, safePhoneHref
} from "./customer-dashboard-utils.js";

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

let currentOrders = [];

function ratingCellHTML(order) {
  if (!order.riderId) {
    return `<span class="rating-muted">—</span>`;
  }

  if (order.riderRating) {
    const filled = "★".repeat(order.riderRating);
    const empty = "☆".repeat(5 - order.riderRating);
    return `<span class="stars-display">${filled}${empty}</span>`;
  }

  if (order.status !== "Delivered") {
    return `<span class="rating-muted">Rate after delivery</span>`;
  }

  return `
    <div class="rate-stars" data-order-id="${escapeHTML(order.id)}">
      ${[1, 2, 3, 4, 5].map(n => `<span class="rate-star" data-value="${n}">☆</span>`).join("")}
    </div>
  `;
}

function renderHistory(orders) {
  currentOrders = orders;

  if (orders.length === 0) {
    historyBody.innerHTML = `<tr><td colspan="6" class="empty-cell">No orders yet. Your purchases will show up here.</td></tr>`;
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
        <td>${ratingCellHTML(order)}</td>
      </tr>
    `;
  }).join("");
}

// Star hover preview + click-to-submit, delegated on the table body since
// rows are re-rendered whenever orders reload.
historyBody.addEventListener("mouseover", (e) => {
  const star = e.target.closest(".rate-star");
  if (!star) return;
  const value = Number(star.dataset.value);
  const siblings = star.parentElement.querySelectorAll(".rate-star");
  siblings.forEach((s, i) => {
    s.classList.toggle("hovered", i < value);
    s.textContent = i < value ? "★" : "☆";
  });
});

historyBody.addEventListener("mouseout", (e) => {
  const wrap = e.target.closest(".rate-stars");
  if (!wrap) return;
  wrap.querySelectorAll(".rate-star").forEach(s => {
    s.classList.remove("hovered");
    s.textContent = "☆";
  });
});

historyBody.addEventListener("click", async (e) => {
  const star = e.target.closest(".rate-star");
  if (!star) return;

  const wrap = star.closest(".rate-stars");
  const orderId = wrap.dataset.orderId;
  const value = Number(star.dataset.value);

  wrap.innerHTML = "Saving...";

  try {
    await updateDoc(doc(db, "orders", orderId), { riderRating: value });
    const order = currentOrders.find(o => o.id === orderId);
    if (order) order.riderRating = value;
    renderHistory(currentOrders);
  } catch (err) {
    console.error("Failed to save rating:", err);
    wrap.innerHTML = `<span class="rating-muted">Failed to save, try again</span>`;
  }
});

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