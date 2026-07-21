// =====================
// COUPON DATA
// (In a real backend, this list would come from your database/API)
// =====================
const couponList = [
    {
        code: "FIRST10",
        badge: "New Customer",
        title: "10% Off First Purchase",
        desc: "Get 10% off on all products when you shop with us for the first time. Apply the code at checkout."
    },
    {
        code: "SAVE20",
        badge: "Big Spender",
        title: "20% Off on Orders Above ৳2000",
        desc: "Spend ৳2000 or more on any product and get a flat 20% discount using this code."
    },
    {
        code: "FLASH15",
        badge: "Limited Time",
        title: "15% Off Flash Sale Items",
        desc: "Use this code on any item listed under Flash Sales to enjoy an extra 15% discount."
    },
    {
        code: "FREESHIP",
        badge: "Delivery",
        title: "Free Delivery on Orders Above ৳1000",
        desc: "Skip the delivery charge entirely when your order total crosses ৳1000."
    }
];

// =====================
// ELEMENT REFERENCES
// =====================
const couponsLink = document.getElementById("couponsLink");
const couponPanel = document.getElementById("couponPanel");
const couponOverlay = document.getElementById("couponOverlay");
const closeCouponBtn = document.getElementById("closeCouponBtn");
const couponListEl = document.getElementById("couponList");

// =====================
// RENDER COUPONS
// =====================
function renderCoupons() {
    if (!couponListEl) return;

    if (couponList.length === 0) {
        couponListEl.innerHTML = `<p class="coupon-empty">No coupons available right now.</p>`;
        return;
    }

    couponListEl.innerHTML = couponList.map((coupon, index) => `
        <div class="coupon-card">
            <span class="coupon-badge">${coupon.badge}</span>
            <div class="coupon-title">${coupon.title}</div>
            <p class="coupon-desc">${coupon.desc}</p>
            <div class="coupon-code-row">
                <span class="coupon-code">${coupon.code}</span>
                <button class="coupon-copy-btn" data-index="${index}">Copy</button>
            </div>
        </div>
    `).join("");

    // Attach copy handlers after rendering
    couponListEl.querySelectorAll(".coupon-copy-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const coupon = couponList[Number(btn.dataset.index)];
            copyCode(coupon.code, btn);
        });
    });
}

// =====================
// COPY CODE TO CLIPBOARD
// =====================
function copyCode(code, btn) {
    navigator.clipboard.writeText(code).then(() => {
        const originalText = btn.textContent;
        btn.textContent = "Copied!";
        btn.classList.add("copied");

        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove("copied");
        }, 1500);
    }).catch(() => {
        alert(`Coupon code: ${code}`);
    });
}

// =====================
// OPEN / CLOSE PANEL
// =====================
function openCouponPanel() {
    if (!couponPanel) return;
    couponPanel.classList.add("active");
    if (couponOverlay) couponOverlay.classList.add("active");
}

function closeCouponPanel() {
    if (!couponPanel) return;
    couponPanel.classList.remove("active");
    if (couponOverlay) couponOverlay.classList.remove("active");
}

if (couponsLink) {
    couponsLink.addEventListener("click", (e) => {
        e.preventDefault();
        openCouponPanel();
    });
}

if (closeCouponBtn) {
    closeCouponBtn.addEventListener("click", closeCouponPanel);
}

if (couponOverlay) {
    couponOverlay.addEventListener("click", closeCouponPanel);
}

// =====================
// START
// =====================
renderCoupons();

// =====================
// CHECKOUT.JS - WITH COUPON SUPPORT
// =====================

const checkoutForm = document.getElementById("checkoutForm");
const summaryItems = document.getElementById("summary-items");
const subtotalText = document.getElementById("subtotal");
const deliveryText = document.getElementById("delivery");
const grandTotalText = document.getElementById("grandTotal");
const checkoutMessage = document.getElementById("checkoutMessage");
const deliveryOptions = document.querySelectorAll("input[name='delivery']");

// Coupon elements
const couponInput = document.getElementById("couponCode");
const applyCouponBtn = document.getElementById("applyCouponBtn");
const couponMessage = document.getElementById("couponMessage");
const discountRow = document.getElementById("discountRow");
const discountAmountText = document.getElementById("discountAmount");

