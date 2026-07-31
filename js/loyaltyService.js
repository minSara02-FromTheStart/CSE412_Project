/* =============================================================
   loyaltyService.js  —  Loyalty & Coupon Management
   Handles custom coupon creation, assignment, and retrieval.
   =============================================================  */

'use strict';

// Firestore reference will be injected from admin.html
let db = null;

function initLoyaltyService(firebaseDb) {
  db = firebaseDb;
  loadCustomCoupons();
  setupLoyaltyEventListeners();
}

// Store custom coupons in a global
window.customCoupons = [];

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
    updateLoyaltyCouponSelect();
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

function updateLoyaltyCouponSelect() {
  const select = document.getElementById('loyaltyCouponSelect');
  if (!select) return;
  
  const builtInCoupons = [
    { code: 'FIRST10', title: 'First Time (10% off)' },
    { code: 'SAVE15', title: 'Save 15%' },
    { code: 'FLASH20', title: 'Flash Sale (20% off)' },
    { code: 'FREESHIP', title: 'Free Shipping' }
  ];
  
  const all = [
    ...builtInCoupons,
    ...(window.customCoupons || []).map(c => ({ code: c.code, title: c.title }))
  ];
  
  select.innerHTML = `<option value="">-- Select a coupon --</option>` +
    all.map(c => `<option value="${sanitize(c.code)}">${sanitize(c.title || c.code)}</option>`).join('');
}

/* =============================================================
   CREATE COUPON
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
    updateLoyaltyCouponSelect();
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
    updateLoyaltyCouponSelect();
    showToast('🗑 Coupon deleted.');
  } catch (err) {
    console.error(err);
    showToast('❌ Delete failed: ' + (err.message || 'Unknown error'));
  }
};

/* =============================================================
   ASSIGN COUPON TO CUSTOMER
   ============================================================= */
async function handleAssignCoupon() {
  const email = document.getElementById('loyaltyCustomerEmail').value.trim().toLowerCase();
  const couponCode = document.getElementById('loyaltyCouponSelect').value.trim();
  const reason = document.getElementById('loyaltyReasonSelect').value;
  const msgEl = document.getElementById('couponAssignMsg');
  
  msgEl.textContent = '';
  msgEl.className = 'settings-msg';
  
  if (!email) { msgEl.textContent = '⚠️ Customer email is required.'; return; }
  if (!couponCode) { msgEl.textContent = '⚠️ Please select a coupon.'; return; }
  
  try {
    const { collection, query, where, getDocs, addDoc } = window._fb;
    
    // Find customer by email
    const userSnap = await getDocs(query(
      collection(db, 'users'),
      where('email', '==', email)
    ));
    
    if (userSnap.empty) {
      msgEl.textContent = '⚠️ No customer found with this email.';
      return;
    }
    
    const customerId = userSnap.docs[0].id;
    const customerName = userSnap.docs[0].data().fullName || 'Customer';
    
    // Create assignment record in loyalty_assignments collection
    const assignment = {
      customerId,
      customerEmail: email,
      customerName,
      couponCode,
      reason,
      assignedAt: new Date().toISOString(),
      usedAt: null
    };
    
    await addDoc(collection(db, 'loyalty_assignments'), assignment);
    
    // Clear form
    document.getElementById('loyaltyCustomerEmail').value = '';
    document.getElementById('loyaltyCouponSelect').value = '';
    document.getElementById('loyaltyReasonSelect').value = 'top_customer';
    
    msgEl.textContent = `✅ Coupon "${couponCode}" assigned to ${customerName}!`;
    msgEl.className = 'settings-msg success';
  } catch (err) {
    console.error(err);
    msgEl.textContent = '❌ Assignment failed: ' + (err.message || 'Unknown error');
    msgEl.className = 'settings-msg error';
  }
}

/* =============================================================
   EVENT LISTENERS
   ============================================================= */
function setupLoyaltyEventListeners() {
  const createBtn = document.getElementById('createCouponBtn');
  const assignBtn = document.getElementById('assignCouponBtn');
  
  if (createBtn) {
    createBtn.addEventListener('click', handleCreateCoupon);
  }
  
  if (assignBtn) {
    assignBtn.addEventListener('click', handleAssignCoupon);
  }
}

// Initialize when loyalty page is loaded
window.initLoyaltyService = initLoyaltyService;
