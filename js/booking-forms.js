/* =================================================================
   booking-forms.js
   Shared JS for rooms.html, room-details.html, and booking.html.

   Conventions used throughout this file:
   - Only querySelector / querySelectorAll are used to grab elements
     (no getElementById, no getElementsByClassName).
   - Class selectors (.js-*) are used as JS "hooks" instead of IDs,
     so the same selector style works whether there's one match or many.
   - textContent is used instead of innerHTML anywhere content is
     written back to the page, so user input is always treated as
     plain text and never parsed as markup.
================================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initBookingForm();
  initRoomDetailsForm();
  initRoomTabs();
  initRoomFromQueryString();
  initRoomCardLinks();
});

/* -----------------------------------------------------------------
   Shared validation helpers
   (used by both the booking.html form and the room-details.html
   quick-booking form, so the rules stay identical in both places)
----------------------------------------------------------------- */

function showFieldError(inputEl, message) {
  inputEl.classList.add('field-error');

  const fieldWrapper = inputEl.parentElement;
  const errorEl = fieldWrapper.querySelector('.field-error-msg');

  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }
}

function clearFieldError(inputEl) {
  inputEl.classList.remove('field-error');

  const fieldWrapper = inputEl.parentElement;
  const errorEl = fieldWrapper.querySelector('.field-error-msg');

  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
}

function isBlank(value) {
  return value.trim().length === 0;
}

