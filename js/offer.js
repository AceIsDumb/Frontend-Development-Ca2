// js for the offers & packages page. clicking a filter button shows only
// the table rows matching that deal type, and swaps the active button's
// style so it's clear which filter is currently selected.

const filterButtons = document.querySelectorAll('[data-filter]');
const dealRows = document.querySelectorAll('[data-deal]');
const noResults = document.getElementById('offers-no-results');

filterButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    const selected = button.dataset.filter;

    // update which button looks "active" — swap classes instead of
    // just aria-checked, since btn-primary/btn-secondary is what
    // actually makes it look selected
    filterButtons.forEach(function (btn) {
      const isSelected = btn === button;
      btn.setAttribute('aria-checked', isSelected);
      btn.classList.toggle('btn-primary', isSelected);
      btn.classList.toggle('btn-secondary', !isSelected);
    });

    // show/hide each row depending on whether it matches the selected
    // deal type. "all" is a special case that always matches
    let anyVisible = false;
    dealRows.forEach(function (row) {
      const matches = selected === 'all' || row.dataset.deal === selected;
      row.classList.toggle('hidden', !matches);
      if (matches) {
        anyVisible = true;
      }
    });

    if (noResults) {
      noResults.classList.toggle('hidden', anyVisible);
    }
  });
});