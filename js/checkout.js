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

const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
let subtotal = Number(localStorage.getItem("cartTotal")) || 0;
let currentUser = null;
let currentUserData = {};

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

function selectedDeliveryFee() {
  const selected = document.querySelector("input[name='delivery']:checked");
  return selected ? Number(selected.value) : 0;
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
  const total = subtotal + deliveryFee;

  if (subtotalText) subtotalText.textContent = formatPrice(subtotal);
  if (deliveryText) deliveryText.textContent = deliveryFee === 0 ? "Free" : formatPrice(deliveryFee);
  if (grandTotalText) grandTotalText.textContent = formatPrice(total);
}

deliveryOptions.forEach(option => {
  option.addEventListener("change", updateTotal);
});

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
  return /^01[3-9]\d{8}$/.test(phone);
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

async function decrementStock(orderItems) {
  for (const item of orderItems) {
    try {
      const productsQuery = query(collection(db, "products"), where("name", "==", item.name));
      const snap = await getDocs(productsQuery);

      if (snap.empty) {
        console.warn(`No product found matching "${item.name}", stock not updated.`);
        continue;
      }

      const productRef = snap.docs[0].ref;

      // Transaction avoids two simultaneous orders both reading the same
      // "old" stock number and overwriting each other's update.
      await runTransaction(db, async (transaction) => {
        const productSnap = await transaction.get(productRef);
        if (!productSnap.exists()) return;

        const currentStock = Number(productSnap.data().stock) || 0;
        const newStock = Math.max(0, currentStock - item.qty);
        transaction.update(productRef, { stock: newStock });
      });
    } catch (err) {
      console.error(`Failed to update stock for "${item.name}":`, err);
    }
  }
}

async function saveOrderToFirestore(formValues) {
  const deliveryFee = selectedDeliveryFee();
  const grandTotal = subtotal + deliveryFee;
  const pointsEarned = currentUser ? Math.floor(grandTotal / 100) : 0;

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
    deliveryFee,
    deliveryType: getSelectedDeliveryLabel(),
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

      setCheckoutMessage(currentUser
        ? `Your order is confirmed. You earned ${result.pointsEarned} points!`
        : "Your order is confirmed. Thank you for shopping with NutriNest!");

      localStorage.removeItem("cart");
      localStorage.removeItem("cartTotal");

      setTimeout(() => {
        window.location.href = currentUser ? "customer-dashboard.html" : "index.html";
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
    updateSubmitState();
    setCheckoutMessage("Checking out as a guest. Fill in your delivery details to place the order.");
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

renderSummary();