function toDateOnly(value) {
  if (isBlank(value)) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// only accepts a strict YYYY-MM-DD shape before it's ever assigned to
// an input's value — guards against junk/unexpected query-string data
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates a check-in / check-out date pair.
 * Rules: both required, check-in can't be in the past,
 * check-out must be strictly after check-in.
 * Returns true if the pair is valid.
 */
function validateStayDates(checkinEl, checkoutEl) {
  clearFieldError(checkinEl);
  clearFieldError(checkoutEl);

  let valid = true;
  const today = toDateOnly(new Date().toISOString().slice(0, 10));

  if (isBlank(checkinEl.value)) {
    showFieldError(checkinEl, 'please select a check-in date.');
    valid = false;
  } else if (toDateOnly(checkinEl.value) < today) {
    showFieldError(checkinEl, 'check-in date can\'t be in the past.');
    valid = false;
  }

  if (isBlank(checkoutEl.value)) {
    showFieldError(checkoutEl, 'please select a check-out date.');
    valid = false;
  }

  const checkinDate = toDateOnly(checkinEl.value);
  const checkoutDate = toDateOnly(checkoutEl.value);

  if (checkinDate && checkoutDate && checkoutDate <= checkinDate) {
    showFieldError(checkoutEl, 'check-out must be after check-in.');
    valid = false;
  }

  return valid;
}

/* -----------------------------------------------------------------
   booking.html — main booking form
   Handles: date validation, add-on toggling, live total price,
   prefilling dates handed off from room-details.html, and a
   confirmation message on successful submit.
----------------------------------------------------------------- */

const ROOM_PRICES = {
  'standard room': 150,
  'deluxe room': 220,
  suite: 310
};

const ADDON_PRICES = {
  breakfast: 15,
  'airport transfer': 25,
  'late checkout': 20
};

// mirrors offers.html exactly (names + prices) so the two pages never
// drift apart. "flat" packages are a fixed total regardless of how many
// nights are booked; "rate" packages replace the room's nightly rate
// and still get multiplied by the number of nights.
const PACKAGES = {
  'three-nights-pay-two': { name: 'Three Nights, Pay For Two', flat: 300 },
  'late-riser': { name: 'The Late Riser', rate: 410 },
  'week-or-more': { name: 'A week, maybe more?', rate: 125 },
  'offseason-tranquility': { name: 'Off-season Tranquility', rate: 165 },
  'two-rooms-one-price': { name: 'Two rooms for the price of one', rate: 270 },
  'book-early-pay-less': { name: 'Book early, pay less', rate: 135 }
};

const MS_PER_NIGHT = 1000 * 60 * 60 * 24;

// number of nights between check-in/check-out. Falls back to 1 so the
// summary always shows a sane number before both dates are picked, or
// while a check-out earlier than check-in is still being corrected.
function getNightCount(checkinEl, checkoutEl) {
  const checkinDate = toDateOnly(checkinEl.value);
  const checkoutDate = toDateOnly(checkoutEl.value);
  if (!checkinDate || !checkoutDate || checkoutDate <= checkinDate) return 1;
  return Math.round((checkoutDate - checkinDate) / MS_PER_NIGHT);
}

function initBookingForm() {
  const form = document.querySelector('.js-booking-form');
  if (!form) return;

  const checkinEl = form.querySelector('.js-checkin');
  const checkoutEl = form.querySelector('.js-checkout');
  const roomtypeEl = form.querySelector('.js-roomtype');
  const totalEl = form.querySelector('.js-total-price');
  const rateSummaryEl = form.querySelector('.js-rate-summary');
  const addonButtons = form.querySelectorAll('.js-addon');
  const packageButtons = form.querySelectorAll('.js-package');
  const confirmationEl = form.querySelector('.js-booking-confirmation');

  // if someone arrived here from room-details.html's quick-booking
  // form, the dates were carried over in the query string — read them
  // back in so the visitor never has to type them a second time.
  prefillFromQueryString(checkinEl, checkoutEl, roomtypeEl);

  function updateTotal() {
    const roomKey = roomtypeEl.value.trim().toLowerCase();
    const nights = getNightCount(checkinEl, checkoutEl);

    // read the *currently selected* package straight from the DOM
    // (aria-checked) instead of tracking a separate JS variable. Two
    // sources of truth for "which package is active" is exactly what
    // was causing the price to flicker between two values on repeated
    // clicks — the DOM and the variable could disagree about which
    // button was last selected.
    const activeButton = form.querySelector('.js-package[aria-checked="true"]');
    const activePackage = activeButton ? PACKAGES[activeButton.dataset.package] : null;

    let roomCost;
    let summaryText;

    if (activePackage && activePackage.flat) {
      roomCost = activePackage.flat;
      summaryText = activePackage.name + ' — $' + activePackage.flat + ' total';
    } else {
      const nightlyRate = activePackage ? activePackage.rate : (ROOM_PRICES[roomKey] ?? 0);
      roomCost = nightlyRate * nights;
      const nightsLabel = nights === 1 ? 'night' : 'nights';
      summaryText = (activePackage ? activePackage.name + ' — ' : '') +
        '$' + nightlyRate + ' / night × ' + nights + ' ' + nightsLabel;
    }

    let addonsCost = 0;
    form.querySelectorAll('.js-addon[aria-pressed="true"]').forEach((button) => {
      const addonKey = button.textContent.trim().toLowerCase();
      addonsCost += ADDON_PRICES[addonKey] ?? 0;
    });

    totalEl.textContent = roomCost + addonsCost;
    if (rateSummaryEl) rateSummaryEl.textContent = summaryText;
  }

  // add-on chips toggle on/off and feed into the running total. Style
  // state lives on aria-pressed + the btn-primary/btn-secondary swap
  // (same pattern as everywhere else on the site) instead of a bare
  // "addon-active" class that had no matching CSS rule, so previously
  // a selected add-on changed the price but never looked selected.
  addonButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const isActive = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(isActive));
      button.classList.toggle('btn-primary', isActive);
      button.classList.toggle('btn-secondary', !isActive);
      updateTotal();
    });
  });

  // package chips are single-select (radio behaviour): every click
  // walks the *whole* group and explicitly sets each button's state
  // relative to the one just clicked, so exactly one is ever active.
  // clicking the already-active package again simply leaves it active
  // instead of toggling it off into an undefined in-between state.
  packageButtons.forEach((button) => {
    button.addEventListener('click', () => {
      packageButtons.forEach((otherButton) => {
        const isSelected = otherButton === button;
        otherButton.setAttribute('aria-checked', String(isSelected));
        otherButton.classList.toggle('btn-primary', isSelected);
        otherButton.classList.toggle('btn-secondary', !isSelected);
      });
      updateTotal();
    });
  });

  roomtypeEl.addEventListener('change', updateTotal);
  // dates weren't wired to the total at all before — the summary
  // never reacted to a check-in/check-out change, which is the root
  // cause of "the total only ever showed one day's price."
  checkinEl.addEventListener('change', updateTotal);
  checkoutEl.addEventListener('change', updateTotal);

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (confirmationEl) {
      confirmationEl.textContent = '';
      confirmationEl.classList.remove('visible');
    }

    const datesValid = validateStayDates(checkinEl, checkoutEl);
    if (!datesValid) {
      const firstError = form.querySelector('.field-error');
      if (firstError) firstError.focus();
      return;
    }

    if (confirmationEl) {
      confirmationEl.textContent = 'booking request received — a confirmation email is on its way.';
      confirmationEl.classList.add('visible');
    }

    form.reset();
    addonButtons.forEach((button) => {
      button.setAttribute('aria-pressed', 'false');
      button.classList.remove('btn-primary');
      button.classList.add('btn-secondary');
    });
    packageButtons.forEach((button) => {
      button.setAttribute('aria-checked', 'false');
      button.classList.remove('btn-primary');
      button.classList.add('btn-secondary');
    });
    updateTotal();
  });

  updateTotal();
}

