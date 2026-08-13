import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CURRENCY = "\u09F3";

const checkoutForm = document.getElementById("checkoutForm");
const summaryItems = document.getElementById("summary-items");
const subtotalText = document.getElementById("subtotal");
const deliveryText = document.getElementById("delivery");
const grandTotalText = document.getElementById("grandTotal");
const checkoutMessage = document.getElementById("checkoutMessage");
const deliveryOptions = document.querySelectorAll("input[name='delivery']");
const submitBtn = checkoutForm ? checkoutForm.querySelector(".place-order") : null;

// ===================== COUPON ELEMENTS =====================
const couponInput = document.getElementById("couponInput");
const applyCouponBtn = document.getElementById("applyCouponBtn");
const removeCouponBtn = document.getElementById("removeCouponBtn");
const couponMessage = document.getElementById("couponMessage");
const discountRow = document.getElementById("discountRow");
const discountAmountText = document.getElementById("discountAmount");
const appliedCouponCodeText = document.getElementById("appliedCouponCode");

// ===================== COUPON DEFINITIONS =====================
// Built-in coupons. Admin-created coupons are merged in from Firestore
// via loadCustomCoupons() below — nothing else needs to change to add one.
let couponList = [
  {
    code: "FIRST10",
    badge: "New Customer",
    title: "10% Off First Purchase",
    desc: "Get 10% off on all products when you shop with us for the first time. Apply this code at checkout.",
    type: "percentage",
    value: 10,
    minOrder: 0,
    oneTimeOnly: true
  },
  {
    code: "SAVE15",
    badge: "Min Order \u09F32000",
    title: "15% Off on Orders Above \u09F32000",
    desc: "Spend \u09F32000 or more on any product and get a flat 15% discount using this code.",
    type: "percentage",
    value: 15,
    minOrder: 2000,
    oneTimeOnly: false
  },
  {
    code: "FLASH20",
    badge: "Limited Time",
    title: "20% Off Flash Sale Items",
    desc: "Use this code on any item listed under Flash Sales to enjoy an extra 20% discount.",
    type: "percentage",
    value: 20,
    minOrder: 0,
    oneTimeOnly: false
  },
  {
    code: "FREESHIP",
    badge: "Delivery",
    title: "Free Delivery on Orders Above \u09F31000",
    desc: "Skip the delivery charge entirely when your order total crosses \u09F31000.",
    type: "freeShip",
    value: 0,
    minOrder: 1000,
    oneTimeOnly: false
  }
];

// Load custom coupons from Firestore (admin-created loyalty/promo coupons)
async function loadCustomCoupons() {
  try {
    const snapshot = await getDocs(collection(db, "custom_coupons"));
    snapshot.forEach(docSnap => {
      const customCoupon = { id: docSnap.id, ...docSnap.data() };
      if (!couponList.find(c => c.code === customCoupon.code)) {
        couponList.push(customCoupon);
      }
    });
  } catch (err) {
    console.error("Error loading custom coupons:", err);
  }
}

// ===================== STATE =====================
const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
let subtotal = Number(localStorage.getItem("cartTotal")) || 0;
let currentUser = null;
let currentUserData = {};
let appliedCoupon = null; // the matched entry from couponList, or null

// ===================== HELPERS =====================
function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

function formatPrice(amount) {
  return CURRENCY + Number(amount || 0).toLocaleString();
}

function setCheckoutMessage(message, color = "") {
  if (!checkoutMessage) return;
  checkoutMessage.style.color = color;
  checkoutMessage.textContent = message;
}

function setCouponMessage(message, type = "") {
  if (!couponMessage) return;
  couponMessage.textContent = message;
  couponMessage.className = "coupon-message" + (type ? " " + type : "");
}

function selectedDeliveryFee() {
  const selected = document.querySelector("input[name='delivery']:checked");
  return selected ? Number(selected.value) : 0;
}

function getSelectedDeliveryLabel() {
  const selected = document.querySelector("input[name='delivery']:checked");
  return selected
    ? selected.closest(".checkout-option").querySelector("strong").textContent.trim()
    : "Standard Delivery";
}

// Single source of truth for how much a coupon saves, given the
// currently-selected delivery fee. Percentage coupons discount the
// subtotal; freeShip coupons waive the delivery fee (only once the
// minimum order is met).
function getDiscountAmount(deliveryFee) {
  if (!appliedCoupon) return 0;

  if (appliedCoupon.type === "freeShip") {
    return subtotal >= appliedCoupon.minOrder ? deliveryFee : 0;
  }

  return Math.round((subtotal * Number(appliedCoupon.value || 0)) / 100);
}

function updateSubmitState() {
  if (!submitBtn) return;

  if (cartItems.length === 0) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Cart is empty";
    return;
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Confirm Order";
}

