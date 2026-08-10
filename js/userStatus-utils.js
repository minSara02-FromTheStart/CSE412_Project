export function dashboardFor(role) {
    if (role === "Admin") return "admin.html";
    if (role === "Deliveryman") return "rider-dashboard.html";
    return "customer-dashboard.html";
}

export function displayNameFrom(user = {}, userData = {}) {
    const rawName = userData?.fullName || user?.displayName || user?.name || user?.email || "Customer";
    const emailLocalPart = user?.email ? user.email.split("@")[0] : "";
    const nameSource = rawName && rawName.includes("@") ? emailLocalPart : rawName;
    const name = (nameSource || emailLocalPart || "Customer").toString();
    const firstPart = name.split(" ")[0] || "Customer";
    return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { dashboardFor, displayNameFrom };
}
