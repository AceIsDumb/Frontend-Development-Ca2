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

// keys here match the data-room attributes on booking.html's <option>s
// and the data-room tab values on room-details.html, so nothing depends
// on the visible label text any more. Renaming a label to add French
// can no longer silently make a room cost $0.
const ROOM_PRICES = {
  standard: 150,
  deluxe: 220,
  suite: 310
};

// perNight decides whether an add-on is multiplied by the stay length.
// breakfast is eaten every morning; a transfer and a late checkout each
// happen once per stay.
const ADDON_PRICES = {
  breakfast: { label: 'Breakfast', price: 15, perNight: true },
  transfer: { label: 'Airport Transfer', price: 25, perNight: false },
  'late-checkout': { label: 'Late Checkout', price: 20, perNight: false }
};

/* Package rules, mirroring the wording on offers.html.

   rates      per-room-class nightly rate the package replaces the
              normal rate with. Listing every eligible class is what
              keeps the room type meaningful — previously one flat
              package rate applied to every room, so a Suite on a
              long-stay deal came out cheaper than a Standard Room at
              the normal rate.
   rooms      which room classes the deal is valid for. Anything not
              listed gets disabled in the dropdown while the package
              is selected, instead of being silently mispriced.
   freeNight  "one night free for every N booked". Charges the room's
              OWN rate for the nights that aren't free, so the deal
              scales with both the room class and the stay length.
   minNights  the deal doesn't apply below this. minAheadDays is the
              same idea for advance-purchase deals.
   includes   add-ons the package already covers. These get switched
              on, locked, and charged at $0 so they can't be billed
              twice.
   guests     preselected guest count, where the deal implies one.
   roomCount  how many rooms the nightly rate covers (the family deal
              is two adjoining rooms at one combined rate). */
const PACKAGES = {
  'three-nights-pay-two': {
    name: 'Three Nights, Pay For Two',
    rooms: ['standard', 'deluxe', 'suite'],
    freeNightEvery: 3,
    minNights: 3,
    suggestedNights: 3,
    suggestedRoom: 'standard',
    includes: []
  },
  'late-riser': {
    name: 'The Late Riser',
    rooms: ['suite'],
    rates: { suite: 410 },
    minNights: 1,
    suggestedNights: 2,
    suggestedRoom: 'suite',
    guests: '2',
    includes: ['breakfast', 'late-checkout']
  },
  'week-or-more': {
    name: 'A week, maybe more?',
    rooms: ['standard', 'deluxe', 'suite'],
    rates: { standard: 125, deluxe: 185, suite: 260 },
    minNights: 7,
    suggestedNights: 7,
    suggestedRoom: 'standard',
    includes: []
  },
  'offseason-tranquility': {
    name: 'Off-season Tranquility',
    rooms: ['deluxe', 'suite'],
    rates: { deluxe: 165, suite: 235 },
    minNights: 1,
    suggestedNights: 3,
    suggestedRoom: 'deluxe',
    includes: []
  },
  'two-rooms-one-price': {
    name: 'Two rooms for the price of one',
    rooms: ['standard', 'deluxe'],
    rates: { standard: 270, deluxe: 380 },
    minNights: 1,
    suggestedNights: 2,
    suggestedRoom: 'standard',
    guests: 'family',
    roomCount: 2,
    includes: ['breakfast']
  },
  'book-early-pay-less': {
    name: 'book early, pay less',
    rooms: ['standard', 'deluxe', 'suite'],
    rates: { standard: 135, deluxe: 200, suite: 280 },
    minNights: 1,
    suggestedNights: 2,
    suggestedRoom: 'standard',
    minAheadDays: 60,
    includes: []
  }
};

const MS_PER_NIGHT = 1000 * 60 * 60 * 24;

