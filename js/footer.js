/* ============================================================
   footer.js  —  NutriNest footer
   ✅ AUTO-INJECTS footer.html into any page that loads this file
   Just add these 2 lines to any HTML and footer appears:
     <link rel="stylesheet" href="css/footer.css">
     <script src="js/footer.js" defer></script>
   ============================================================ */

/* ── AUTO INJECT footer.html ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // Create a placeholder div at bottom of body
  const footerMount = document.createElement('div');
  footerMount.id = 'footer-mount';
  document.body.appendChild(footerMount);

  // Fetch footer.html and inject its content
  fetch('footer.html')
    .then(res => {
      if (!res.ok) throw new Error('footer.html not found');
      return res.text();
    })
    .then(html => {
      footerMount.innerHTML = html;
      initFooter(); // run footer logic after HTML is ready
    })
    .catch(err => {
      console.warn('NutriNest footer could not load:', err.message);
    });
});

/* ── INIT (called after footer HTML is injected) ─────────── */
function initFooter() {

  // Auto set current year
  const yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Back to top — show after scrolling 400px
  const btn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (!btn) return;
    btn.classList.toggle('visible', window.scrollY > 400);
  });
}

/* ── BACK TO TOP ──────────────────────────────────────────── */
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── NEWSLETTER FORM ──────────────────────────────────────── */
function handleNewsletter(e) {
  e.preventDefault();
  const input = document.getElementById('newsletterEmail');
  const btn   = e.target.querySelector('button[type="submit"]');
  const email = input.value.trim();

  if (!email) return;

  btn.textContent = 'Subscribing...';
  btn.disabled = true;

  // Simulate API — replace with Firebase later
  setTimeout(() => {
    btn.textContent = '✅ Subscribed!';
    btn.style.background = '#27ae60';
    input.value = '';

    // Save to localStorage for now
    const subs = JSON.parse(localStorage.getItem('nn_subscribers') || '[]');
    if (!subs.includes(email)) {
      subs.push(email);
      localStorage.setItem('nn_subscribers', JSON.stringify(subs));
    }

    setTimeout(() => {
      btn.textContent = 'Subscribe';
      btn.style.background = '';
      btn.disabled = false;
    }, 3000);
  }, 1000);
}

/* ── FIREBASE INTEGRATION (when ready) ───────────────────── */
// Replace the setTimeout block above with:
//
// import { db } from './firebase-config.js';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// await addDoc(collection(db, 'subscribers'), {
//   email, subscribedAt: serverTimestamp()
// });