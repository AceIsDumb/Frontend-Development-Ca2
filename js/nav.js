// Shared mobile navigation drawer behavior across all pages.
(function () {
  var navLinks = [
    { href: 'index.html', label: 'home' },
    { href: 'about.html', label: 'about us' },
    { href: 'rooms.html', label: 'rooms & suites' },
    { href: 'room-details.html', label: 'room detail' },
    { href: 'amenities.html', label: 'amenities' },
    { href: 'gallery.html', label: 'gallery' },
    { href: 'booking.html', label: 'booking' },
    { href: 'offers.html', label: 'offers' },
    { href: 'reviews.html', label: 'reviews' },
    { href: 'faq.html', label: 'faq' },
    { href: 'contact.html', label: 'location / contact' },
    { href: 'things-to-do.html', label: 'things to do' }
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
      backdrop.className = 'hidden fixed inset-0 bg-navy/50 z-40';
      document.body.appendChild(backdrop);
    }

    if (!existingDrawer) {
      var drawer = document.createElement('aside');
      drawer.id = 'nav-drawer';
      drawer.className = 'hidden fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-surface flex flex-col';

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
      backdrop.classList.remove('hidden');
      drawer.classList.remove('hidden');
      openButton.setAttribute('aria-expanded', 'true');
      document.body.classList.add('overflow-hidden');
    }

    function closeDrawer() {
      backdrop.classList.add('hidden');
      drawer.classList.add('hidden');
      openButton.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('overflow-hidden');
    }

    openButton.addEventListener('click', openDrawer);
    closeButton.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);

    drawer.addEventListener('click', function (event) {
      var navLink = event.target.closest('a[href]');
      if (navLink) {
        closeDrawer();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !drawer.classList.contains('hidden')) {
        closeDrawer();
      }
    });
  }

  ensureHeaderBookNowLink();
  createDrawerMarkup();
  setActiveLink();
  wireDrawerToggle();
})();