// null when the dates aren't usable yet, so the caller can show
// "select your dates" instead of inventing a price. The old version
// returned 1 as a fallback, which is why a firm $150 total appeared
// on a form nobody had filled in.
function getNightCount(checkinEl, checkoutEl) {
  const checkinDate = toDateOnly(checkinEl.value);
  const checkoutDate = toDateOnly(checkoutEl.value);
  if (!checkinDate || !checkoutDate || checkoutDate <= checkinDate) return null;
  return Math.round((checkoutDate - checkinDate) / MS_PER_NIGHT);
}

// today at midnight, so date maths never trips over the current time
function startOfToday() {
  return toDateOnly(new Date().toISOString().slice(0, 10));
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_NIGHT);
}

// how many whole days from today until a check-in date
function daysUntil(dateValue) {
  const target = toDateOnly(dateValue);
  if (!target) return null;
  return Math.round((target - startOfToday()) / MS_PER_NIGHT);
}

// the room class currently chosen, read from data-room rather than the
// option's visible text
function getSelectedRoomKey(roomtypeEl) {
  const option = roomtypeEl.options[roomtypeEl.selectedIndex];
  return option ? option.dataset.room : null;
}

// what one night costs, given the room and any active package
function getNightlyRate(roomKey, activePackage) {
  if (activePackage && activePackage.rates) {
    return activePackage.rates[roomKey] ?? ROOM_PRICES[roomKey] ?? 0;
  }
  return ROOM_PRICES[roomKey] ?? 0;
}

/**
 * Checks a package's own conditions against the current form state.
 * Returns { ok, message } — message explains the first unmet rule so
 * the same text can be shown to the visitor and used to block submit.
 */
