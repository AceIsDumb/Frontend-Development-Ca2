// js for the gallery page. clicking a filter button shows only the
// photos matching that category, and swaps the active button's style
// so it's clear which filter is currently selected.

const filterButtons = document.querySelectorAll('[data-filter]');
const photos = document.querySelectorAll('[data-category]');
const noResults = document.getElementById('gallery-no-results');

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

    // show/hide each photo depending on whether it matches the
    // selected category. "all" is a special case that always matches
    let anyVisible = false;
    photos.forEach(function (photo) {
      const matches = selected === 'all' || photo.dataset.category === selected;
      photo.classList.toggle('hidden', !matches);
      if (matches) {
        anyVisible = true;
      }
    });

    if (noResults) {
      noResults.classList.toggle('hidden', anyVisible);
    }
  });
});
