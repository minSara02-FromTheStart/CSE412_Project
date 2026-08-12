/* =============================================================
   loyaltyService.js  —  Loyalty & Coupon Management
   Handles custom coupon creation and AUTOMATIC reward assignment.

   Coupons are never hand-picked for a specific customer. Instead,
   this service ranks customers by their total spend and rewards
   the top spenders automatically, based on the rules the admin
   sets (how many to reward, and the minimum spend required).
   =============================================================  */

'use strict';

// Firestore reference will be injected from admin.html
let db = null;

function initLoyaltyService(firebaseDb) {
  db = firebaseDb;
  loadCustomCoupons();
  loadLoyaltyAssignments();
  setupLoyaltyEventListeners();
}

// Store custom coupons + past auto-assignments in globals
window.customCoupons = [];
window.loyaltyAssignments = [];

/* =============================================================
   LOAD & DISPLAY COUPONS
   ============================================================= */
async function loadCustomCoupons() {
  if (!db) return;

  try {
    const { collection, getDocs } = window._fb;
    const snapshot = await getDocs(collection(db, 'custom_coupons'));
    window.customCoupons = [];
    snapshot.forEach(doc => {
      window.customCoupons.push({ id: doc.id, ...doc.data() });
    });
    renderCustomCouponsList();
    updateAutoAssignCouponSelect();
    renderTopSpenders();
  } catch (err) {
    console.error('Error loading custom coupons:', err);
  }
}