function checkPackageConditions(activePackage, nights, checkinValue) {
  if (!activePackage) return { ok: true, message: '' };

  if (nights !== null && activePackage.minNights && nights < activePackage.minNights) {
    return {
      ok: false,
      message: `${activePackage.name} needs at least ${activePackage.minNights} nights — you have ${nights}.`
    };
  }

  if (activePackage.minAheadDays) {
    const ahead = daysUntil(checkinValue);
    if (ahead !== null && ahead < activePackage.minAheadDays) {
      return {
        ok: false,
        message: `${activePackage.name} must be booked at least ${activePackage.minAheadDays} days ahead — this check-in is ${ahead} days away.`
      };
    }
  }

  return { ok: true, message: '' };
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

  const noteEl = form.querySelector('.js-package-note');
  const guestsEl = form.querySelector('.js-guests');

  // if someone arrived here from room-details.html's quick-booking
  // form, or from a "Book Now" button on offers.html, the details were
  // carried over in the query string — read them back in so nothing
  // has to be typed a second time.
  prefillFromQueryString(checkinEl, checkoutEl, roomtypeEl);

  function getActivePackage() {
    const activeButton = form.querySelector('.js-package[aria-checked="true"]');
    return activeButton ? PACKAGES[activeButton.dataset.package] ?? null : null;
  }

  function updateTotal() {
    const roomKey = getSelectedRoomKey(roomtypeEl);
    const nights = getNightCount(checkinEl, checkoutEl);
    const activePackage = getActivePackage();
    const conditions = checkPackageConditions(activePackage, nights, checkinEl.value);

    // a package whose conditions aren't met is NOT applied — the price
    // shown always matches the rules being described underneath it
    const packageApplies = activePackage !== null && conditions.ok;
    const appliedPackage = packageApplies ? activePackage : null;

    if (noteEl) {
      noteEl.textContent = conditions.ok ? '' : conditions.message;
      noteEl.classList.toggle('text-navy', conditions.ok);
    }

    // no usable dates yet: say so rather than quoting a number
    if (nights === null) {
      totalEl.textContent = '—';
      rateSummaryEl.textContent = 'select your dates to see a price';
      return;
    }

    const nightlyRate = getNightlyRate(roomKey, appliedPackage);
    const nightsLabel = nights === 1 ? 'night' : 'nights';
    let roomCost;
    let summaryText;

    if (appliedPackage && appliedPackage.freeNightEvery) {
      // one free night for every N booked, charged at this room's own
      // rate — so the saving grows with the stay and scales with the
      // room class instead of being a single hardcoded total
      const freeNights = Math.floor(nights / appliedPackage.freeNightEvery);
      const chargedNights = nights - freeNights;
      roomCost = nightlyRate * chargedNights;
      summaryText = `${appliedPackage.name} — $${nightlyRate} / night × ${chargedNights} of ${nights} ${nightsLabel} (${freeNights} free)`;
    } else {
      const roomCount = appliedPackage ? appliedPackage.roomCount ?? 1 : 1;
      roomCost = nightlyRate * nights;
      const roomsLabel = roomCount > 1 ? ` (${roomCount} rooms)` : '';
      summaryText = `${appliedPackage ? appliedPackage.name + ' — ' : ''}$${nightlyRate} / night${roomsLabel} × ${nights} ${nightsLabel}`;
    }

    // add-ons the package already covers are charged at $0 rather than
    // being added on top of a rate that includes them
    const included = appliedPackage ? appliedPackage.includes : [];
    let addonsCost = 0;

    form.querySelectorAll('.js-addon[aria-pressed="true"]').forEach((button) => {
      const addonKey = button.dataset.addon;
      const addon = ADDON_PRICES[addonKey];
      if (!addon || included.includes(addonKey)) return;
      addonsCost += addon.perNight ? addon.price * nights : addon.price;
    });

    totalEl.textContent = roomCost + addonsCost;
    rateSummaryEl.textContent = summaryText;
  }

  /* Applies a package's own rules to the rest of the form: locks the
     room dropdown to the classes the deal is valid for, preselects the
     room and guest count it implies, stretches the dates to meet the
     minimum stay, and switches on whatever the deal already includes. */
  function applyPackageToForm(activePackage) {
    // room dropdown: re-enable everything, then disable what this
    // package doesn't cover so an invalid combination can't be picked
    Array.from(roomtypeEl.options).forEach((option) => {
      const eligible = !activePackage || activePackage.rooms.includes(option.dataset.room);
      option.disabled = !eligible;
    });

    if (activePackage) {
      // keep the visitor's own room choice when the deal allows it,
      // otherwise move to the one the deal is written around
      const currentRoom = getSelectedRoomKey(roomtypeEl);
      if (!activePackage.rooms.includes(currentRoom)) {
        const target = Array.from(roomtypeEl.options)
          .find((option) => option.dataset.room === activePackage.suggestedRoom);
        if (target) roomtypeEl.value = target.value;
      }

      if (activePackage.guests && guestsEl) {
        const guestOption = Array.from(guestsEl.options)
          .find((option) => option.dataset.guests === activePackage.guests);
        if (guestOption) guestsEl.value = guestOption.value;
      }

      // dates: only touched when they're missing or too short for the
      // deal, so a stay the visitor has already chosen is never
      // quietly overwritten with something else
      const nights = getNightCount(checkinEl, checkoutEl);
      const minNights = activePackage.minNights ?? 1;
      const wantedNights = Math.max(activePackage.suggestedNights ?? minNights, minNights);
      const earliestCheckin = addDays(startOfToday(), activePackage.minAheadDays ?? 0);

      let checkinDate = toDateOnly(checkinEl.value);
      if (!checkinDate || checkinDate < earliestCheckin) {
        checkinDate = earliestCheckin;
        checkinEl.value = toIsoDate(checkinDate);
      }

      if (nights === null || nights < minNights) {
        checkoutEl.value = toIsoDate(addDays(checkinDate, wantedNights));
      }

      clearFieldError(checkinEl);
      clearFieldError(checkoutEl);

      // included add-ons: on, locked, and priced at $0
      addonButtons.forEach((button) => {
        const isIncluded = activePackage.includes.includes(button.dataset.addon);
        if (isIncluded) {
          button.setAttribute('aria-pressed', 'true');
          button.classList.add('btn-primary');
          button.classList.remove('btn-secondary');
        }
        button.disabled = isIncluded;
        button.title = isIncluded ? 'included with this package' : '';
      });
    } else {
      // back to the standard rate: unlock every add-on again
      addonButtons.forEach((button) => {
        button.disabled = false;
        button.title = '';
      });
    }
  }

  // add-on chips toggle on/off and feed into the running total
  addonButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      const isActive = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(isActive));
      button.classList.toggle('btn-primary', isActive);
      button.classList.toggle('btn-secondary', !isActive);
      updateTotal();
    });
  });

  // package chips are single-select (radio behaviour): every click
  // walks the whole group and sets each button's state relative to the
  // one just clicked, so exactly one is ever active.
  packageButtons.forEach((button) => {
    button.addEventListener('click', () => {
      packageButtons.forEach((otherButton) => {
        const isSelected = otherButton === button;
        otherButton.setAttribute('aria-checked', String(isSelected));
        otherButton.classList.toggle('btn-primary', isSelected);
        otherButton.classList.toggle('btn-secondary', !isSelected);
      });
      applyPackageToForm(getActivePackage());
      updateTotal();
    });
  });

  roomtypeEl.addEventListener('change', updateTotal);
  if (guestsEl) guestsEl.addEventListener('change', updateTotal);
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

    // a package with unmet conditions blocks the booking, so nobody can
    // submit a deal they don't qualify for
    const nights = getNightCount(checkinEl, checkoutEl);
    const conditions = checkPackageConditions(getActivePackage(), nights, checkinEl.value);
    if (!conditions.ok) {
      showFieldError(checkoutEl, conditions.message);
      checkoutEl.focus();
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
      button.disabled = false;
      button.title = '';
    });
    // "Standard rate" is the default, so it goes back to being the
    // selected chip — previously a reset left every package chip
    // deselected, including that one
    packageButtons.forEach((button) => {
      const isDefault = button.dataset.package === 'none';
      button.setAttribute('aria-checked', String(isDefault));
      button.classList.toggle('btn-primary', isDefault);
      button.classList.toggle('btn-secondary', !isDefault);
    });
    Array.from(roomtypeEl.options).forEach((option) => { option.disabled = false; });
    if (noteEl) noteEl.textContent = '';
    updateTotal();
  });

  // a package handed over in the query string needs the same treatment
  // as one clicked by hand
  applyPackageToForm(getActivePackage());
  updateTotal();
}

