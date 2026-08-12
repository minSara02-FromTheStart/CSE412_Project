import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================================
   LOYALTY TIERS
   ========================================================= */

const TIERS = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 50 },
  { name: "Gold", min: 150 },
  { name: "Platinum", min: 300 }
];


/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

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

  return {
    current,
    next
  };
}


function fmtCurrency(value) {
  return "৳" + (Number(value) || 0).toLocaleString();
}


function toDate(value) {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}


function fmtDate(value) {
  const date = toDate(value);

  if (!date) {
    return "-";
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}


function estimateDelivery(order) {
  const placed =
    toDate(order.createdAt) || new Date();

  const type =
    String(order.deliveryType || "").toLowerCase();

  const status =
    order.status || "Pending";


  if (status === "Delivered") {
    return "Delivered";
  }


  if (status === "Out for Delivery") {
    return "Arriving soon";
  }


  if (type.includes("instant")) {
    return "Expected today";
  }


  if (type.includes("pickup")) {
    return "Ready at pickup point";
  }


  const earliest = new Date(placed);
  const latest = new Date(placed);

  earliest.setDate(
    earliest.getDate() + 3
  );

  latest.setDate(
    latest.getDate() + 7
  );


  const options = {
    day: "numeric",
    month: "short"
  };


  return `Expected ${
    earliest.toLocaleDateString("en-GB", options)
  } - ${
    latest.toLocaleDateString("en-GB", options)
  }`;
}


function orderItemsSummary(order) {

  if (
    !Array.isArray(order.items) ||
    order.items.length === 0
  ) {
    return escapeHTML(
      order.product || "-"
    );
  }


  return order.items
    .map(item => {
      const name =
        escapeHTML(
          item.name || item.product || "Item"
        );

      const quantity =
        Number(
          item.qty ??
          item.quantity ??
          1
        ) || 1;

      return `${name} x ${quantity}`;
    })
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

  return (
    (name || "Customer")
      .trim()
      .split(/\s+/)
      .map(
        part =>
          part[0]?.toUpperCase() || ""
      )
      .slice(0, 2)
      .join("") || "C"
  );
}


function orderPoints(order) {

  if (
    Number.isFinite(
      Number(order.pointsEarned)
    )
  ) {
    return Number(
      order.pointsEarned
    );
  }


  return Math.floor(
    (
      Number(
        order.grandTotal ??
        order.total ??
        0
      ) || 0
    ) / 1500
  );
}


function safePhoneHref(phone) {

  return (
    "tel:" +
    String(phone || "")
      .replace(/[^\d+]/g, "")
  );
}


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const customerNameEl =
  document.getElementById("customerName");

const customerEmailEl =
  document.getElementById("customerEmail");

const customerPhoneEl =
  document.getElementById("customerPhone");

const memberSinceEl =
  document.getElementById("memberSince");

const pointsValueEl =
  document.getElementById("pointsValue");

const tierNameEl =
  document.getElementById("tierName");

const tierProgressBar =
  document.getElementById("tierProgressBar");

const tierProgressText =
  document.getElementById("tierProgressText");

const activeOrdersList =
  document.getElementById("activeOrdersList");

const historyBody =
  document.getElementById("historyBody");

const offersGrid =
  document.getElementById("offersGrid");

const statOrdersEl =
  document.getElementById("statOrders");

const statSpentEl =
  document.getElementById("statSpent");

const statDeliveredEl =
  document.getElementById("statDelivered");

const customerNameSide =
  document.getElementById("customerNameSide");

const customerAvatarLg =
  document.getElementById("customerAvatarLg");


/* =========================================================
   PROFILE
   ========================================================= */

function renderProfile(userData, firebaseUser) {

  const name =
    userData.fullName ||
    userData.name ||
    firebaseUser.displayName ||
    "Customer";

  const initials =
    getInitials(name);


  if (customerNameEl) {
    customerNameEl.textContent =
      name;
  }


  if (customerNameSide) {
    customerNameSide.textContent =
      name;
  }


  if (customerAvatarLg) {
    customerAvatarLg.textContent =
      initials;
  }


  if (customerEmailEl) {
    customerEmailEl.textContent =
      userData.email ||
      firebaseUser.email ||
      "-";
  }


  if (customerPhoneEl) {
    customerPhoneEl.textContent =
      userData.phone ||
      "-";
  }


  if (memberSinceEl) {

    memberSinceEl.textContent =
      userData.createdAt
        ? fmtDate(userData.createdAt)
        : "-";
  }
}


/* =========================================================
   LOYALTY
   ========================================================= */

function renderLoyalty(orders) {

  const points =
    orders.reduce(
      (sum, order) =>
        sum + orderPoints(order),
      0
    );


  const {
    current,
    next
  } = getTier(points);


  if (pointsValueEl) {
    pointsValueEl.textContent =
      points.toLocaleString();
  }


  if (tierNameEl) {
    tierNameEl.textContent =
      current.name;
  }


  if (next) {

    const span =
      next.min - current.min;

    const progress =
      Math.min(
        100,
        Math.round(
          (
            (points - current.min) /
            span
          ) * 100
        )
      );


    if (tierProgressBar) {
      tierProgressBar.style.width =
        progress + "%";
    }


    if (tierProgressText) {

      const remaining =
        Math.max(
          0,
          next.min - points
        );

      tierProgressText.textContent =
        `${remaining.toLocaleString()} points to ${next.name}`;
    }

  } else {

    if (tierProgressBar) {
      tierProgressBar.style.width =
        "100%";
    }


    if (tierProgressText) {
      tierProgressText.textContent =
        "Highest loyalty tier unlocked.";
    }
  }


  return points;
}


/* =========================================================
   MEMBER OFFERS
   ========================================================= */

function renderOffers(points) {

  if (!offersGrid) {
    return;
  }


  const {
    current
  } = getTier(points);


  const currentIndex =
    TIERS.findIndex(
      tier =>
        tier.name === current.name
    );


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


  offersGrid.innerHTML =
    offers.map(offer => {

      const unlocked =
        currentIndex >=
        offer.tierIndex;


      return `
        <div class="offer-card ${
          unlocked ? "" : "locked"
        }">

          <div class="offer-icon">
            ${offer.icon}
          </div>

          <h4>
            ${offer.title}
          </h4>

          <p>
            ${offer.desc}
          </p>

          <span class="offer-badge ${
            unlocked ? "unlocked" : ""
          }">

            ${
              unlocked
                ? "Unlocked"
                : `Unlocks at ${
                    TIERS[
                      offer.tierIndex
                    ].name
                  }`
            }

          </span>

        </div>
      `;

    }).join("");
}


/* =========================================================
   ACTIVE ORDERS
   ========================================================= */

function renderActiveOrders(orders) {

  if (!activeOrdersList) {
    return;
  }


  const active =
    orders.filter(
      order =>
        (order.status || "Pending") !==
        "Delivered"
    );


  if (active.length === 0) {

    activeOrdersList.innerHTML = `
      <div class="empty-state">

        <p>
          No active orders right now.
        </p>

        <a
          href="products.html"
          class="btn-link"
        >
          Browse products
        </a>

      </div>
    `;

    return;
  }


  activeOrdersList.innerHTML =
    active.map(order => {

      const status =
        order.status || "Pending";


      const riderName =
        order.riderName
          ? escapeHTML(
              order.riderName
            )
          : "Not assigned yet";


      const riderPhone =
        order.riderPhone
          ? `
            <a href="${safePhoneHref(
              order.riderPhone
            )}">
              ${escapeHTML(
                order.riderPhone
              )}
            </a>
          `
          : "-";


      return `
        <div class="order-track-card">

          <div class="order-track-head">

            <div>

              <p class="order-id-label">
                Order #${escapeHTML(
                  String(order.id)
                    .slice(-6)
                    .toUpperCase()
                )}
              </p>

              <p class="order-date">
                Placed ${
                  fmtDate(
                    order.createdAt
                  )
                }
              </p>

            </div>

            <span class="${statusPillClass(
              status
            )}">
              ${escapeHTML(status)}
            </span>

          </div>


          <p class="order-items">
            ${orderItemsSummary(order)}
          </p>


          <div class="order-track-grid">

            <div>
              <p class="track-label">
                Delivery rider
              </p>

              <p class="track-value">
                ${riderName}
              </p>
            </div>


            <div>
              <p class="track-label">
                Rider phone
              </p>

              <p class="track-value">
                ${riderPhone}
              </p>
            </div>


            <div>
              <p class="track-label">
                Estimated delivery
              </p>

              <p class="track-value">
                ${escapeHTML(
                  estimateDelivery(order)
                )}
              </p>
            </div>


            <div>
              <p class="track-label">
                Order total
              </p>

              <p class="track-value">
                ${fmtCurrency(
                  order.grandTotal ??
                  order.total ??
                  0
                )}
              </p>
            </div>

          </div>

        </div>
      `;

    }).join("");
}


/* =========================================================
   ORDER HISTORY
   ========================================================= */

let currentOrders = [];


function ratingCellHTML(order) {

  if (!order.riderId) {
    return `
      <span class="rating-muted">
        —
      </span>
    `;
  }


  if (order.riderRating) {

    const rating =
      Number(order.riderRating);

    const filled =
      "★".repeat(
        Math.max(
          0,
          Math.min(5, rating)
        )
      );

    const empty =
      "☆".repeat(
        Math.max(
          0,
          5 - rating
        )
      );


    return `
      <span class="stars-display">
        ${filled}${empty}
      </span>
    `;
  }


  if (
    order.status !==
    "Delivered"
  ) {

    return `
      <span class="rating-muted">
        Rate after delivery
      </span>
    `;
  }


  return `
    <div
      class="rate-stars"
      data-order-id="${escapeHTML(
        order.id
      )}"
    >

      ${[1, 2, 3, 4, 5]
        .map(
          number => `
            <span
              class="rate-star"
              data-value="${number}"
            >
              ☆
            </span>
          `
        )
        .join("")}

    </div>
  `;
}


function renderHistory(orders) {

  currentOrders =
    orders;


  if (!historyBody) {
    return;
  }


  if (orders.length === 0) {

    historyBody.innerHTML = `
      <tr>

        <td
          colspan="6"
          class="empty-cell"
        >
          No orders yet.
          Your purchases will show up here.
        </td>

      </tr>
    `;

    return;
  }


  historyBody.innerHTML =
    orders.map(order => {

      const status =
        order.status || "Pending";


      return `
        <tr>

          <td>
            #${escapeHTML(
              String(order.id)
                .slice(-6)
                .toUpperCase()
            )}
          </td>

          <td>
            ${fmtDate(
              order.createdAt
            )}
          </td>

          <td>
            ${orderItemsSummary(order)}
          </td>

          <td>
            ${fmtCurrency(
              order.grandTotal ??
              order.total ??
              0
            )}
          </td>

          <td>

            <span class="${statusPillClass(
              status
            )}">
              ${escapeHTML(status)}
            </span>

          </td>

          <td>
            ${ratingCellHTML(order)}
          </td>

        </tr>
      `;

    }).join("");
}


/* =========================================================
   STAR RATING
   ========================================================= */

if (historyBody) {

  historyBody.addEventListener(
    "mouseover",
    event => {

      const star =
        event.target.closest(
          ".rate-star"
        );

      if (!star) {
        return;
      }


      const value =
        Number(
          star.dataset.value
        );


      const stars =
        star.parentElement
          .querySelectorAll(
            ".rate-star"
          );


      stars.forEach(
        (item, index) => {

          item.classList.toggle(
            "hovered",
            index < value
          );

          item.textContent =
            index < value
              ? "★"
              : "☆";

        }
      );

    }
  );


  historyBody.addEventListener(
    "mouseout",
    event => {

      const wrapper =
        event.target.closest(
          ".rate-stars"
        );

      if (!wrapper) {
        return;
      }


      wrapper
        .querySelectorAll(
          ".rate-star"
        )
        .forEach(star => {

          star.classList.remove(
            "hovered"
          );

          star.textContent =
            "☆";

        });

    }
  );


  historyBody.addEventListener(
    "click",
    async event => {

      const star =
        event.target.closest(
          ".rate-star"
        );

      if (!star) {
        return;
      }


      const wrapper =
        star.closest(
          ".rate-stars"
        );


      const orderId =
        wrapper.dataset.orderId;


      const rating =
        Number(
          star.dataset.value
        );


      wrapper.innerHTML =
        "Saving...";


      try {

        await updateDoc(
          doc(
            db,
            "orders",
            orderId
          ),
          {
            riderRating: rating
          }
        );


        const order =
          currentOrders.find(
            item =>
              item.id === orderId
          );


        if (order) {
          order.riderRating =
            rating;
        }


        renderHistory(
          currentOrders
        );


      } catch (error) {

        console.error(
          "Failed to save rating:",
          error
        );


        wrapper.innerHTML = `
          <span class="rating-muted">
            Failed to save, try again
          </span>
        `;

      }

    }
  );

}


/* =========================================================
   STATISTICS
   ========================================================= */

function renderStats(orders) {

  const delivered =
    orders.filter(
      order =>
        order.status ===
        "Delivered"
    ).length;


  const totalSpent =
    orders.reduce(
      (sum, order) => {

        const amount =
          Number(
            order.grandTotal ??
            order.total ??
            0
          ) || 0;

        return sum + amount;

      },
      0
    );


  if (statOrdersEl) {
    statOrdersEl.textContent =
      orders.length;
  }


  if (statSpentEl) {
    statSpentEl.textContent =
      fmtCurrency(totalSpent);
  }


  if (statDeliveredEl) {
    statDeliveredEl.textContent =
      delivered;
  }
}


/* =========================================================
   LOAD CUSTOMER ORDERS
   ========================================================= */

async function loadOrders(uid) {

  console.log(
    "Customer dashboard: loading orders for UID:",
    uid
  );


  const ordersMap =
    new Map();


  /*
   * IMPORTANT:
   *
   * New checkout orders contain:
   *
   * customerId: currentUser.uid
   * uid: currentUser.uid
   *
   * So customerId is the primary lookup.
   */


  try {

    const customerIdQuery =
      query(
        collection(
          db,
          "orders"
        ),
        where(
          "customerId",
          "==",
          uid
        )
      );


    const customerIdSnap =
      await getDocs(
        customerIdQuery
      );


    console.log(
      "Orders found using customerId:",
      customerIdSnap.size
    );


    customerIdSnap.forEach(
      orderDoc => {

        ordersMap.set(
          orderDoc.id,
          {
            id: orderDoc.id,
            ...orderDoc.data()
          }
        );

      }
    );


  } catch (error) {

    console.warn(
      "customerId order query failed:",
      error
    );

  }


  /*
   * Compatibility query.
   *
   * This catches older orders that may
   * only have uid.
   */


  try {

    const uidQuery =
      query(
        collection(
          db,
          "orders"
        ),
        where(
          "uid",
          "==",
          uid
        )
      );


    const uidSnap =
      await getDocs(
        uidQuery
      );


    console.log(
      "Orders found using uid:",
      uidSnap.size
    );


    uidSnap.forEach(
      orderDoc => {

        if (
          !ordersMap.has(
            orderDoc.id
          )
        ) {

          ordersMap.set(
            orderDoc.id,
            {
              id: orderDoc.id,
              ...orderDoc.data()
            }
          );

        }

      }
    );


  } catch (error) {

    console.warn(
      "uid order query failed:",
      error
    );

  }


  const orders =
    Array.from(
      ordersMap.values()
    );


  orders.sort(
    (a, b) => {

      const timeA =
        toDate(
          a.createdAt
        )?.getTime() || 0;


      const timeB =
        toDate(
          b.createdAt
        )?.getTime() || 0;


      return timeB - timeA;

    }
  );


  console.log(
    "Customer dashboard: total orders loaded:",
    orders.length
  );


  return orders;
}


/* =========================================================
   DASHBOARD INITIALIZATION
   ========================================================= */

async function init(
  user,
  userData
) {

  renderProfile(
    userData,
    user
  );


  const orders =
    await loadOrders(
      user.uid
    );


  const points =
    renderLoyalty(
      orders
    );


  renderOffers(
    points
  );


  renderActiveOrders(
    orders
  );


  renderHistory(
    orders
  );


  renderStats(
    orders
  );
}


/* =========================================================
   AUTHENTICATION
   ========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    try {

      /*
       * User is not logged in.
       */

      if (!user) {

        window.location.href =
          "login.html";

        return;
      }


      console.log(
        "Customer dashboard: authenticated user:",
        user.uid
      );


      /*
       * Load Firestore user profile.
       */

      const userRef =
        doc(
          db,
          "users",
          user.uid
        );


      const userDoc =
        await getDoc(
          userRef
        );


      const userData =
        userDoc.exists()
          ? userDoc.data()
          : {};


      const role =
        userData.role ||
        "Customer";


      /*
       * Admin users go to admin dashboard.
       */

      if (
        role === "Admin"
      ) {

        window.location.href =
          "admin.html";

        return;
      }


      /*
       * Deliverymen go to rider dashboard.
       */

      if (
        role === "Deliveryman"
      ) {

        window.location.href =
          "rider-dashboard.html";

        return;
      }


      /*
       * Normal customer.
       */

      await init(
        user,
        userData
      );


    } catch (error) {

      console.error(
        "Customer dashboard initialization failed:",
        error
      );


      /*
       * Never leave the original
       * "Loading your orders..."
       * message on screen.
       */

      if (activeOrdersList) {

        activeOrdersList.innerHTML = `
          <div class="empty-state">

            <p>
              Unable to load your orders.
            </p>

            <p>
              Please refresh the page
              and try again.
            </p>

          </div>
        `;
      }


      if (historyBody) {

        historyBody.innerHTML = `
          <tr>

            <td
              colspan="6"
              class="empty-cell"
            >
              Unable to load your order history.
              Please refresh the page and try again.
            </td>

          </tr>
        `;
      }

    }

  }
);