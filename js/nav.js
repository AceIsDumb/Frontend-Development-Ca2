// Shared mobile navigation drawer behavior across all pages.
(function () {
  var navLinks = [
    { href: 'index.html', label: 'Home' },
    { href: 'about.html', label: 'About Us' },
    { href: 'rooms.html', label: 'Rooms & Suites' },
    { href: 'room-details.html', label: 'Room Detail' },
    { href: 'amenities.html', label: 'Amenities' },
    { href: 'gallery.html', label: 'Gallery' },
    { href: 'booking.html', label: 'Booking' },
    { href: 'offers.html', label: 'Offers' },
    { href: 'reviews.html', label: 'Reviews' },
    { href: 'faq.html', label: 'Frequently Asked Questions' },
    { href: 'contact.html', label: 'Location / Contact' },
    { href: 'things-to-do.html', label: 'Things to Do' }
  ];

  function getCurrentPage() {
    var current = window.location.pathname.split('/').pop();
    return current || 'index.html';
  }

  function ensureHeaderBookNowLink() {
    var bookNowLink = document.querySelector('header a.btn-primary');
    if (bookNowLink && (!bookNowLink.getAttribute('href') || bookNowLink.getAttribute('href') === '#')) {
      bookNowLink.setAttribute('href', 'booking.html');
    }
  }

  function createDrawerMarkup() {
    var existingBackdrop = document.getElementById('nav-backdrop');
    var existingDrawer = document.getElementById('nav-drawer');

    if (!existingBackdrop) {
      var backdrop = document.createElement('div');
      backdrop.id = 'nav-backdrop';
      // start hidden via opacity and pointer-events; we'll animate opacity
      backdrop.className = 'fixed inset-0 bg-navy/50 z-40 opacity-0 pointer-events-none transition-opacity duration-300';
      document.body.appendChild(backdrop);
    }

    if (!existingDrawer) {
      var drawer = document.createElement('aside');
      drawer.id = 'nav-drawer';
      // start off-screen to the right and animate with translate-x classes
      drawer.className = 'fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-surface transform translate-x-full transition-transform duration-300 flex flex-col';

      var itemsHtml = navLinks
        .map(function (item) {
          return '<li><a href="' + item.href + '" class="block px-6 py-3 hover:bg-surfacealt">' + item.label + '</a></li>';
        })
        .join('');

      drawer.innerHTML =
        '<div class="flex items-center justify-between px-6 py-5 border-b border-border">' +
          '<p class="font-serif text-xl text-navy">Menu</p>' +
          '<button id="nav-close" aria-label="close menu" class="text-2xl leading-none text-stone hover:text-navy">&times;</button>' +
        '</div>' +
        '<nav class="flex-1 overflow-y-auto py-3">' +
          '<ul class="text-sm">' + itemsHtml + '</ul>' +
        '</nav>' +
        '<div class="px-6 py-5 border-t border-border">' +
          '<a href="booking.html" class="btn-primary w-full">Book Now</a>' +
        '</div>';

      document.body.appendChild(drawer);
    }
  }

  function setActiveLink() {
    var navDrawer = document.getElementById('nav-drawer');
    if (!navDrawer) {
      return;
    }

    var currentPage = getCurrentPage();
    var drawerLinks = navDrawer.querySelectorAll('nav a[href]');

    drawerLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      var isCurrent = href === currentPage;

      link.classList.remove('bg-navytint', 'text-navy', 'font-medium');
      link.classList.add('hover:bg-surfacealt');
      link.removeAttribute('aria-current');

      if (isCurrent) {
        link.classList.add('bg-navytint', 'text-navy', 'font-medium');
        link.classList.remove('hover:bg-surfacealt');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function wireDrawerToggle() {
    var openButton = document.getElementById('nav-open') || document.querySelector('button[aria-label="open menu"]');
    var closeButton = document.getElementById('nav-close');
    var backdrop = document.getElementById('nav-backdrop');
    var drawer = document.getElementById('nav-drawer');

    if (!openButton || !closeButton || !backdrop || !drawer) {
      return;
    }

    openButton.id = 'nav-open';
    openButton.setAttribute('aria-controls', 'nav-drawer');
    openButton.setAttribute('aria-expanded', 'false');

    function openDrawer() {
      // show backdrop (fade in)
      backdrop.classList.remove('opacity-0', 'pointer-events-none');
      backdrop.classList.add('opacity-100');
      // slide drawer in
      drawer.classList.remove('translate-x-full');
      drawer.classList.add('translate-x-0');

      openButton.setAttribute('aria-expanded', 'true');
      document.body.classList.add('overflow-hidden');
    }

    function closeDrawer() {
      // fade backdrop out
      backdrop.classList.remove('opacity-100');
      backdrop.classList.add('opacity-0', 'pointer-events-none');
      // slide drawer out
      drawer.classList.remove('translate-x-0');
      drawer.classList.add('translate-x-full');

      openButton.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('overflow-hidden');
    }

    openButton.addEventListener('click', openDrawer);
    closeButton.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);

    drawer.addEventListener('click', function (event) {
      var navLink = event.target.closest('a[href]');
      if (navLink) {
        // let native navigation happen, but close the drawer with animation
        closeDrawer();
      }
    });

    document.addEventListener('keydown', function (event) {
      // close on ESC if drawer is visible
      if (event.key === 'Escape' && drawer.classList.contains('translate-x-0')) {
        closeDrawer();
      }
    });
  }

  ensureHeaderBookNowLink();
  createDrawerMarkup();
  setActiveLink();
  wireDrawerToggle();
})();