function prefillFromQueryString(checkinEl, checkoutEl, roomtypeEl) {
  // a package slug handed over from offers.html's "Book Now" buttons.
  // Selecting the matching chip here means applyPackageToForm() and
  // updateTotal() then treat it exactly like a hand-clicked package.
  const paramPackage = new URLSearchParams(window.location.search).get('package');
  if (paramPackage && PACKAGES[paramPackage]) {
    document.querySelectorAll('.js-booking-form .js-package').forEach((button) => {
      const isSelected = button.dataset.package === paramPackage;
      button.setAttribute('aria-checked', String(isSelected));
      button.classList.toggle('btn-primary', isSelected);
      button.classList.toggle('btn-secondary', !isSelected);
    });
  }

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
  // room-details.html hands over short keys (standard/deluxe/suite);
  // find the <option> carrying that data-room rather than matching on
  // the visible label, which breaks the moment a label is reworded
  const roomOption = paramRoomtype
    ? Array.from(roomtypeEl.options).find((option) => option.dataset.room === paramRoomtype)
    : null;

  if (roomOption) {
    roomtypeEl.value = roomOption.value;
  }

  const guestOption = guestsEl && paramGuests
    ? Array.from(guestsEl.options).find((option) => option.dataset.guests === paramGuests)
    : null;

  if (guestOption) {
    guestsEl.value = guestOption.value;
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