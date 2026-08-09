// js for the things to do page.
// clicking a pin on the map highlights the matching row in the list
// (and the other way round), matched up using the shared data-loc
// attribute on both.

(function () {
  var pins = document.querySelectorAll('.map-pin');
  var items = document.querySelectorAll('.location-item');
  var spotCards = document.querySelectorAll('.ttd-spot-card[data-loc]');
  var selectedLocId = null;
  var hoveredLocId = null;

  function renderSelection() {
    var activeLocId = hoveredLocId || selectedLocId;

    pins.forEach(function (pin) {
      pin.classList.toggle('active', !!activeLocId && pin.dataset.loc === activeLocId);
    });

    items.forEach(function (item) {
      item.classList.toggle('active', !!activeLocId && item.dataset.loc === activeLocId);
    });
  }

  function selectLocation(locId) {
    selectedLocId = locId;
    renderSelection();
  }

  function setHoveredLocation(locId) {
    hoveredLocId = locId;
    renderSelection();
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

  spotCards.forEach(function (card) {
    card.addEventListener('mouseenter', function () {
      setHoveredLocation(card.dataset.loc);
    });

    card.addEventListener('mouseleave', function () {
      setHoveredLocation(null);
    });

    card.addEventListener('focusin', function () {
      setHoveredLocation(card.dataset.loc);
    });

    card.addEventListener('focusout', function () {
      setHoveredLocation(null);
    });
  });
})();