function renderSummary() {
  if (!summaryItems) return;

  if (cartItems.length === 0) {
    summaryItems.innerHTML = `
      <p class="empty-summary">
        No items found in your cart.
      </p>
    `;
    updateTotal();
    updateSubmitState();
    return;
  }

  summaryItems.innerHTML = cartItems.map(item => {
    const quantity = Number(item.quantity) || 1;
    const itemTotal = Number(item.price) * quantity;
    return `
      <div class="summary-item">
        <span>${escapeHTML(item.product)} x ${quantity}</span>
        <strong>${formatPrice(itemTotal)}</strong>
      </div>
    `;
  }).join("");

  updateTotal();
  updateSubmitState();
}

function updateTotal() {
  const deliveryFee = selectedDeliveryFee();
  const discount = getDiscountAmount(deliveryFee);
  const total = Math.max(0, subtotal + deliveryFee - discount);

  if (subtotalText) subtotalText.textContent = formatPrice(subtotal);
  if (deliveryText) deliveryText.textContent = formatPrice(deliveryFee);
  if (grandTotalText) grandTotalText.textContent = formatPrice(total);

  if (discountRow) {
    if (appliedCoupon && discount > 0) {
      discountRow.style.display = "flex";
      if (appliedCouponCodeText) appliedCouponCodeText.textContent = `(${appliedCoupon.code})`;
      if (discountAmountText) discountAmountText.textContent = "-" + formatPrice(discount);
    } else {
      discountRow.style.display = "none";
    }
  }
}

// ===================== COUPON APPLICATION LOGIC =====================

async function hasUserUsedCoupon(couponCode) {
  // Only applies to logged-in users
  if (!currentUser) return false;

  try {
    const ordersQuery = query(
      collection(db, "orders"),
      where("uid", "==", currentUser.uid),
      where("discountCode", "==", couponCode)
    );
    const snapshot = await getDocs(ordersQuery);
    return snapshot.size > 0;
  } catch (error) {
    console.error("Error checking coupon usage:", error);
    return false;
  }
}

async function applyCoupon() {
  if (!couponInput || !couponMessage) return;

  const code = couponInput.value.trim().toUpperCase();

  if (!code) {
    setCouponMessage("Please enter a coupon code.", "error");
    appliedCoupon = null;
    updateTotal();
    return;
  }

  const coupon = couponList.find(c => c.code === code);

  if (!coupon) {
    setCouponMessage("Invalid coupon code.", "error");
    appliedCoupon = null;
    updateTotal();
    return;
  }

  if (coupon.oneTimeOnly) {
    const alreadyUsed = await hasUserUsedCoupon(code);
    if (alreadyUsed) {
      setCouponMessage(`You have already used the "${code}" coupon. This coupon can only be used once.`, "error");
      appliedCoupon = null;
      updateTotal();
      return;
    }
  }

  if (subtotal < coupon.minOrder) {
    setCouponMessage(`Minimum order ${formatPrice(coupon.minOrder)} required for this coupon.`, "error");
    appliedCoupon = null;
    updateTotal();
    return;
  }

  appliedCoupon = coupon;
  updateTotal();

  const discount = getDiscountAmount(selectedDeliveryFee());
  setCouponMessage(`Coupon "${code}" applied successfully! You save ${formatPrice(discount)}.`, "success");

  if (applyCouponBtn) applyCouponBtn.style.display = "none";
  if (removeCouponBtn) removeCouponBtn.style.display = "inline-block";
}

function removeCoupon() {
  appliedCoupon = null;

  if (couponInput) couponInput.value = "";
  setCouponMessage("");

  if (applyCouponBtn) applyCouponBtn.style.display = "inline-block";
  if (removeCouponBtn) removeCouponBtn.style.display = "none";

  updateTotal();
}

if (applyCouponBtn) {
  applyCouponBtn.addEventListener("click", applyCoupon);
}

if (removeCouponBtn) {
  removeCouponBtn.addEventListener("click", removeCoupon);
}

if (couponInput) {
  couponInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyCoupon();
    }
  });
}

deliveryOptions.forEach(option => {
  option.addEventListener("change", updateTotal);
});

// ===================== FORM VALIDATION =====================

function showError(input, message) {
  const group = input.closest(".input-group");
  group.classList.add("error");
  group.querySelector(".error-message").textContent = message;
}

function clearError(input) {
  const group = input.closest(".input-group");
  group.classList.remove("error");

  const msg = group.querySelector(".error-message");
  if (msg) msg.textContent = "";
}

