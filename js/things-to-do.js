// js for the things to do page.
// clicking a pin on the map highlights the matching row in the list
// (and the other way round), matched up using the shared data-loc
// attribute on both.

(function () {
  var pins = document.querySelectorAll('.map-pin');
  var items = document.querySelectorAll('.location-item');

  function selectLocation(locId) {
    pins.forEach(function (pin) {
      pin.classList.toggle('active', pin.dataset.loc === locId);
    });
    items.forEach(function (item) {
      item.classList.toggle('active', item.dataset.loc === locId);
    });
  }

  pins.forEach(function (pin) {
    pin.addEventListener('click', function () {
      selectLocation(pin.dataset.loc);
    });
  });

  items.forEach(function (item) {
    item.addEventListener('click', function () {
      selectLocation(item.dataset.loc);
    });
  });
})();
