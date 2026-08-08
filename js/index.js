// js for the home page - quick booking widget validation and smooth anchor scrolling.
// checks: both dates are filled in, and check-out is after check-in.

(function () {
  var form = document.getElementById('booking-form');
  if (form) {
    var checkin = document.getElementById('checkin');
    var checkout = document.getElementById('checkout');
    var guests = document.getElementById('guests');
    var roomtype = document.getElementById('roomtype');
    var status = document.getElementById('booking-status');
    var ROOM_CAPACITY = {
      standard: 2,
      deluxe: 3,
      suite: 5
    };

    function setError(field, hasError) {
      var msg = field.parentElement.querySelector('.field-error-msg');
      field.classList.toggle('field-error', hasError);
      if (msg) {
        msg.classList.toggle('visible', hasError);
      }
      return hasError;
    }

    function getGuestCount(guestValue) {
      if (guestValue === 'family') return 4;
      return Number(guestValue) || 0;
    }

    function syncRoomOptionsWithGuests() {
      if (!guests || !roomtype) return;

      var selectedGuests = getGuestCount(guests.value);

      Array.prototype.forEach.call(roomtype.options, function (option) {
        if (option.value === 'any') {
          option.disabled = false;
          return;
        }

        var capacity = ROOM_CAPACITY[option.value] || 0;
        option.disabled = selectedGuests > capacity;
      });

      var selectedRoomOption = roomtype.options[roomtype.selectedIndex];
      if (selectedRoomOption && selectedRoomOption.disabled) {
        roomtype.value = 'any';
      }
    }

    function syncGuestOptionsWithRoom() {
      if (!guests || !roomtype) return;

      var selectedRoom = roomtype.value;
      var selectedCapacity = ROOM_CAPACITY[selectedRoom];

      Array.prototype.forEach.call(guests.options, function (option) {
        var guestCount = getGuestCount(option.value);
        option.disabled = selectedCapacity ? guestCount > selectedCapacity : false;
      });

      var selectedGuestOption = guests.options[guests.selectedIndex];
      if (selectedGuestOption && selectedGuestOption.disabled) {
        Array.prototype.some.call(guests.options, function (option) {
          if (!option.disabled) {
            guests.value = option.value;
            return true;
          }
          return false;
        });
      }
    }

    if (guests && roomtype) {
      guests.addEventListener('change', function () {
        syncRoomOptionsWithGuests();
      });

      roomtype.addEventListener('change', function () {
        syncGuestOptionsWithRoom();
      });

      syncGuestOptionsWithRoom();
      syncRoomOptionsWithGuests();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var checkinMissing = setError(checkin, checkin.value === '');

      // checkout is invalid if it's empty, or not after checkin
      var checkoutInvalid =
        checkout.value === '' ||
        (checkin.value !== '' && checkout.value <= checkin.value);
      setError(checkout, checkoutInvalid);

      var isValid = !checkinMissing && !checkoutInvalid;

      if (isValid) {
        var params = new URLSearchParams({
          checkin: checkin.value,
          checkout: checkout.value,
          guests: guests ? guests.value : '',
          roomtype: roomtype ? roomtype.value : 'any'
        });
        window.location.href = 'booking.html?' + params.toString();
      } else {
        status.classList.add('hidden');
      }
    });
  }

  // Smooth scrolling for same-page anchor links (e.g., hero "Check Availability").
  // Intercepts clicks on links with href starting with '#' and scrolls smoothly to target.
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = anchor.getAttribute('href');
      // If it's just '#', allow native behavior.
      if (!href || href === '#') return;

      var targetId = href.slice(1);
      var targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        // Use native smooth scrolling; respects CSS scroll-margin if defined.
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update the URL hash without jumping.
        if (history.pushState) {
          history.pushState(null, '', '#' + targetId);
        } else {
          // Fallback: set location.hash but this may jump in some browsers.
          location.hash = '#' + targetId;
        }
      }
    });
  });
})();
