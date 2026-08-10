import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { dashboardFor, displayNameFrom } from "./userStatus-utils.js";

const loginBtn = document.getElementById("loginNavBtn");

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
