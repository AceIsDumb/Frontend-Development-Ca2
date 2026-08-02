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

function initBookingForm() {
  const form = document.querySelector('.js-booking-form');
  if (!form) return;

  const checkinEl = form.querySelector('.js-checkin');
  const checkoutEl = form.querySelector('.js-checkout');
  const roomtypeEl = form.querySelector('.js-roomtype');
  const totalEl = form.querySelector('.js-total-price');
  const addonButtons = form.querySelectorAll('.js-addon');
  const confirmationEl = form.querySelector('.js-booking-confirmation');

  // if someone arrived here from room-details.html's quick-booking
  // form, the dates were carried over in the query string — read them
  // back in so the visitor never has to type them a second time.
  prefillDatesFromQueryString(checkinEl, checkoutEl);

  function updateTotal() {
    const roomKey = roomtypeEl.value.trim().toLowerCase();
    let total = ROOM_PRICES[roomKey] ?? 0;

    form.querySelectorAll('.js-addon.addon-active').forEach((button) => {
      const addonKey = button.textContent.trim().toLowerCase();
      total += ADDON_PRICES[addonKey] ?? 0;
    });

    totalEl.textContent = total;
  }

  // add-on chips toggle on/off and feed into the running total
  addonButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const isActive = button.classList.toggle('addon-active');
      button.setAttribute('aria-pressed', String(isActive));
      updateTotal();
    });
  });

  roomtypeEl.addEventListener('change', updateTotal);

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
      button.classList.remove('addon-active');
      button.setAttribute('aria-pressed', 'false');
    });
    updateTotal();
  });

  updateTotal();
}

function prefillDatesFromQueryString(checkinEl, checkoutEl) {
  const params = new URLSearchParams(window.location.search);
  const paramCheckin = params.get('checkin');
  const paramCheckout = params.get('checkout');

  if (paramCheckin && ISO_DATE_PATTERN.test(paramCheckin)) {
    checkinEl.value = paramCheckin;
  }

  if (paramCheckout && ISO_DATE_PATTERN.test(paramCheckout)) {
    checkoutEl.value = paramCheckout;
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

    const params = new URLSearchParams({
      checkin: checkinEl.value,
      checkout: checkoutEl.value
    });
    window.location.href = `booking.html?${params.toString()}`;
  });
}

/* -----------------------------------------------------------------
   room-details.html — room selector tabs
   Identical pattern to gallery.js's filter buttons: loop every tab,
   compare it against the one that was clicked, and swap the same
   btn-primary / btn-secondary classes used everywhere else on the
   site — no separate tab-only CSS needed.

   WORK IN PROGRESS: this only handles which tab *looks* selected.
   Swapping the gallery photos, specs, amenities and price to match
   the chosen room still needs to be wired up — see the TODO below.
----------------------------------------------------------------- */

function initRoomTabs() {
  const tabs = document.querySelectorAll('.js-room-tab');
  if (tabs.length === 0) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();

      const selectedRoom = tab.dataset.room;

      tabs.forEach((otherTab) => {
        const isSelected = otherTab === tab;
        otherTab.setAttribute('aria-selected', String(isSelected));
        otherTab.classList.toggle('btn-primary', isSelected);
        otherTab.classList.toggle('btn-secondary', !isSelected);
      });

      // TODO: once each room type has its own data (photos, specs,
      // price, amenities), look it up here using `selectedRoom` and
      // update the page content instead of stopping at tab styling.
      void selectedRoom;
    });
  });
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