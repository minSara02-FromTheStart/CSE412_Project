const CURRENCY = "\u09F3";

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

// Export for unit testing (Node/CommonJS). Harmless in the browser via
// <script type="module">, since `module` doesn't exist there.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CURRENCY, TIERS, escapeHTML, getTier, fmtCurrency, toDate, fmtDate,
    estimateDelivery, orderItemsSummary, statusPillClass, getInitials,
    orderPoints, safePhoneHref
  };
}