function prefillFromQueryString(checkinEl, checkoutEl, roomtypeEl) {
  const params = new URLSearchParams(window.location.search);
  const paramCheckin = params.get('checkin');
  const paramCheckout = params.get('checkout');
  const paramGuests = params.get('guests');
  const paramRoomtype = params.get('roomtype');
  const guestsEl = document.querySelector('.js-booking-form .js-guests');

  if (paramCheckin && ISO_DATE_PATTERN.test(paramCheckin)) {
    checkinEl.value = paramCheckin;
  }

  if (paramCheckout && ISO_DATE_PATTERN.test(paramCheckout)) {
    checkoutEl.value = paramCheckout;
  }

  // roomtype comes from room-details.html's tab data-room values
  // (standard/deluxe/suite) but the <select> options are full labels
  // ("Standard Room", "Deluxe Room", "Suite") — map between them.
  // NOTE: setting select.value is case-sensitive against the option
  // text, so these must match the <option> labels in booking.html
  // exactly. They previously used all-lowercase labels, which only
  // "worked" for Standard Room because it happens to be the first
  // (default) option anyway — picking Deluxe or Suite on
  // room-details.html silently reset to Standard Room here.
  const ROOM_KEY_TO_LABEL = {
    standard: 'Standard Room',
    deluxe: 'Deluxe Room',
    suite: 'Suite'
  };

  if (paramRoomtype && ROOM_KEY_TO_LABEL[paramRoomtype]) {
    roomtypeEl.value = ROOM_KEY_TO_LABEL[paramRoomtype];
  }

  const GUEST_KEY_TO_LABEL = {
    '1': '1 adult',
    '2': '2 adults',
    '3': '3 adults',
    family: 'family'
  };

  if (guestsEl && paramGuests && GUEST_KEY_TO_LABEL[paramGuests]) {
    guestsEl.value = GUEST_KEY_TO_LABEL[paramGuests];
  }
}

/* -----------------------------------------------------------------
   room-details.html — quick-booking widget in the sidebar card
   Validates the same way as the main booking form, then hands the
   dates off to booking.html via the query string so they don't need
   to be re-typed on the next page.
----------------------------------------------------------------- */

function initRoomDetailsForm() {
  const form = document.querySelector('.js-room-booking-form');
  if (!form) return;

  const checkinEl = form.querySelector('.js-checkin');
  const checkoutEl = form.querySelector('.js-checkout');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const datesValid = validateStayDates(checkinEl, checkoutEl);
    if (!datesValid) {
      const firstError = form.querySelector('.field-error');
      if (firstError) firstError.focus();
      return;
    }

    const activeTab = document.querySelector('.js-room-tab[aria-selected="true"]');
    const roomKey = activeTab ? activeTab.dataset.room : 'standard';

    const params = new URLSearchParams({
      checkin: checkinEl.value,
      checkout: checkoutEl.value,
      roomtype: roomKey
    });
    window.location.href = `booking.html?${params.toString()}`;
  });
}



/* -----------------------------------------------------------------
   room-details.html — room data
   One entry per room type, keyed to match each tab's data-room
   value. Used to rebuild the page content when a tab is clicked.
----------------------------------------------------------------- */

