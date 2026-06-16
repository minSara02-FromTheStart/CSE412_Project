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
    const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;

    if (window.scrollY > heroBottom - 80) {
        navSearch.style.display = 'flex';
    } else {
        navSearch.style.display = 'none';
    }
});