// =====================
// COUPON DATA
// =====================
// Built-in coupons are always available — these are NOT admin
// managed, they're the store's standing offers.
const builtInCoupons = [
    {
        code: "FIRST10",
        badge: "New Customer",
        title: "10% Off First Purchase",
        desc: "Get 10% off on all products when you shop with us for the first time. Apply this code at checkout."
    },
    {
        code: "SAVE15",
        badge: "Min Order ৳2000",
        title: "15% Off on Orders Above ৳2000",
        desc: "Spend ৳2000 or more on any product and get a flat 15% discount using this code."
    },
    {
        code: "FLASH20",
        badge: "Limited Time",
        title: "20% Off Flash Sale Items",
        desc: "Use this code on any item listed under Flash Sales to enjoy an extra 20% discount."
    },
    {
        code: "FREESHIP",
        badge: "Delivery",
        title: "Free Delivery on Orders Above ৳1000",
        desc: "Skip the delivery charge entirely when your order total crosses ৳1000."
    }
];

// Admin-created coupons — loaded live from Firestore below, so this
// page always matches whatever's on the "Loyalty & Coupons" admin page.
let liveCoupons = [];

function couponSummary(c) {
    if (c.type === 'freeShip') return 'Free shipping on this order.';
    if (c.value) return `Get ${c.value}% off.`;
    return '';
}

function mapLiveCoupon(c) {
    const badge = c.oneTimeOnly
        ? 'One-Time Use'
        : (c.minOrder > 0 ? `Min Order ৳${c.minOrder}` : 'Limited Time');
    return {
        code: c.code,
        badge,
        title: c.title || c.code,
        desc: [c.description, couponSummary(c)].filter(Boolean).join(' ')
    };
}

function getCouponList() {
    return [...builtInCoupons, ...liveCoupons.map(mapLiveCoupon)];
}

// =====================
// COUPON PANEL LOGIC
// =====================
document.addEventListener("DOMContentLoaded", () => {
    const couponsLink = document.getElementById("couponsLink");
    const couponPanel = document.getElementById("couponPanel");
    const couponOverlay = document.getElementById("couponOverlay");
    const closeCouponBtn = document.getElementById("closeCouponBtn");
    const couponListEl = document.getElementById("couponList");
    const cartBtn = document.getElementById("open-cart-btn");

    function renderCoupons() {
        if (!couponListEl) return;

        const couponList = getCouponList();

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

        couponListEl.querySelectorAll(".coupon-copy-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const coupon = couponList[Number(btn.dataset.index)];
                copyCode(coupon.code, btn);
            });
        });
    }

    function copyCode(code, btn) {
        navigator.clipboard.writeText(code).then(() => {
            const original = btn.textContent;
            btn.textContent = "Copied!";
            btn.classList.add("copied");
            setTimeout(() => {
                btn.textContent = original;
                btn.classList.remove("copied");
            }, 1500);
        }).catch(() => {
            alert("Coupon code: " + code);
        });
    }

    function openCouponPanel() {
        if (!couponPanel) return;
        couponPanel.classList.add("active");
        if (couponOverlay) couponOverlay.classList.add("active");
        if (cartBtn) cartBtn.style.display = "none";
    }

    function closeCouponPanel() {
        if (!couponPanel) return;
        couponPanel.classList.remove("active");
        if (couponOverlay) couponOverlay.classList.remove("active");
        if (cartBtn) cartBtn.style.display = "";
    }

    if (couponsLink) {
        couponsLink.addEventListener("click", (e) => {
            e.preventDefault();
            openCouponPanel();
        });
    }

    if (closeCouponBtn) closeCouponBtn.addEventListener("click", closeCouponPanel);
    if (couponOverlay) couponOverlay.addEventListener("click", closeCouponPanel);

    // Render immediately with built-ins, then again once Firestore's
    // admin-created coupons arrive (and any time they change live).
    renderCoupons();

    import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js").then(({ initializeApp, getApps }) => {
        import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js").then(({ getFirestore, collection, onSnapshot }) => {
            const firebaseConfig = {
                apiKey: "AIzaSyAJOWu8ZYEyUms8nF1uVBw2m9v4ApNaT4s",
                authDomain: "nutrinest-408d4.firebaseapp.com",
                projectId: "nutrinest-408d4",
                storageBucket: "nutrinest-408d4.firebasestorage.app",
                messagingSenderId: "44196278510",
                appId: "1:44196278510:web:11acb64840e2d536c843ff"
            };
            const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
            const db = getFirestore(app);

            onSnapshot(collection(db, 'custom_coupons'), (snap) => {
                liveCoupons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                renderCoupons();
            }, (err) => console.error('Live coupon listener error:', err));
        });
    });
});

// Export for unit testing (Node/CommonJS only — harmless in the browser,
// since `module` doesn't exist there and this block is skipped).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { couponSummary, mapLiveCoupon, getCouponList, builtInCoupons };
}