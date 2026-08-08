// js for the about us page. the rest of the founding story starts
// hidden, and the button below it expands and collapses that block
// while swapping its own label between "read more" and "read less".

const storyToggle = document.getElementById('story-toggle');
const storyMore = document.getElementById('story-more');

// safety check — the button does nothing if either part is missing,
// so the page still works if the markup changes later
if (storyToggle && storyMore) {
  storyToggle.addEventListener('click', function () {
    // hidden is on the block right now, so this click is opening it
    const isOpening = storyMore.classList.contains('hidden');

    storyMore.classList.toggle('hidden', !isOpening);
    storyToggle.textContent = isOpening ? 'Read Less' : 'Read More';

    // aria-expanded tells a screen reader whether the block is open
    storyToggle.setAttribute('aria-expanded', isOpening);
  });
}