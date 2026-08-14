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
  return [
    ...builtIn,
    ...live.map(mapLiveCoupon)
  ];
}


function mapLiveCoupon(c) {
  const badge = c.oneTimeOnly
    ? "One-Time Use"
    : (c.minOrder > 0 ? `Min Order ৳${c.minOrder}` : "Limited Time");

  return {
    code: c.code,
    badge,
    title: c.title || c.code,
    desc: [c.description, couponSummary(c)]
      .filter(Boolean)
      .join(" ")
  };
}


function couponSummary(c) {
  if (c.type === "freeShip") {
    return "Free shipping on this order.";
  }

  if (c.value) {
    return `Get ${c.value}% off.`;
  }

  return "";
}


if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    copyCode,
    mergeCoupons,
    mapLiveCoupon,
    couponSummary
  };
}