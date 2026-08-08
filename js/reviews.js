// js for the reviews page. clicking a rating button shows only the
// testimonials with that star rating, swaps the active button's style,
// and updates the count line above the grid.

const filterButtons = document.querySelectorAll('[data-filter]');
const reviewCards = document.querySelectorAll('[data-rating]');
const reviewCount = document.getElementById('review-count');

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

    // show/hide each card depending on whether its rating matches.
    // "all" is a special case that always matches. count as we go so
    // the line above the grid can be updated after the loop
    let visibleCount = 0;
    reviewCards.forEach(function (card) {
      const matches = selected === 'all' || card.dataset.rating === selected;
      card.classList.toggle('hidden', !matches);
      if (matches) {
        visibleCount = visibleCount + 1;
      }
    });

    if (reviewCount) {
      // "1 review" instead of "1 reviews"
      const wordForReviews = visibleCount === 1 ? 'review' : 'reviews';

      if (selected === 'all') {
        reviewCount.textContent = 'Showing all ' + visibleCount + ' ' + wordForReviews;
      } else if (visibleCount === 0) {
        reviewCount.textContent = 'No reviews rated ' + selected + ' stars yet';
      } else {
        reviewCount.textContent = 'Showing ' + visibleCount + ' ' + wordForReviews + ' rated ' + selected + ' stars';
      }
    }
  });
});