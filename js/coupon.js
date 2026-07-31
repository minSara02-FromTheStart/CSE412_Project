// =====================
// COUPON DATA — edit this list to add/change offers
// =====================
const couponList = [
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

// =====================
// COUPON PANEL LOGIC
// =====================
document.addEventListener("DOMContentLoaded", () => {
    const couponsLink = document.getElementById("couponsLink");
    const couponPanel = document.getElementById("couponPanel");
    const couponOverlay = document.getElementById("couponOverlay");
    const closeCouponBtn = document.getElementById("closeCouponBtn");
    const couponListEl = document.getElementById("couponList");

    function renderCoupons() {
        if (!couponListEl) return;

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

    if (closeCouponBtn) closeCouponBtn.addEventListener("click", closeCouponPanel);
    if (couponOverlay) couponOverlay.addEventListener("click", closeCouponPanel);

    renderCoupons();
});