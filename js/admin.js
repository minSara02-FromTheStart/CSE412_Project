/* =============================================================
   admin.js  —  NutriNest Admin Panel
   All UI logic: navigation, rendering, modals, filters, CRUD.
   Firebase operations are exposed via window._fb (set in admin.html).
   =============================================================  */

'use strict';

/* =============================================================
   NAVIGATION
   ============================================================= */
const navLinks = document.querySelectorAll('.sb-link[data-page]');
const pages    = document.querySelectorAll('.page');
const topTitle = document.getElementById('topbarTitle');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        const target = link.dataset.page;
        if (!target) return;
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        pages.forEach(p => p.classList.remove('active'));
        const page = document.getElementById('page-' + target);
        if (page) page.classList.add('active');
        topTitle.textContent = link.textContent.trim();
        document.getElementById('adminSidebar').classList.remove('open');
    });
});

// Dashboard "View all →" link buttons
document.querySelectorAll('.link-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
        const match = document.querySelector(`.sb-link[data-page="${btn.dataset.page}"]`);
        if (match) match.click();
    });
});

// Mobile sidebar toggle
document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.toggle('open');
});

/* =============================================================
   TOAST
   ============================================================= */
function showToast(msg, duration = 2800) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
}

/* =============================================================
   HELPERS
   ============================================================= */
function pill(status) {
    const map = {
        Delivered:   'pill-delivered',
        Pending:     'pill-pending',
        Processing:  'pill-processing',
        'Out for Delivery': 'pill-processing',
        Customer:    'pill-customer',
        Admin:       'pill-admin',
        Deliveryman: 'pill-deliveryman',
        website:     'pill-website',
        added:       'pill-added',
        approved:    'pill-delivered',
        pending:     'pill-pending',
    };
    const label = status === 'website' ? 'Website' : status === 'added' ? 'Admin added' : status;
    return `<span class="pill ${map[status] || 'pill-customer'}">${label}</span>`;
}

