const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const menuIcon = document.querySelector('.menu-icon');
const closeBtn = document.getElementById('sidebarClose');
const productToggle = document.getElementById('productToggle');
const productSubmenu = document.getElementById('productSubmenu');

menuIcon.addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('active');
});

closeBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
});

overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
});

productToggle.addEventListener('click', () => {
    productSubmenu.classList.toggle('open');
    productToggle.querySelector('.arrow').classList.toggle('open');
});

document.querySelectorAll('.sidebar-link[href]').forEach(link => {
    link.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });
});

const heroSection = document.querySelector('.hero');
const navbar = document.querySelector('.navbar');
const navRight = document.querySelector('.nav-right');

const navSearch = document.createElement('form');
navSearch.action = 'products.html';
navSearch.method = 'get';
navSearch.innerHTML = `
    <input type="text" name="search" placeholder="Search products...">
    <button type="submit">Search</button>
`;
navSearch.classList.add('nav-search-box');
navSearch.style.display = 'none';

// insert BEFORE nav-right, so order is: logo | search | login
navbar.insertBefore(navSearch, navRight);

window.addEventListener('scroll', () => {
    if (!heroSection) return;
    const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;

    if (window.scrollY > heroBottom - 80) {
        navSearch.style.display = 'flex';
    } else {
        navSearch.style.display = 'none';
    }
});

// Signup modal and client-side auth using localStorage
document.addEventListener('DOMContentLoaded', () => {
    const openSignup = document.getElementById('openSignup');
    const signupOverlay = document.getElementById('signupOverlay');
    const signupClose = document.getElementById('signupClose');
    const signupOptions = document.getElementById('signupOptions');
    const signupForm = document.getElementById('signupForm');
    const roleButtons = document.querySelectorAll('.role-btn');
    const signupTitle = document.getElementById('signupTitle');
    const signupRoleInput = document.getElementById('signupRole');
    const changeRole = document.getElementById('changeRole');
    const signupFormElement = document.getElementById('signupFormElement');
    const loginForm = document.getElementById('loginForm');

    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem('users') || '{}');
        } catch (e) { return {}; }
    }

    function saveUsers(users) {
        localStorage.setItem('users', JSON.stringify(users));
    }

    function closeSignup() {
        if (!signupOverlay) return;
        signupOverlay.hidden = true;
        document.body.style.overflow = '';
    }

    if (openSignup && signupOverlay) {
        openSignup.addEventListener('click', (e) => {
            e.preventDefault();
            signupOverlay.hidden = false;
            if (signupOptions) signupOptions.hidden = false;
            if (signupForm) signupForm.hidden = true;
            document.body.style.overflow = 'hidden';
        });

        if (signupClose) signupClose.addEventListener('click', closeSignup);

        signupOverlay.addEventListener('click', (e) => {
            if (e.target === signupOverlay) closeSignup();
        });

        roleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const role = btn.dataset.role || '';
                if (signupTitle) signupTitle.textContent = `Sign up as ${role}`;
                if (signupRoleInput) signupRoleInput.value = role;
                if (signupOptions) signupOptions.hidden = true;
                if (signupForm) signupForm.hidden = false;
            });
        });

        if (changeRole) {
            changeRole.addEventListener('click', (e) => {
                e.preventDefault();
                if (signupForm) signupForm.hidden = true;
                if (signupOptions) signupOptions.hidden = false;
            });
        }

        // Handle signup submission
        if (signupFormElement) {
            signupFormElement.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('fullName').value.trim();
                const phone = document.getElementById('signupPhone').value.trim();
                const email = document.getElementById('signupEmail').value.trim().toLowerCase();
                const password = document.getElementById('signupPassword').value;
                const role = signupRoleInput.value || 'Customer';

                if (!name || !phone || !email || !password) {
                    alert('Please fill all fields.');
                    return;
                }

                const users = getUsers();
                if (users[email]) {
                    alert('An account with this email already exists. Please login or use another email.');
                    return;
                }

                users[email] = { name, phone, email, password, role };
                saveUsers(users);

                // auto-fill login form and close modal
                const loginEmail = document.getElementById('email');
                const loginPassword = document.getElementById('password');
                if (loginEmail) loginEmail.value = email;
                if (loginPassword) loginPassword.value = password;

                alert('Signup successful! You can now log in.');
                closeSignup();
            });
        }

        // Handle login submission
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value.trim().toLowerCase();
                const password = document.getElementById('password').value;
                const users = getUsers();
                const user = users[email];
                if (!user || user.password !== password) {
                    alert('Invalid email or password.');
                    return;
                }
                // persist current user
                localStorage.setItem('currentUser', email);
                alert(`Welcome back, ${user.name || user.email}!`);
                // redirect to homepage
                window.location.href = 'index.html';
            });
        }
    }
});
 