// =====================
// COUPON DATA
// =====================
const AVAILABLE_COUPONS = [
    {
        code: "FIRST10",
        badge: "New Customer",
        title: "10% Off First Purchase",
        discount: 10,
        minOrder: 0,
        type: "percentage"
    },
    {
        code: "SAVE20",
        badge: "Big Spender",
        title: "20% Off on Orders Above ৳2000",
        discount: 20,
        minOrder: 2000,
        type: "percentage"
    },
    {
        code: "FLASH15",
        badge: "Limited Time",
        title: "15% Off Flash Sale Items",
        discount: 15,
        minOrder: 0,
        type: "percentage"
    },
    {
        code: "FREESHIP",
        badge: "Delivery",
        title: "Free Delivery on Orders Above ৳1000",
        discount: 0,
        minOrder: 1000,
        type: "freeship"
    }
];

// =====================
// STATE
// =====================
const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
let subtotal = Number(localStorage.getItem("cartTotal")) || 0;
let appliedCoupon = null;
let discountAmount = 0;
let deliveryFee = 120;

// =====================
// FORMAT FUNCTIONS
// =====================
function formatPrice(amount) {
    return "৳" + Number(amount).toFixed(0);
}

// =====================
// RENDER SUMMARY
// =====================
function renderSummary() {
    summaryItems.innerHTML = "";

    if (cartItems.length === 0) {
        summaryItems.innerHTML = `
            <p class="empty-summary">No items found in your cart.</p>
        `;
    } else {
        cartItems.forEach(item => {
            let quantity = item.quantity || 1;
            let itemTotal = Number(item.price) * quantity;

            summaryItems.innerHTML += `
                <div class="summary-item">
                    <span>${item.product} × ${quantity}</span>
                    <strong>${formatPrice(itemTotal)}</strong>
                </div>
            `;
        });
    }

    updateTotal();
}

// =====================
// UPDATE TOTAL
// =====================
function updateTotal() {
    let selected = document.querySelector("input[name='delivery']:checked");
    let delivery = Number(selected ? selected.value : 120);
    deliveryFee = delivery;

    // Calculate discount
    discountAmount = 0;
    let totalBeforeDiscount = subtotal + delivery;

    if (appliedCoupon) {
        if (appliedCoupon.type === "percentage") {
            discountAmount = (subtotal * appliedCoupon.discount) / 100;
        } else if (appliedCoupon.type === "freeship") {
            discountAmount = delivery;
        }
    }

    // Ensure discount doesn't exceed total
    if (discountAmount > totalBeforeDiscount) {
        discountAmount = totalBeforeDiscount;
    }

    let finalTotal = totalBeforeDiscount - discountAmount;

    // Update subtotal
    subtotalText.textContent = formatPrice(subtotal);
    
    // Update delivery
    if (appliedCoupon && appliedCoupon.type === "freeship" && subtotal >= appliedCoupon.minOrder) {
        deliveryText.textContent = "Free (Coupon)";
    } else {
        deliveryText.textContent = delivery === 0 ? "Free" : formatPrice(delivery);
    }

    // Update discount row
    if (discountAmount > 0) {
        discountRow.style.display = "flex";
        discountAmountText.textContent = "-" + formatPrice(discountAmount);
    } else {
        discountRow.style.display = "none";
    }

    // Update grand total
    grandTotalText.textContent = formatPrice(finalTotal);
}

// =====================
// COUPON FUNCTIONS
// =====================
function findCoupon(code) {
    return AVAILABLE_COUPONS.find(c => c.code.toUpperCase() === code.toUpperCase());
}

function applyCoupon(code) {
    const coupon = findCoupon(code);
    
    if (!coupon) {
        showCouponMessage("❌ Invalid coupon code. Please check and try again.", "error");
        return false;
    }

    if (coupon.minOrder > 0 && subtotal < coupon.minOrder) {
        showCouponMessage(
            `❌ This coupon requires a minimum order of ${formatPrice(coupon.minOrder)}. Current subtotal: ${formatPrice(subtotal)}.`, 
            "error"
        );
        return false;
    }

    if (appliedCoupon && appliedCoupon.code === coupon.code) {
        showCouponMessage("ℹ️ This coupon is already applied.", "info");
        return false;
    }

    appliedCoupon = coupon;
    showCouponMessage(`✅ Coupon "${coupon.code}" applied successfully!`, "success");
    showAppliedCouponBadge(coupon);
    updateTotal();
    updateCheckoutButton();
    
    // Save to localStorage
    localStorage.setItem("appliedCoupon", JSON.stringify(coupon));
    
    return true;
}

function removeCoupon() {
    appliedCoupon = null;
    discountAmount = 0;
    couponInput.value = "";
    couponMessage.textContent = "";
    couponMessage.className = "coupon-message";
    
    // Remove badge
    const badge = document.querySelector(".applied-coupon");
    if (badge) badge.remove();
    
    // Remove from localStorage
    localStorage.removeItem("appliedCoupon");
    
    updateTotal();
    updateCheckoutButton();
    
    if (applyCouponBtn) applyCouponBtn.disabled = false;
}