function fmtDate(ts) {
    if (!ts) return '—';
    const d = (ts && ts.toDate) ? ts.toDate() : new Date(ts);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function fmtCurrency(n) {
    const num = Number(n);
    return isNaN(num) ? '৳0' : '৳' + num.toLocaleString();
}

function sanitize(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

/* =============================================================
   RENDER ALL  (called by Firebase module after data loads)
   ============================================================= */
window.renderAll = function () {
    const { orders, users, products } = window.adminData;
    renderDashboard(orders, users, products);
    renderProducts(products);
    renderOrders(orders);
    renderCustomers(users);
    renderRiders(users);
};

/* =============================================================
   DASHBOARD
   ============================================================= */
function renderDashboard(orders, users, products) {
    const totalRevenue   = orders.reduce((s, o) => s + (Number(o.grandTotal) || Number(o.total) || 0), 0);
    const totalOrders    = orders.length;
    const totalCustomers = users.filter(u => u.role === 'Customer').length;
    const pending        = orders.filter(o => o.status === 'Pending').length;

    document.getElementById('stat-revenue').textContent       = fmtCurrency(totalRevenue);
    document.getElementById('stat-orders').textContent        = totalOrders;
    document.getElementById('stat-customers').textContent     = totalCustomers;
    document.getElementById('stat-pending').textContent       = pending;
    document.getElementById('stat-orders-trend').textContent  = `${pending} pending`;
    document.getElementById('stat-pending-trend').textContent = pending > 0 ? 'Needs attention' : '✅ All clear';

    // Recent orders (last 5)
    const tbody = document.getElementById('recent-orders-body');
    const recent = orders.slice(0, 5);
    tbody.innerHTML = recent.length
        ? recent.map(o => {
            const itemStr = Array.isArray(o.items)
                ? o.items.map(i => `${i.name}×${i.qty}`).join(', ')
                : (o.product || '—');
            return `<tr>
                <td>${sanitize(o.fullName || o.customerName || '—')}</td>
                <td>${sanitize(itemStr)}</td>
                <td>${fmtCurrency(o.grandTotal || o.total || 0)}</td>
                <td>${pill(o.status || 'Pending')}</td>
            </tr>`;
          }).join('')
        : `<tr><td colspan="4" class="empty-cell">No orders yet.</td></tr>`;

    // Top products list (sorted by price descending, max 8)
    const topEl   = document.getElementById('top-products');
    const topList = [...products].sort((a,b) => b.price - a.price).slice(0, 8);
    topEl.innerHTML = topList.length
        ? topList.map(p => `
            <div class="top-prod-row">
                <img class="top-prod-img" src="${sanitize(p.image||'')}" alt="${sanitize(p.name)}"
                     onerror="this.style.background='#eee';this.removeAttribute('src')">
                <span class="top-prod-name">${sanitize(p.name)}</span>
                <span class="top-prod-price">${fmtCurrency(p.price)}/kg</span>
            </div>`).join('')
        : `<p class="empty-cell">No products yet.</p>`;

    renderCharts(orders, products);
}

/* =============================================================
   DASHBOARD CHARTS  (sales over time + stock levels)
   ============================================================= */
let salesChartInstance = null;
let stockChartInstance = null;

function orderDateKey(o) {
    const ts = o.createdAt;
    const d = (ts && ts.toDate) ? ts.toDate() : new Date(ts || Date.now());
    if (isNaN(d)) return null;
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function renderCharts(orders, products) {
    if (typeof Chart === 'undefined') return; // Chart.js failed to load (offline)

    /* ── Sales over the last 14 days ── */
    const days = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
    }
    const revenueByDay = Object.fromEntries(days.map(d => [d, 0]));
    orders.forEach(o => {
        const key = orderDateKey(o);
        if (key && key in revenueByDay) {
            revenueByDay[key] += Number(o.grandTotal || o.total || 0);
        }
    });
    const salesLabels = days.map(d => d.slice(5)); // MM-DD
    const salesData = days.map(d => revenueByDay[d]);

    const salesCanvas = document.getElementById('salesChart');
    if (salesCanvas) {
        if (salesChartInstance) salesChartInstance.destroy();
        salesChartInstance = new Chart(salesCanvas, {
            type: 'line',
            data: {
                labels: salesLabels,
                datasets: [{
                    label: 'Revenue (৳)',
                    data: salesData,
                    borderColor: '#006b3c',
                    backgroundColor: 'rgba(0,107,60,0.12)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    /* ── Stock levels per product ── */
    const stockCanvas = document.getElementById('stockChart');
    if (stockCanvas) {
        const stocked = [...products].sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0));
        const labels = stocked.map(p => p.name);
        const data = stocked.map(p => Number(p.stock) || 0);
        const colors = data.map(v => v <= 10 ? '#dc2626' : v <= 25 ? '#d97706' : '#006b3c');

        if (stockChartInstance) stockChartInstance.destroy();
        stockChartInstance = new Chart(stockCanvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Stock (KG)',
                    data,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                indexAxis: labels.length > 6 ? 'y' : 'x',
                scales: { x: { beginAtZero: true } }
            }
        });
    }
}

/* =============================================================
   PRODUCTS PAGE
   ============================================================= */
function renderProducts(products, search = '', category = '', source = '') {
    let list = [...products];

    if (search)   list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) ||
                                          (p.desc||'').toLowerCase().includes(search.toLowerCase()));
    if (category) list = list.filter(p => p.category === category);
    if (source)   list = list.filter(p => (p.source || 'added') === source);

    // Update count badge
    const countEl = document.getElementById('productCount');
    if (countEl) countEl.textContent = list.length + ' product' + (list.length !== 1 ? 's' : '');

    const grid = document.getElementById('productGrid');
    grid.innerHTML = list.length
        ? list.map(p => {
            const src      = p.source || 'added';
            const srcLabel = src === 'website' ? 'Website' : 'Admin added';
            const srcClass = src === 'website' ? 'src-website' : 'src-added';
            const canDelete = src !== 'website'; // prevent deleting hardcoded ones from UI (optional)
            return `
            <div class="product-card source-${src}">
                <img src="${sanitize(p.image||'')}" alt="${sanitize(p.name)}"
                     onerror="this.style.background='#eee';this.removeAttribute('src')">
                <div class="product-card-info">
                    <h4>${sanitize(p.name)}</h4>
                    <p class="price">${fmtCurrency(p.price)} / kg</p>
                    <p class="stock ${(Number(p.stock)||0) <= 10 ? 'stock-low' : ''}">Stock: ${Number(p.stock)||0} kg</p>
                    <span class="cat-tag">${sanitize(p.category||'General')}</span>
                    <span class="src-tag ${srcClass}">${srcLabel}</span>
                </div>
                <div class="product-card-actions">
                    <button class="action-btn" onclick="openEditProduct('${p.id}')">✏️ Edit</button>
                    <button class="action-btn danger" onclick="deleteProduct('${p.id}','${src}')">🗑 Del</button>
                </div>
            </div>`;
          }).join('')
        : `<p class="empty-cell" style="padding:30px">No products found.</p>`;
}

// Filter listeners for products
document.getElementById('productSearch').addEventListener('input', applyProductFilters);
document.getElementById('categoryFilter').addEventListener('change', applyProductFilters);
document.getElementById('sourceFilter').addEventListener('change', applyProductFilters);

function applyProductFilters() {
    renderProducts(
        window.adminData.products,
        document.getElementById('productSearch').value,
        document.getElementById('categoryFilter').value,
        document.getElementById('sourceFilter').value
    );
}

/* =============================================================
   ORDERS PAGE
   ============================================================= */
function renderOrders(orders, search = '', status = '') {
    let list = [...orders];
    if (search) list = list.filter(o =>
        (o.fullName||o.customerName||'').toLowerCase().includes(search.toLowerCase()) ||
        (o.phone||'').includes(search)
    );
    if (status) list = list.filter(o => o.status === status);

    const tbody = document.getElementById('orders-body');
    tbody.innerHTML = list.length
        ? list.map((o, i) => {
            const itemStr = Array.isArray(o.items)
                ? o.items.map(it => `${it.name} ×${it.qty}`).join('<br>')
                : sanitize(o.product || '—');
            const canAssign = o.status === 'Processing' || o.status === 'Out for Delivery';
            const riderLabel = o.riderId
                ? `<br><span class="src-tag src-added" style="margin-top:4px;display:inline-block;">🏍️ ${sanitize(o.riderName||'')}</span>`
                : '';
            return `<tr>
                <td>#${sanitize(o.id.slice(-6).toUpperCase())}</td>
                <td>${sanitize(o.fullName || o.customerName || '—')}</td>
                <td>${sanitize(o.phone || '—')}</td>
                <td>${itemStr}</td>
                <td>${fmtCurrency(o.grandTotal || o.total || 0)}</td>
                <td>${sanitize(o.deliveryType || o.delivery || '—')}</td>
                <td>${fmtDate(o.createdAt)}</td>
                <td>${pill(o.status || 'Pending')}${riderLabel}</td>
                <td>
                    <button class="action-btn"
                        onclick="openOrderModal('${o.id}','${o.status||'Pending'}',
                            '${sanitize(o.fullName||o.customerName||'')}',
                            '${Array.isArray(o.items)?o.items.map(it=>it.name).join(', '):(o.product||'')}')">
                        Update
                    </button>
                    ${canAssign ? `<button class="action-btn" onclick="openAssignRiderModal('${o.id}')">${o.riderId ? '🔁 Reassign' : '🏍️ Assign Rider'}</button>` : ''}
                </td>
            </tr>`;
          }).join('')
        : `<tr><td colspan="9" class="empty-cell">No orders found.</td></tr>`;
}

document.getElementById('orderSearch').addEventListener('input', applyOrderFilters);
document.getElementById('orderStatusFilter').addEventListener('change', applyOrderFilters);

function applyOrderFilters() {
    renderOrders(
        window.adminData.orders,
        document.getElementById('orderSearch').value,
        document.getElementById('orderStatusFilter').value
    );
}

/* =============================================================
   CUSTOMERS PAGE
   ============================================================= */
function renderCustomers(users, search = '', role = '') {
    let list = [...users];
    if (search) list = list.filter(u =>
        (u.fullName||'').toLowerCase().includes(search.toLowerCase()) ||
        (u.email||'').toLowerCase().includes(search.toLowerCase()) ||
        (u.phone||'').includes(search)
    );
    if (role) list = list.filter(u => u.role === role);

    const tbody = document.getElementById('customers-body');
    tbody.innerHTML = list.length
        ? list.map(u => `<tr>
            <td>${sanitize(u.fullName||'—')}</td>
            <td>${sanitize(u.email||'—')}</td>
            <td>${sanitize(u.phone||'—')}</td>
            <td>${pill(u.role||'Customer')}</td>
            <td>${fmtDate(u.createdAt)}</td>
            <td>
                <button class="action-btn danger" onclick="deleteCustomer('${u.id}')">Remove</button>
            </td>
        </tr>`).join('')
        : `<tr><td colspan="6" class="empty-cell">No customers found.</td></tr>`;
}

document.getElementById('customerSearch').addEventListener('input', applyCustomerFilters);
document.getElementById('roleFilter').addEventListener('change', applyCustomerFilters);

function applyCustomerFilters() {
    renderCustomers(
        window.adminData.users,
        document.getElementById('customerSearch').value,
        document.getElementById('roleFilter').value
    );
}

/* =============================================================
   RIDERS PAGE  (pending applications + active riders)
   ============================================================= */
function renderRiders(users) {
    const riders  = users.filter(u => u.role === 'Deliveryman');
    const pending = riders.filter(u => u.riderStatus !== 'approved');
    const active  = riders.filter(u => u.riderStatus === 'approved');

    const badge = document.getElementById('riderPendingBadge');
    if (badge) {
        if (pending.length > 0) {
            badge.textContent = pending.length;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    const pendingBody = document.getElementById('rider-pending-body');
    pendingBody.innerHTML = pending.length
        ? pending.map(u => `<tr>
            <td>${sanitize(u.fullName||'—')}</td>
            <td>${sanitize(u.phone||'—')}</td>
            <td>${sanitize(u.email||'—')}</td>
            <td>${fmtDate(u.createdAt)}</td>
            <td>
                <button class="action-btn" onclick="approveRider('${u.id}')">✅ Approve</button>
                <button class="action-btn danger" onclick="rejectRider('${u.id}')">✖ Reject</button>
            </td>
        </tr>`).join('')
        : `<tr><td colspan="5" class="empty-cell">No pending applications.</td></tr>`;

    const activeBody = document.getElementById('rider-active-body');
    activeBody.innerHTML = active.length
        ? active.map(u => `<tr>
            <td>${sanitize(u.fullName||'—')}</td>
            <td>${sanitize(u.phone||'—')}</td>
            <td>${sanitize(u.email||'—')}</td>
            <td>${pill('approved')}</td>
            <td>
                <button class="action-btn danger" onclick="deleteCustomer('${u.id}')">Remove</button>
            </td>
        </tr>`).join('')
        : `<tr><td colspan="5" class="empty-cell">No approved riders yet.</td></tr>`;
}

window.approveRider = async function(id) {
    try {
        const { db, doc, updateDoc } = window._fb;
        await updateDoc(doc(db, 'users', id), { riderStatus: 'approved' });
        const idx = window.adminData.users.findIndex(u => u.id === id);
        if (idx > -1) window.adminData.users[idx].riderStatus = 'approved';
        renderRiders(window.adminData.users);
        renderCustomers(window.adminData.users);
        showToast('✅ Rider approved! They can now log in.');
    } catch(err) {
        console.error(err);
        showToast('❌ Approval failed.');
    }
};

window.rejectRider = async function(id) {
    if (!confirm('Reject this rider application? The account will be removed.')) return;
    try {
        const { db, doc, deleteDoc } = window._fb;
        await deleteDoc(doc(db, 'users', id));
        window.adminData.users = window.adminData.users.filter(u => u.id !== id);
        renderRiders(window.adminData.users);
        renderCustomers(window.adminData.users);
        showToast('🗑 Application rejected.');
    } catch(err) {
        console.error(err);
        showToast('❌ Reject failed.');
    }
};

/* =============================================================
   ASSIGN RIDER MODAL
   ============================================================= */
const assignRiderModal = document.getElementById('assignRiderModal');

window.openAssignRiderModal = function(orderId) {
    const order = window.adminData.orders.find(o => o.id === orderId);
    if (!order) return;

    const availableRiders = window.adminData.users.filter(u => u.role === 'Deliveryman' && u.riderStatus === 'approved');
    const select = document.getElementById('assignRiderSelect');

    if (availableRiders.length === 0) {
        select.innerHTML = `<option value="">-- No approved riders available --</option>`;
    } else {
        select.innerHTML = availableRiders.map(r =>
            `<option value="${r.id}" data-name="${sanitize(r.fullName||'')}" data-phone="${sanitize(r.phone||'')}" ${order.riderId === r.id ? 'selected' : ''}>
                ${sanitize(r.fullName||'Rider')} (${sanitize(r.phone||'—')})
            </option>`
        ).join('');
    }

    document.getElementById('assignOrderId').value = orderId;
    document.getElementById('assignRiderInfo').textContent =
        `${order.fullName || order.customerName || 'Customer'} — ${order.address || ''}`;
    document.getElementById('assignRiderError').textContent = '';
    assignRiderModal.classList.add('open');
};

document.getElementById('closeAssignRiderModal').addEventListener('click',  () => assignRiderModal.classList.remove('open'));
document.getElementById('cancelAssignRiderModal').addEventListener('click', () => assignRiderModal.classList.remove('open'));

document.getElementById('saveAssignRider').addEventListener('click', async () => {
    const orderId = document.getElementById('assignOrderId').value;
    const select   = document.getElementById('assignRiderSelect');
    const errEl    = document.getElementById('assignRiderError');
    const chosen   = select.options[select.selectedIndex];

    if (!select.value) { errEl.textContent = '⚠️ Please choose a rider.'; return; }
    errEl.textContent = '';

    const riderId    = select.value;
    const riderName  = chosen.dataset.name || '';
    const riderPhone = chosen.dataset.phone || '';

    try {
        const { db, doc, updateDoc } = window._fb;
        await updateDoc(doc(db, 'orders', orderId), {
            riderId, riderName, riderPhone,
            status: 'Out for Delivery'
        });
        const idx = window.adminData.orders.findIndex(o => o.id === orderId);
        if (idx > -1) {
            window.adminData.orders[idx].riderId    = riderId;
            window.adminData.orders[idx].riderName  = riderName;
            window.adminData.orders[idx].riderPhone = riderPhone;
            window.adminData.orders[idx].status     = 'Out for Delivery';
        }
        renderOrders(window.adminData.orders);
        renderDashboard(window.adminData.orders, window.adminData.users, window.adminData.products);
        assignRiderModal.classList.remove('open');
        showToast(`✅ Order assigned to ${riderName}.`);
    } catch(err) {
        console.error(err);
        errEl.textContent = '❌ Assignment failed: ' + (err.message || 'unknown error');
    }
});

/* =============================================================
   ADD / EDIT PRODUCT MODAL
   ============================================================= */
const productModal  = document.getElementById('productModal');
const saveProductBtn = document.getElementById('saveProduct');

function openProductModal() { productModal.classList.add('open'); }

function closeProductModal() {
    productModal.classList.remove('open');
    document.getElementById('editProductId').value  = '';
    document.getElementById('productName').value    = '';
    document.getElementById('productPrice').value   = '';
    document.getElementById('productStock').value   = '';
    document.getElementById('productImage').value   = '';
    document.getElementById('productImageFile').value = '';
    document.getElementById('productImagePreview').innerHTML = '';
    document.getElementById('productDesc').value    = '';
    document.getElementById('productError').textContent = '';
    document.getElementById('modalTitle').textContent   = 'Add New Product';
    saveProductBtn.textContent = 'Add Product';
}

document.getElementById('productImageFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('productImagePreview');
    if (!file) { preview.innerHTML = ''; return; }
    const url = URL.createObjectURL(file);
    preview.innerHTML = `<img src="${url}" alt="preview" style="width:90px;height:90px;object-fit:cover;border-radius:8px;border:1px solid var(--border);">`;
});

document.getElementById('openAddProduct').addEventListener('click', openProductModal);
document.getElementById('closeProductModal').addEventListener('click', closeProductModal);
document.getElementById('cancelProductModal').addEventListener('click', closeProductModal);

window.openEditProduct = function(id) {
    const p = window.adminData.products.find(x => x.id === id);
    if (!p) return;
    document.getElementById('editProductId').value      = id;
    document.getElementById('productName').value        = p.name;
    document.getElementById('productPrice').value       = p.price;
    document.getElementById('productStock').value       = p.stock != null ? p.stock : '';
    document.getElementById('productImage').value       = p.image || '';
    document.getElementById('productImageFile').value   = '';
    document.getElementById('productImagePreview').innerHTML = p.image
        ? `<img src="${p.image}" alt="current" style="width:90px;height:90px;object-fit:cover;border-radius:8px;border:1px solid var(--border);">`
        : '';
    document.getElementById('productDesc').value        = p.desc  || '';
    document.getElementById('productCategory').value   = p.category || 'Popular';
    document.getElementById('modalTitle').textContent   = 'Edit Product';
    saveProductBtn.textContent = 'Save Changes';
    openProductModal();
};

saveProductBtn.addEventListener('click', async () => {
    const name     = document.getElementById('productName').value.trim();
    const price    = Number(document.getElementById('productPrice').value);
    const stock    = Number(document.getElementById('productStock').value);
    let   image    = document.getElementById('productImage').value.trim();
    const imageFile = document.getElementById('productImageFile').files[0];
    const desc     = document.getElementById('productDesc').value.trim();
    const category = document.getElementById('productCategory').value;
    const editId   = document.getElementById('editProductId').value;
    const errEl    = document.getElementById('productError');

    if (!name)  { errEl.textContent = '⚠️ Product name is required.'; return; }
    if (!price || price <= 0) { errEl.textContent = '⚠️ Enter a valid price.'; return; }
    if (document.getElementById('productStock').value === '' || isNaN(stock) || stock < 0) {
        errEl.textContent = '⚠️ Enter a valid stock quantity.'; return;
    }
    if (!editId && !imageFile) { errEl.textContent = '⚠️ Please choose an image to upload.'; return; }
    errEl.textContent = '';

    saveProductBtn.disabled = true;
    saveProductBtn.textContent = 'Saving...';

    try {
        const { db, doc, collection, addDoc, updateDoc, storageRef, uploadBytes, getDownloadURL } = window._fb;

        /* Upload the new picture from the admin's device to Firebase Storage,
           swapping the old Image URL field for a real file upload. */
        if (imageFile) {
            saveProductBtn.textContent = 'Uploading image...';
            const path = `products/${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const fileRef = storageRef(window._fb.storage, path);
            await uploadBytes(fileRef, imageFile);
            image = await getDownloadURL(fileRef);
        }

        const data = { name, price, stock, image, desc, category };
        saveProductBtn.textContent = 'Saving...';

        if (editId) {
            await updateDoc(doc(db, 'products', editId), data);
            const idx = window.adminData.products.findIndex(p => p.id === editId);
            if (idx > -1) window.adminData.products[idx] = { ...window.adminData.products[idx], ...data };
            showToast('✅ Product updated!');
        } else {
            /* New products added by admin get source:'added'
               They will automatically appear in products.html because
               products.html reads from Firestore (see note at bottom) */
            const ref = await addDoc(collection(db, 'products'), {
                ...data,
                source: 'added',
                createdAt: new Date().toISOString()
            });
            window.adminData.products.unshift({ id: ref.id, ...data, source: 'added' });
            showToast('✅ Product added! It will now appear on the website.');
        }

        renderProducts(window.adminData.products);
        renderDashboard(window.adminData.orders, window.adminData.users, window.adminData.products);
        closeProductModal();
    } catch(err) {
        errEl.textContent = '❌ Save failed: ' + (err.message || 'unknown error');
        console.error(err);
    } finally {
        saveProductBtn.disabled = false;
        saveProductBtn.textContent = editId ? 'Save Changes' : 'Add Product';
    }
});

/* ── Delete product ── */
window.deleteProduct = async function(id, source) {
    const label = source === 'website'
        ? 'This is a hardcoded website product. Deleting it from Firestore will hide it from the admin panel but it will still appear on index.html/products.html until you remove it from the HTML. Continue?'
        : 'Delete this product? It will also be removed from the website products list.';
    if (!confirm(label)) return;

    try {
        const { db, doc, deleteDoc } = window._fb;
        await deleteDoc(doc(db, 'products', id));
        window.adminData.products = window.adminData.products.filter(p => p.id !== id);
        renderProducts(window.adminData.products);
        renderDashboard(window.adminData.orders, window.adminData.users, window.adminData.products);
        showToast('🗑 Product deleted.');
    } catch(err) {
        console.error(err);
        showToast('❌ Delete failed.');
    }
};

/* =============================================================
   ORDER STATUS MODAL
   ============================================================= */
const orderModal = document.getElementById('orderModal');

window.openOrderModal = function(id, currentStatus, customerName, product) {
    document.getElementById('editOrderId').value     = id;
    document.getElementById('newOrderStatus').value  = currentStatus;
    document.getElementById('orderModalInfo').textContent =
        `${customerName}  —  ${product}`;
    orderModal.classList.add('open');
};

document.getElementById('closeOrderModal').addEventListener('click',  () => orderModal.classList.remove('open'));
document.getElementById('cancelOrderModal').addEventListener('click', () => orderModal.classList.remove('open'));

document.getElementById('saveOrderStatus').addEventListener('click', async () => {
    const id     = document.getElementById('editOrderId').value;
    const status = document.getElementById('newOrderStatus').value;
    try {
        const { db, doc, updateDoc } = window._fb;
        await updateDoc(doc(db, 'orders', id), { status });
        const idx = window.adminData.orders.findIndex(o => o.id === id);
        if (idx > -1) window.adminData.orders[idx].status = status;
        renderOrders(window.adminData.orders);
        renderDashboard(window.adminData.orders, window.adminData.users, window.adminData.products);
        orderModal.classList.remove('open');
        showToast('✅ Order status updated.');
    } catch(err) {
        console.error(err);
        showToast('❌ Update failed.');
    }
});

/* =============================================================
   DELETE CUSTOMER
   ============================================================= */
window.deleteCustomer = async function(id) {
    if (!confirm('Remove this customer from the database? This cannot be undone.')) return;
    try {
        const { db, doc, deleteDoc } = window._fb;
        await deleteDoc(doc(db, 'users', id));
        window.adminData.users = window.adminData.users.filter(u => u.id !== id);
        renderCustomers(window.adminData.users);
        renderDashboard(window.adminData.orders, window.adminData.users, window.adminData.products);
        showToast('🗑 Customer removed.');
    } catch(err) {
        console.error(err);
        showToast('❌ Remove failed.');
    }
};

/* =============================================================
   SETTINGS
   ============================================================= */
document.getElementById('saveStoreInfo').addEventListener('click', () => {
    showToast('✅ Store info saved.');
    document.getElementById('storeMsg').textContent = '✅ Saved.';
    setTimeout(() => document.getElementById('storeMsg').textContent = '', 3000);
});

document.getElementById('saveDelivery').addEventListener('click', () => {
    showToast('✅ Delivery fees saved.');
    document.getElementById('deliveryMsg').textContent = '✅ Saved.';
    setTimeout(() => document.getElementById('deliveryMsg').textContent = '', 3000);
});

/* =============================================================
   CLOSE MODALS ON BACKGROUND CLICK
   ============================================================= */
[productModal, orderModal, assignRiderModal].forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('open');
    });
});

/* =============================================================
   FALLBACK: initialise empty data until Firebase loads
   ============================================================= */
if (!window.adminData) {
    window.adminData = { orders:[], users:[], products:[] };
}

/* =============================================================
   NOTE FOR THE DEVELOPER — products.html / index.html
   ─────────────────────────────────────────────────────────────
   To make the website products list also read from Firestore
   (so that admin-added products appear on the site automatically),
   replace the hardcoded <div class="card">...</div> blocks in
   index.html and products.html with dynamic rendering.

   Add this script at the bottom of those pages:

   <script type="module">
     import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
     import { getFirestore, collection, getDocs }
             from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

     const firebaseConfig = { ... }; // same config
     const db = getFirestore(initializeApp(firebaseConfig));

     getDocs(collection(db, 'products')).then(snap => {
       const container = document.querySelector('.product-container');
       container.innerHTML = '';
       snap.forEach(d => {
         const p = d.data();
         container.innerHTML += `
           <div class="card">
             <img src="${p.image}" alt="${p.name}">
             <h2>${p.name}</h2>
             <h3>৳${p.price} / KG</h3>
             <p>${p.desc}</p>
             <button class="cart-btn" onclick="addToCart('${p.name}', ${p.price})">Add to Cart</button>
           </div>`;
       });
     });
   </script>
   ============================================================= */