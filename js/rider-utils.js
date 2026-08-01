function getInitials(name) {
  return (name || "Rider")
    .split(" ")
    .map(part => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("");
}

function fmtCurrency(n) {
  const num = Number(n);
  return isNaN(num) ? "৳0" : "৳" + num.toLocaleString();
}

function orderItemsSummary(order) {
  return Array.isArray(order.items)
    ? order.items.map(it => `${it.name} ×${it.qty}`).join(", ")
    : (order.product || "—");
}

// Browser
globalThis.getInitials = getInitials;
globalThis.fmtCurrency = fmtCurrency;
globalThis.orderItemsSummary = orderItemsSummary;

// Jest / Node
if (typeof module !== "undefined") {
  module.exports = {
    getInitials,
    fmtCurrency,
    orderItemsSummary
  };
}