function renderCustomCouponsList() {
  const tbody = document.getElementById('coupons-body');
  if (!tbody) return;

  if (!window.customCoupons || window.customCoupons.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">No custom coupons yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = window.customCoupons.map(coupon => `<tr>
    <td><strong>${sanitize(coupon.code)}</strong></td>
    <td>${sanitize(coupon.title || '—')}</td>
    <td>${coupon.type === 'percentage' ? coupon.value + '%' : coupon.type === 'freeShip' ? 'Free Shipping' : '—'}</td>
    <td>৳${coupon.minOrder || 0}</td>
    <td>${coupon.oneTimeOnly ? '✅' : '❌'}</td>
    <td>
      <button class="action-btn" onclick="editCustomCoupon('${coupon.id}')">✏️ Edit</button>
      <button class="action-btn danger" onclick="deleteCustomCoupon('${coupon.id}')">🗑 Delete</button>
    </td>
  </tr>`).join('');
}

function getAllCouponOptions() {
  const builtInCoupons = [
    { code: 'FIRST10', title: 'First Time (10% off)' },
    { code: 'SAVE15', title: 'Save 15%' },
    { code: 'FLASH20', title: 'Flash Sale (20% off)' },
    { code: 'FREESHIP', title: 'Free Shipping' }
  ];

  return [
    ...builtInCoupons,
    ...(window.customCoupons || []).map(c => ({ code: c.code, title: c.title }))
  ];
}

function updateAutoAssignCouponSelect() {
  const select = document.getElementById('autoAssignCouponSelect');
  if (!select) return;

  const previousValue = select.value;
  const all = getAllCouponOptions();

  select.innerHTML = `<option value="">-- Select a coupon --</option>` +
    all.map(c => `<option value="${sanitize(c.code)}">${sanitize(c.title || c.code)}</option>`).join('');

  if (previousValue && all.some(c => c.code === previousValue)) {
    select.value = previousValue;
  }
}

/* =============================================================
   CREATE / EDIT COUPON
   ============================================================= */
async function handleCreateCoupon() {
  const code = document.getElementById('newCouponCode').value.trim().toUpperCase();
  const title = document.getElementById('newCouponTitle').value.trim();
  const desc = document.getElementById('newCouponDesc').value.trim();
  const type = document.getElementById('newCouponType').value;
  const value = Number(document.getElementById('newCouponValue').value);
  const minOrder = Number(document.getElementById('newCouponMinOrder').value) || 0;
  const oneTime = document.getElementById('newCouponOneTime').checked;
  const editId = document.getElementById('couponEditId').value;
  const msgEl = document.getElementById('couponCreateMsg');

  msgEl.textContent = '';
  msgEl.className = 'settings-msg';

  // Validation
  if (!code) { msgEl.textContent = '⚠️ Coupon code is required.'; return; }
  if (code.length < 3) { msgEl.textContent = '⚠️ Coupon code must be at least 3 characters.'; return; }
  if (!title) { msgEl.textContent = '⚠️ Title is required.'; return; }
  if (type === 'percentage' && (value <= 0 || value > 100)) {
    msgEl.textContent = '⚠️ Discount percentage must be 1-100.'; return;
  }
  if (minOrder < 0) { msgEl.textContent = '⚠️ Min order must be 0 or greater.'; return; }

  // Check if code already exists (only if creating new coupon)
  if (!editId) {
    const exists = window.customCoupons.find(c => c.code === code) ||
                   ['FIRST10', 'SAVE15', 'FLASH20', 'FREESHIP'].includes(code);
    if (exists) { msgEl.textContent = '⚠️ This coupon code already exists.'; return; }
  }

  try {
    const { doc, updateDoc, collection, addDoc } = window._fb;
    const couponData = {
      code, title, description: desc, type, value, minOrder, oneTimeOnly: oneTime,
      updatedAt: new Date().toISOString()
    };

    if (editId) {
      // Update existing coupon
      await updateDoc(doc(db, 'custom_coupons', editId), couponData);
      const idx = window.customCoupons.findIndex(c => c.id === editId);
      if (idx > -1) {
        window.customCoupons[idx] = { id: editId, ...couponData };
      }
      msgEl.textContent = '✅ Coupon updated successfully!';
    } else {
      // Create new coupon
      const newCoupon = {
        ...couponData,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'custom_coupons'), newCoupon);
      window.customCoupons.push({ id: docRef.id, ...newCoupon });
      msgEl.textContent = '✅ Coupon created successfully!';
    }

    msgEl.className = 'settings-msg success';

    // Clear form
    document.getElementById('newCouponCode').value = '';
    document.getElementById('newCouponTitle').value = '';
    document.getElementById('newCouponDesc').value = '';
    document.getElementById('newCouponType').value = 'percentage';
    document.getElementById('newCouponValue').value = '';
    document.getElementById('newCouponMinOrder').value = '';
    document.getElementById('newCouponOneTime').checked = false;
    document.getElementById('couponEditId').value = '';

    // Reset button
    const createBtn = document.getElementById('createCouponBtn');
    if (createBtn) {
      createBtn.textContent = 'Create Coupon';
      createBtn.dataset.editing = 'false';
    }

    renderCustomCouponsList();
    updateAutoAssignCouponSelect();
    renderTopSpenders();
  } catch (err) {
    console.error(err);
    msgEl.textContent = '❌ Failed to save coupon: ' + (err.message || 'Unknown error');
    msgEl.className = 'settings-msg error';
  }
}

window.editCustomCoupon = function(id) {
  const coupon = window.customCoupons.find(c => c.id === id);
  if (!coupon) return;

  // Pre-fill form with coupon data
  document.getElementById('newCouponCode').value = coupon.code;
  document.getElementById('newCouponTitle').value = coupon.title || '';
  document.getElementById('newCouponDesc').value = coupon.description || '';
  document.getElementById('newCouponType').value = coupon.type || 'percentage';
  document.getElementById('newCouponValue').value = coupon.value || '';
  document.getElementById('newCouponMinOrder').value = coupon.minOrder || '';
  document.getElementById('newCouponOneTime').checked = coupon.oneTimeOnly || false;

  // Store edit ID and change button text
  const couponEditInput = document.getElementById('couponEditId');
  if (couponEditInput) couponEditInput.value = id;

  const createBtn = document.getElementById('createCouponBtn');
  if (createBtn) {
    createBtn.textContent = 'Save Changes';
    createBtn.dataset.editing = 'true';
  }

  // Scroll to form
  const settingsGrid = document.querySelector('.settings-grid');
  if (settingsGrid) settingsGrid.scrollIntoView({ behavior: 'smooth' });
};

window.deleteCustomCoupon = async function(id) {
  if (!confirm('Delete this custom coupon? This cannot be undone.')) return;

  try {
    const { doc, deleteDoc } = window._fb;
    await deleteDoc(doc(db, 'custom_coupons', id));
    window.customCoupons = window.customCoupons.filter(c => c.id !== id);
    renderCustomCouponsList();
    updateAutoAssignCouponSelect();
    renderTopSpenders();
    showToast('🗑 Coupon deleted.');
  } catch (err) {
    console.error(err);
    showToast('❌ Delete failed: ' + (err.message || 'Unknown error'));
  }
};

/* =============================================================
   SPEND CALCULATION
   Orders don't store a customer/user id, so we match each order
   back to a "Customer" role user by phone number first (more
   reliable), falling back to an exact full-name match.
   ============================================================= */
function normalizePhone(p) {
  return (p || '').toString().replace(/\D/g, '').slice(-11); // last 11 digits, BD-style
}

function normalizeName(n) {
  return (n || '').toString().trim().toLowerCase();
}

function computeCustomerSpending(orders, users, deliveredOnly) {
  const customers = (users || []).filter(u => (u.role || 'Customer') === 'Customer');

  const byPhone = new Map();
  const byName = new Map();
  customers.forEach(u => {
    const phoneKey = normalizePhone(u.phone);
    const nameKey = normalizeName(u.fullName);
    if (phoneKey) byPhone.set(phoneKey, u);
    if (nameKey) byName.set(nameKey, u);
  });

  const totals = new Map(); // userId -> { user, totalSpent, orderCount }

  (orders || []).forEach(o => {
    if (deliveredOnly && o.status !== 'Delivered') return;

    const orderPhone = normalizePhone(o.phone);
    const orderName = normalizeName(o.fullName || o.customerName);

    let matchedUser = null;
    if (orderPhone && byPhone.has(orderPhone)) matchedUser = byPhone.get(orderPhone);
    else if (orderName && byName.has(orderName)) matchedUser = byName.get(orderName);

    if (!matchedUser) return; // no linked customer account — can't attribute spend

    const amount = Number(o.grandTotal || o.total || 0);
    const entry = totals.get(matchedUser.id) || { user: matchedUser, totalSpent: 0, orderCount: 0 };
    entry.totalSpent += amount;
    entry.orderCount += 1;
    totals.set(matchedUser.id, entry);
  });

  return [...totals.values()].sort((a, b) => b.totalSpent - a.totalSpent);
}

/* =============================================================
   TOP SPENDERS TABLE
   ============================================================= */
function renderTopSpenders() {
  const tbody = document.getElementById('topSpenders-body');
  if (!tbody) return;
  if (!window.adminData) return;

  const deliveredOnly = document.getElementById('autoAssignDeliveredOnly')?.checked ?? true;
  const topCount = Math.max(1, Number(document.getElementById('autoAssignTopCount')?.value) || 10);
  const minSpend = Math.max(0, Number(document.getElementById('autoAssignMinSpend')?.value) || 0);
  const selectedCoupon = document.getElementById('autoAssignCouponSelect')?.value || '';

  const ranked = computeCustomerSpending(window.adminData.orders, window.adminData.users, deliveredOnly);

  if (!ranked.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">No spending data yet.</td></tr>`;
    return;
  }

  const eligibleIds = new Set(
    ranked.filter(r => r.totalSpent >= minSpend).slice(0, topCount).map(r => r.user.id)
  );

  tbody.innerHTML = ranked.map((r, i) => {
    const rank = i + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : '';
    const alreadyRewarded = selectedCoupon && (window.loyaltyAssignments || []).some(
      a => a.customerId === r.user.id && a.couponCode === selectedCoupon
    );

    let statusHtml;
    if (!selectedCoupon) {
      statusHtml = `<span class="pill pill-none">Select a coupon</span>`;
    } else if (alreadyRewarded) {
      statusHtml = `<span class="pill pill-rewarded">✅ Already rewarded</span>`;
    } else if (eligibleIds.has(r.user.id)) {
      statusHtml = `<span class="pill pill-eligible">🎯 Eligible now</span>`;
    } else {
      statusHtml = `<span class="pill pill-none">—</span>`;
    }

    return `<tr>
      <td><span class="rank-badge ${rankClass}">${rank}</span></td>
      <td>${sanitize(r.user.fullName || '—')}</td>
      <td>${sanitize(r.user.email || '—')}</td>
      <td>${r.orderCount}</td>
      <td>${fmtCurrency(r.totalSpent)}</td>
      <td>${statusHtml}</td>
    </tr>`;
  }).join('');
}

