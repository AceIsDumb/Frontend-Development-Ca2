// js for the amenities page. each card starts collapsed (just the name
// + button visible), clicking "read more" smoothly expands the details
// underneath and rotates the chevron, clicking again collapses it.

document.querySelectorAll('[data-amenity-toggle]').forEach(function (button) {
  button.addEventListener('click', function () {
    const card = button.closest('[data-amenity]');
    const details = card.querySelector('[data-amenity-details]');
    const chevron = card.querySelector('[data-amenity-chevron]');
    const label = card.querySelector('[data-amenity-toggle-label]');

    // the grid-rows-[0fr] / grid-rows-[1fr] swap is what animates the
    // height smoothly, since you can't transition display:none directly
    const isCollapsed = details.classList.contains('grid-rows-[0fr]');

    details.classList.toggle('grid-rows-[0fr]', !isCollapsed);
    details.classList.toggle('grid-rows-[1fr]', isCollapsed);
    chevron.classList.toggle('rotate-180', isCollapsed);
    label.textContent = isCollapsed ? 'Show less' : 'Details';
  });
});