const ROOMS = {
  standard: {
    name: 'Chambre Standard',
    price: '$150 / night',
    // room-standard-main.jpg doesn't exist yet — reusing the rooms.html
    // card photo as a stopgap until a dedicated detail photo is sourced
    photo: 'images/room-standard.jpg',
    photoAlt: 'Standard Room main view',
    thumbs: [
      { src: 'images/room-standard-1.jpg', alt: 'Standard Room detail photo 1' },
      { src: 'images/room-standard-2.jpg', alt: 'Standard Room detail photo 2' },
      { src: 'images/room-standard-3.jpg', alt: 'Standard Room detail photo 3' },
      { src: 'images/room-standard-4.jpg', alt: 'Standard Room detail photo 4' }
    ],
    blurb: 'A queen bed, views of the city, 26 sqm — a compact, sunlit room kept simple: clean lines, warm materials, and a palette that stays out of the way of a good night\'s rest. quiet enough to work in, comfortable enough to do nothing at all.',
    specs: [
      { icon: 'm²', label: '26 sqm' },
      { icon: 'bed', label: 'queen bed' },
      { icon: '2', label: 'sleeps 2' },
      { icon: '~', label: 'city view' }
    ],
    amenities: [
      { icon: 'wifi', label: 'free high-speed wifi' },
      { icon: 'ac', label: 'air conditioning' },
      { icon: 'tv', label: 'smart tv' },
      { icon: 'cup', label: 'coffee & tea station' }
    ]
  },
  deluxe: {
    name: 'Chambre Deluxe',
    price: '$220 / night',
    // room-deluxe-main.jpg doesn't exist yet — reusing the rooms.html
    // card photo as a stopgap until a dedicated detail photo is sourced
    photo: 'images/room-deluxe.jpg',
    photoAlt: 'Deluxe Room main view',
    thumbs: [
      { src: 'images/room-deluxe-1.jpg', alt: 'Deluxe Room detail photo 1' },
      { src: 'images/room-deluxe-2.jpg', alt: 'Deluxe Room detail photo 2' },
      { src: 'images/room-deluxe-3.jpg', alt: 'Deluxe Room detail photo 3' },
      { src: 'images/room-deluxe-4.jpg', alt: 'Deluxe Room detail photo 4' }
    ],
    blurb: 'A bed fit for a king, a balcony view overlooking the city, 32 sqm — more space, a little more light, and a balcony to take the morning coffee outside.',
    specs: [
      { icon: 'm²', label: '32 sqm' },
      { icon: 'bed', label: 'king bed' },
      { icon: '2', label: 'sleeps 2' },
      { icon: '~', label: 'balcony view' }
    ],
    amenities: [
      { icon: 'wifi', label: 'free high-speed wifi' },
      { icon: 'ac', label: 'air conditioning' },
      { icon: 'tv', label: 'smart tv' },
      { icon: 'bar', label: 'minibar' }
    ]
  },
  suite: {
    name: 'Suite',
    price: '$310 / night',
    // room-suite-main.jpg doesn't exist yet — reusing the rooms.html
    // card photo as a stopgap until a dedicated detail photo is sourced
    photo: 'images/room-suite.jpg',
    photoAlt: 'Suite main view',
    thumbs: [
      { src: 'images/room-suite-1.jpg', alt: 'Suite detail photo 1' },
      { src: 'images/room-suite-2.jpg', alt: 'Suite detail photo 2' },
      { src: 'images/room-suite-3.jpg', alt: 'Suite detail photo 3' },
      { src: 'images/room-suite-4.jpg', alt: 'Suite detail photo 4' }
    ],
    blurb: 'A room fit for a party, 45 sqm — the most room to spread out and settle in, with a lounge area kept apart from the bed and a jacuzzi in the bathroom.',
    specs: [
      { icon: 'm²', label: '45 sqm' },
      { icon: 'bed', label: 'king bed' },
      { icon: '5', label: 'sleeps 5' },
      { icon: '~', label: 'lounge area and jacuzzi' }
    ],
    amenities: [
      { icon: 'wifi', label: 'free high-speed wifi' },
      { icon: 'ac', label: 'air conditioning' },
      { icon: 'tv', label: 'smart tv' },
      { icon: 'bar', label: 'minibar & lounge' }
    ]
  }
};

/* -----------------------------------------------------------------
   room-details.html — room selector tabs
   Same active/inactive class-swap pattern as gallery.js's filter
   buttons, plus a content rebuild: title, price, photo, blurb,
   specs, amenities, and the CTA card all update to match the
   selected room, built with createElement/textContent (no innerHTML,
   same convention as the rest of this file).
----------------------------------------------------------------- */

function initRoomTabs() {
  const tabs = document.querySelectorAll('.js-room-tab');
  if (tabs.length === 0) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();

      const selectedRoom = tab.dataset.room;
      setActiveRoomTab(selectedRoom);
      updateRoomContent(selectedRoom);
    });
  });
}