/* =============================================================
   AUTO-ASSIGN COUPON TO TOP SPENDERS
   ============================================================= */
async function loadLoyaltyAssignments() {
  if (!db) return;
  try {
    const { collection, getDocs } = window._fb;
    const snapshot = await getDocs(collection(db, 'loyalty_assignments'));
    window.loyaltyAssignments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAssignmentsList();
    renderTopSpenders();
  } catch (err) {
    console.error('Error loading loyalty assignments:', err);
  }
}

function renderAssignmentsList() {
  const tbody = document.getElementById('assignments-body');
  if (!tbody) return;

  const list = [...(window.loyaltyAssignments || [])]
    .sort((a, b) => new Date(b.assignedAt || 0) - new Date(a.assignedAt || 0))
    .slice(0, 25);

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-cell">No coupons have been auto-assigned yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(a => `<tr>
    <td>${sanitize(a.customerName || '—')}</td>
    <td>${sanitize(a.customerEmail || '—')}</td>
    <td><strong>${sanitize(a.couponCode)}</strong></td>
    <td>${fmtCurrency(a.totalSpent || 0)}</td>
    <td>${fmtDate(a.assignedAt)}</td>
    <td>${a.seenAt ? '👀 Seen' : '⏳ Not seen'}</td>
    <td>${a.usedAt ? '✅ Used' : '—'}</td>
  </tr>`).join('');
}

async function handleAutoAssign() {
  const msgEl = document.getElementById('couponAssignMsg');
  msgEl.textContent = '';
  msgEl.className = 'settings-msg';

  const couponCode = document.getElementById('autoAssignCouponSelect').value.trim();
  const topCount = Math.max(1, Number(document.getElementById('autoAssignTopCount').value) || 10);
  const minSpend = Math.max(0, Number(document.getElementById('autoAssignMinSpend').value) || 0);
  const deliveredOnly = document.getElementById('autoAssignDeliveredOnly').checked;

  if (!couponCode) { msgEl.textContent = '⚠️ Please select a coupon.'; return; }
  if (!window.adminData) { msgEl.textContent = '⚠️ Store data is still loading, try again shortly.'; return; }

  const btn = document.getElementById('autoAssignBtn');
  btn.disabled = true;
  const originalLabel = btn.textContent;
  btn.textContent = 'Assigning...';

  try {
    const { collection, addDoc } = window._fb;

    const ranked = computeCustomerSpending(window.adminData.orders, window.adminData.users, deliveredOnly);
    const eligible = ranked.filter(r => r.totalSpent >= minSpend).slice(0, topCount);

    if (!eligible.length) {
      msgEl.textContent = '⚠️ No customers currently meet these criteria.';
      msgEl.className = 'settings-msg error';
      return;
    }

    const alreadyRewardedIds = new Set(
      (window.loyaltyAssignments || [])
        .filter(a => a.couponCode === couponCode)
        .map(a => a.customerId)
    );

    const toReward = eligible.filter(r => !alreadyRewardedIds.has(r.user.id));

    if (!toReward.length) {
      msgEl.textContent = 'ℹ️ All eligible top spenders already have this coupon.';
      msgEl.className = 'settings-msg';
      return;
    }

    for (const r of toReward) {
      const assignment = {
        customerId: r.user.id,
        customerEmail: r.user.email || '',
        customerName: r.user.fullName || 'Customer',
        couponCode,
        reason: 'top_spender',
        totalSpent: r.totalSpent,
        orderCount: r.orderCount,
        auto: true,
        assignedAt: new Date().toISOString(),
        usedAt: null,
        seenAt: null
      };
      const docRef = await addDoc(collection(db, 'loyalty_assignments'), assignment);
      window.loyaltyAssignments.push({ id: docRef.id, ...assignment });
    }

    renderAssignmentsList();
    renderTopSpenders();

    const skipped = eligible.length - toReward.length;
    msgEl.textContent = `✅ Rewarded ${toReward.length} top spender(s) with "${couponCode}".` +
      (skipped ? ` (${skipped} already had it.)` : '');
    msgEl.className = 'settings-msg success';
  } catch (err) {
    console.error(err);
    msgEl.textContent = '❌ Auto-assignment failed: ' + (err.message || 'Unknown error');
    msgEl.className = 'settings-msg error';
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

/* =============================================================
   EVENT LISTENERS
   ============================================================= */
function setupLoyaltyEventListeners() {
  const createBtn = document.getElementById('createCouponBtn');
  const autoAssignBtn = document.getElementById('autoAssignBtn');

  if (createBtn) {
    createBtn.addEventListener('click', handleCreateCoupon);
  }

  if (autoAssignBtn) {
    autoAssignBtn.addEventListener('click', handleAutoAssign);
  }

  // Live-update the "who's eligible right now" preview as the admin
  // tweaks the coupon / count / threshold, without needing to save anything.
  ['autoAssignCouponSelect', 'autoAssignTopCount', 'autoAssignMinSpend', 'autoAssignDeliveredOnly']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', renderTopSpenders);
    });
}

// Called by admin.js's window.renderAll() whenever live order/user data
// changes, so the Top Spenders ranking always reflects the latest data.
window.renderTopSpenders = renderTopSpenders;

// Initialize when loyalty page is loaded
window.initLoyaltyService = initLoyaltyService;