function focusError(input) {
  input.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  setTimeout(() => {
    input.focus();
  }, 500);
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

export function prefillCustomer(user, userData) {
  const fullName = document.getElementById("fullName");
  const phone = document.getElementById("phone");
  const email = document.getElementById("email");

  if (fullName && !fullName.value) fullName.value = userData.fullName || user.displayName || "";
  if (phone && !phone.value) phone.value = userData.phone || "";
  if (email && !email.value) email.value = userData.email || user.email || "";
}

// ===================== ORDER SAVE =====================

async function decrementStock(orderItems) {
  for (const item of orderItems) {
    try {
      const matchCandidates = [];

      if (item.id) {
        matchCandidates.push(doc(db, "products", item.id));
      }

      const productsQuery = query(collection(db, "products"), where("name", "==", item.name));
      const snap = await getDocs(productsQuery);
      if (!snap.empty) {
        snap.docs.forEach(docSnap => matchCandidates.push(docSnap.ref));
      }

      const uniqueRefs = [...new Map(matchCandidates.map(ref => [ref.path, ref])).values()];

      if (uniqueRefs.length === 0) {
        console.warn(`No product found matching "${item.name}", stock not updated.`);
        continue;
      }

      for (const productRef of uniqueRefs) {
        await runTransaction(db, async (transaction) => {
          const productSnap = await transaction.get(productRef);
          if (!productSnap.exists()) return;

          const currentStock = Number(productSnap.data().stock) || 0;
          const newStock = Math.max(0, currentStock - item.qty);
          transaction.update(productRef, { stock: newStock });
        });
      }
    } catch (err) {
      console.error(`Failed to update stock for "${item.name}":`, err);
    }
  }
}

async function saveOrderToFirestore(formValues) {
  const deliveryFee = selectedDeliveryFee();
  const discount = getDiscountAmount(deliveryFee);
  const grandTotal = Math.max(0, subtotal + deliveryFee - discount);
  const pointsEarned = Math.floor(grandTotal / 100);

  const isFreeShip = appliedCoupon
    && appliedCoupon.type === "freeShip"
    && subtotal >= appliedCoupon.minOrder;
  const finalDelivery = isFreeShip ? 0 : deliveryFee;

  const orderItems = cartItems.map(item => ({
    id: item.id || "",
    name: item.product,
    qty: Number(item.quantity) || 1,
    price: Number(item.price) || 0
  }));

  const orderData = {
    customerId: currentUser ? currentUser.uid : "",
    uid: currentUser ? currentUser.uid : "",
    customerType: currentUser ? "registered" : "guest",
    isGuest: !currentUser,
    fullName: formValues.fullName,
    phone: formValues.phone,
    email: formValues.email,
    address: formValues.address,
    notes: formValues.notes,
    items: orderItems,
    subtotal,
    deliveryFee: finalDelivery,
    deliveryType: getSelectedDeliveryLabel(),
    couponCode: appliedCoupon ? appliedCoupon.code : "",
    discountCode: appliedCoupon ? appliedCoupon.code : "",
    discountAmount: discount,
    grandTotal,
    pointsEarned,
    paymentMethod: "Cash On Delivery",
    status: "Pending",
    riderId: "",
    riderName: "",
    riderPhone: "",
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, "orders"), orderData);
  await decrementStock(orderItems);
  return { id: docRef.id, pointsEarned };
}

if (checkoutForm) {
  checkoutForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (cartItems.length === 0) {
      setCheckoutMessage("Your cart is empty. Add products before confirming.", "#c0392b");
      return;
    }

    const fullName = document.getElementById("fullName");
    const phone = document.getElementById("phone");
    const email = document.getElementById("email");
    const address = document.getElementById("address");

    let valid = true;
    let firstError = null;

    setCheckoutMessage("");

    [
      fullName,
      phone,
      email,
      address
    ].forEach(clearError);

    if (fullName.value.trim().length < 3) {
      showError(fullName, "Please enter your full name.");
      valid = false;
      firstError ??= fullName;
    }

    if (!isValidPhone(phone.value.trim())) {
      showError(phone, "Enter a valid Bangladeshi number.");
      valid = false;
      firstError ??= phone;
    }

    if (email.value.trim() && !isValidEmail(email.value.trim())) {
      showError(email, "Enter a valid email.");
      valid = false;
      firstError ??= email;
    }

    if (address.value.trim().length < 10) {
      showError(address, "Enter complete address.");
      valid = false;
      firstError ??= address;
    }

    if (!valid) {
      focusError(firstError);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Placing order...";
    setCheckoutMessage("Placing your order...");

    try {
      const result = await saveOrderToFirestore({
        fullName: fullName.value.trim(),
        phone: phone.value.trim(),
        email: email.value.trim(),
        address: address.value.trim(),
        notes: document.getElementById("notes")
          ? document.getElementById("notes").value.trim()
          : ""
      });

      setCheckoutMessage(`Your order is confirmed. You earned ${result.pointsEarned} points!`);

      localStorage.removeItem("cart");
      localStorage.removeItem("cartTotal");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1600);
    } catch (err) {
      console.error("Order save failed:", err);

      setCheckoutMessage("Something went wrong placing your order. Please try again.", "#c0392b");
      updateSubmitState();
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    currentUser = null;
    currentUserData = {};

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Redirecting to login...";
    }
    setCheckoutMessage("Please log in or sign up to check out. Redirecting...");

    setTimeout(() => {
      window.location.href = "login.html?redirect=checkout.html";
    }, 1500);
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

  currentUser = user;
  currentUserData = userData;
  prefillCustomer(user, currentUserData);
  updateSubmitState();
});

// Load admin-created coupons for everyone (guests included), then render.
loadCustomCoupons();
renderSummary();