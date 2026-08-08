// js for the home page - quick booking widget validation and smooth anchor scrolling.
// checks: both dates are filled in, and check-out is after check-in.

(function () {
  var form = document.getElementById('booking-form');
  if (form) {
    var checkin = document.getElementById('checkin');
    var checkout = document.getElementById('checkout');
    var status = document.getElementById('booking-status');

    function setError(field, hasError) {
      var msg = field.parentElement.querySelector('.field-error-msg');
      field.classList.toggle('field-error', hasError);
      if (msg) {
        msg.classList.toggle('visible', hasError);
      }
      return hasError;
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
          checkout: checkout.value
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