function showCouponMessage(message, type) {
    couponMessage.textContent = message;
    couponMessage.className = "coupon-message " + type;
}

function showAppliedCouponBadge(coupon) {
    // Remove existing badge
    const oldBadge = document.querySelector(".applied-coupon");
    if (oldBadge) oldBadge.remove();

    // Create new badge
    const badge = document.createElement("div");
    badge.className = "applied-coupon";
    badge.innerHTML = `
        🏷️ ${coupon.code} - ${coupon.discount}% OFF
        <button class="remove-coupon" title="Remove coupon">✕</button>
    `;
    
    // Insert after coupon input group
    const inputGroup = couponInput.closest(".input-group");
    inputGroup.appendChild(badge);
    
    // Add remove handler
    badge.querySelector(".remove-coupon").addEventListener("click", removeCoupon);
}

// =====================
// UPDATE CHECKOUT BUTTON
// =====================
function updateCheckoutButton() {
    const checkoutBtn = document.querySelector(".place-order");
    if (!checkoutBtn) return;
    
    const cartIsEmpty = cartItems.length === 0;
    checkoutBtn.disabled = cartIsEmpty;
    
    if (cartIsEmpty) {
        checkoutBtn.textContent = "Cart is empty";
    } else {
        checkoutBtn.textContent = "Confirm Order";
    }
}

// =====================
// SHOW/HIDE ERROR
// =====================
function showError(input, message) {
    let group = input.closest(".input-group");
    group.classList.add("error");
    group.querySelector(".error-message").textContent = message;
}

function clearError(input) {
    let group = input.closest(".input-group");
    group.classList.remove("error");
    let msg = group.querySelector(".error-message");
    if (msg) msg.textContent = "";
}

function focusError(input) {
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => { input.focus(); }, 500);
}

// =====================
// VALIDATION
// =====================
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^01[3-9]\d{8}$/.test(phone);
}

// =====================
// EVENT LISTENERS
// =====================

// Delivery options
deliveryOptions.forEach(option => {
    option.addEventListener("change", updateTotal);
});

// Apply coupon button
if (applyCouponBtn) {
    applyCouponBtn.addEventListener("click", function(e) {
        e.preventDefault();
        const code = couponInput.value.trim();
        if (!code) {
            showCouponMessage("❌ Please enter a coupon code.", "error");
            return;
        }
        applyCoupon(code);
    });
}

// Enter key on coupon input
if (couponInput) {
    couponInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            applyCouponBtn.click();
        }
    });
}

// =====================
// FORM SUBMISSION
// =====================
checkoutForm.addEventListener("submit", function(e) {
    e.preventDefault();

    let fullName = document.getElementById("fullName");
    let phone = document.getElementById("phone");
    let email = document.getElementById("email");
    let address = document.getElementById("address");

    let valid = true;
    let firstError = null;

    checkoutMessage.textContent = "";

    [fullName, phone, email, address].forEach(clearError);

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

    if (!isValidEmail(email.value.trim())) {
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

    // Build order summary message
    let discountMsg = "";
    if (appliedCoupon) {
        discountMsg = `\nCoupon Applied: ${appliedCoupon.code} (${appliedCoupon.discount}% OFF)`;
    }

    checkoutMessage.textContent = "✅ Your order has been confirmed successfully!";
    checkoutMessage.style.color = "#27ae60";

    console.log("=== ORDER CONFIRMED ===");
    console.log("Items:", cartItems);
    console.log("Subtotal:", subtotal);
    console.log("Delivery Fee:", deliveryFee);
    console.log("Discount:", discountAmount);
    console.log("Total:", subtotal + deliveryFee - discountAmount);
    if (appliedCoupon) {
        console.log("Coupon:", appliedCoupon);
    }
    console.log("=======================");

    // Clear cart
    localStorage.removeItem("cart");
    localStorage.removeItem("cartTotal");
    localStorage.removeItem("appliedCoupon");

    setTimeout(() => {
        window.location.href = "index.html";
    }, 2000);
});

// =====================
// INITIALIZE
// =====================
renderSummary();
updateCheckoutButton();

// Check for saved coupon
const savedCoupon = localStorage.getItem("appliedCoupon");
if (savedCoupon) {
    try {
        const coupon = JSON.parse(savedCoupon);
        if (coupon && coupon.code) {
            applyCoupon(coupon.code);
        }
    } catch (e) {
        // Ignore
    }
}