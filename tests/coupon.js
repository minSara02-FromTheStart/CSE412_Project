

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


function mergeCoupons(builtIn, live) {
    return [...builtIn, ...live.map(mapLiveCoupon)];
}

function getCouponList() {
    return mergeCoupons(builtInCoupons, liveCoupons);
}


if (typeof module !== 'undefined' && module.exports) {
  module.exports = { couponSummary, mapLiveCoupon, getCouponList, builtInCoupons, copyCode, mergeCoupons };
}