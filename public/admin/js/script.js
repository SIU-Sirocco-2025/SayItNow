// Show Alert Message

const showAlert = document.querySelector('[show-alert]');
if (showAlert) {
    const dataTime = parseInt(showAlert.getAttribute('data-time'));
    setTimeout(() => {
        showAlert.classList.add('alert-hidden');
    }, dataTime)
    const closeAlert = showAlert.querySelector('[close-alert]')
    if (closeAlert) {
        closeAlert.addEventListener('click', () => {
            showAlert.classList.add('alert-hidden');
        })
    }
}

// End Show Alert Message

// Mobile Sidebar Toggle
const sidebarToggle = document.querySelector('.sidebar-toggle');
const sidebarClose = document.querySelector('.sidebar-close');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.querySelector('.sidebar-overlay');

function openSidebar() {
    if (sidebar && sidebarOverlay) {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeSidebar() {
    if (sidebar && sidebarOverlay) {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

if (sidebarToggle) {
    sidebarToggle.addEventListener('click', openSidebar);
}

if (sidebarClose) {
    sidebarClose.addEventListener('click', closeSidebar);
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
}

// Close sidebar when clicking a nav link on mobile
const sidebarNavLinks = document.querySelectorAll('.sidebar-nav a');
sidebarNavLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth < 992) {
            closeSidebar();
        }
    });
});

// Close sidebar on window resize to desktop
window.addEventListener('resize', () => {
    if (window.innerWidth >= 992) {
        closeSidebar();
    }
});

// End Mobile Sidebar Toggle