// swaps which tab looks selected — split out from the click handler
// so the initial page load (driven by the ?room= query param) can
// activate the right tab too, not just clicks
function setActiveRoomTab(roomKey) {
  const tabs = document.querySelectorAll('.js-room-tab');

  tabs.forEach((tab) => {
    const isSelected = tab.dataset.room === roomKey;
    tab.setAttribute('aria-selected', String(isSelected));
    tab.classList.toggle('btn-primary', isSelected);
    tab.classList.toggle('btn-secondary', !isSelected);
  });
}

function updateRoomContent(roomKey) {
  const room = ROOMS[roomKey];
  if (!room) return;

  const titleEl = document.querySelector('.js-room-title');
  const priceEl = document.querySelector('.js-room-price');
  const photoEl = document.querySelector('.js-room-photo');
  const blurbEl = document.querySelector('.js-room-blurb');
  const ctaTitleEl = document.querySelector('.js-room-cta-title');
  const specsEl = document.querySelector('.js-room-specs');
  const amenitiesEl = document.querySelector('.js-room-amenities');

  if (titleEl) titleEl.textContent = room.name;
  if (priceEl) priceEl.textContent = room.price;
  if (photoEl) {
    photoEl.src = room.photo;
    photoEl.alt = room.photoAlt;
  }
  if (blurbEl) blurbEl.textContent = room.blurb;
  if (ctaTitleEl) ctaTitleEl.textContent = 'book: ' + room.name;

  const thumbEls = document.querySelectorAll('.js-room-thumb');
  if (thumbEls.length && room.thumbs) {
    thumbEls.forEach((imgEl, index) => {
      const thumb = room.thumbs[index];
      if (!thumb) return;
      imgEl.src = thumb.src;
      imgEl.alt = thumb.alt;
    });
  }

  if (specsEl) {
    specsEl.textContent = '';
    room.specs.forEach((spec) => {
      const wrap = document.createElement('div');
      wrap.className = 'text-center space-y-2';

      const iconBox = document.createElement('div');
      iconBox.className = 'w-11 h-11 mx-auto rounded-xl bg-navytint text-navy flex items-center justify-center text-sm font-semibold';
      iconBox.textContent = spec.icon;

      const label = document.createElement('p');
      label.className = 'text-xs text-stone';
      label.textContent = spec.label;

      wrap.append(iconBox, label);
      specsEl.appendChild(wrap);
    });
  }

  if (amenitiesEl) {
    amenitiesEl.textContent = '';
    room.amenities.forEach((amenity) => {
      const wrap = document.createElement('div');
      wrap.className = 'bg-surface border border-border rounded-lg px-4 py-3 flex items-center gap-3';

      const iconBox = document.createElement('div');
      iconBox.className = 'w-8 h-8 rounded-full bg-navytint text-navy text-xs flex items-center justify-center font-semibold shrink-0';
      iconBox.textContent = amenity.icon;

      const label = document.createElement('span');
      label.className = 'text-sm';
      label.textContent = amenity.label;

      wrap.append(iconBox, label);
      amenitiesEl.appendChild(wrap);
    });
  }
}

/* -----------------------------------------------------------------
   room-details.html — initial room from query string
   If the visitor arrived via a "view details" link from rooms.html
   (?room=deluxe), load that room's content on page load instead of
   defaulting to whatever's hardcoded in the HTML. Falls back to
   "standard" if the param is missing or doesn't match a real room.
----------------------------------------------------------------- */

function initRoomFromQueryString() {
  const tabs = document.querySelectorAll('.js-room-tab');
  if (tabs.length === 0) return;

  const params = new URLSearchParams(window.location.search);
  const paramRoom = params.get('room');
  const roomKey = ROOMS[paramRoom] ? paramRoom : 'standard';

  setActiveRoomTab(roomKey);
  updateRoomContent(roomKey);
}



/* -----------------------------------------------------------------
   rooms.html — room cards
   No form on this page, but clicking "view details" remembers which
   room was picked so room-details.html could read it back later.
----------------------------------------------------------------- */

function initRoomCardLinks() {
  const detailLinks = document.querySelectorAll('.js-view-details');
  if (detailLinks.length === 0) return;

  detailLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const card = link.closest('.js-room-card');
      const nameEl = card ? card.querySelector('.js-room-name') : null;
      if (nameEl) {
        sessionStorage.setItem('selectedRoom', nameEl.textContent.trim());
      }
    });
  });
}