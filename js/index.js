// js for the home page - just the quick booking widget validation.
// checks: both dates are filled in, and check-out is after check-in.

(function () {
  var form = document.getElementById('booking-form');
  if (!form) {
    return;
  }

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
      status.textContent = 'looks good — availability search would run here.';
      status.classList.remove('hidden');
    } else {
      status.classList.add('hidden');
    }
  });
})();
