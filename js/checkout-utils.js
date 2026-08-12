function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

function formatPrice(amount) {
  return "৳" + Number(amount || 0).toLocaleString();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  const cleaned = String(phone || "").trim();
  if (!cleaned) return false;

  const normalized = cleaned.replace(/^\+88/, "").replace(/^88/, "").replace(/[^0-9]/g, "");
  return /^(01[3-9]\d{8})$/.test(normalized) || /^(3|4|5|6|7|8|9)\d{9}$/.test(normalized);
}

function prefillCustomer(user, userData) {
  const fullName = document.getElementById("fullName");
  const phone = document.getElementById("phone");
  const email = document.getElementById("email");

  if (fullName && !fullName.value) fullName.value = userData.fullName || user.displayName || "";
  if (phone && !phone.value) phone.value = userData.phone || "";
  if (email && !email.value) email.value = userData.email || user.email || "";
}

function getSelectedDeliveryLabel() {
  const selected = document.querySelector("input[name='delivery']:checked");
  return selected
    ? selected.closest(".checkout-option").querySelector("strong").textContent.trim()
    : "Standard Delivery";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    escapeHTML,
    formatPrice,
    isValidEmail,
    isValidPhone,
    prefillCustomer,
    getSelectedDeliveryLabel
  };
}
