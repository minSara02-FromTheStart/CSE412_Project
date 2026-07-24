import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loginBtn = document.getElementById("loginNavBtn");

function dashboardFor(role) {
    if (role === "Admin") return "admin.html";
    if (role === "Deliveryman") return "rider-dashboard.html";
    return "customer-dashboard.html";
}

function displayNameFrom(user, userData) {
    const name = userData.fullName || user.displayName || user.email || "Customer";
    return name.split(" ")[0] || "Customer";
}

onAuthStateChanged(auth, async (user) => {
    if (!loginBtn) return;

    if (!user) {
        loginBtn.textContent = "Buy Now";
        loginBtn.href = "login.html";
        loginBtn.removeAttribute("aria-label");
        return;
    }

    let userData = {};
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        userData = userDoc.exists() ? userDoc.data() : {};
    } catch (error) {
        console.warn("Could not load user status:", error);
    }

    const role = userData.role || "Customer";
    const name = displayNameFrom(user, userData);

    loginBtn.textContent = `Hi, ${name}`;
    loginBtn.href = dashboardFor(role);
    loginBtn.setAttribute("aria-label", `Open ${name}'s dashboard`);
});
