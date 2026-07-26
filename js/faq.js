// js for the faq page. filters the accordion questions live as the
// user types in the search box, and hides a whole category (heading
// included) if nothing in it matches anymore.

const searchInput = document.getElementById('faq-search');
const noResults = document.getElementById('faq-no-results');
const groups = document.querySelectorAll('[data-faq-group]');

if (searchInput) {
  searchInput.addEventListener('input', function () {
    const query = searchInput.value.trim().toLowerCase();
    let anyVisible = false;

    groups.forEach(function (group) {
      const items = group.querySelectorAll('details');
      let groupHasMatch = false;

      items.forEach(function (item) {
        const question = item.querySelector('[data-faq-question]').textContent.toLowerCase();
        const answer = item.querySelector('[data-faq-answer]').textContent.toLowerCase();
        const matches = question.includes(query) || answer.includes(query);

        item.classList.toggle('hidden', !matches);
        if (matches) {
          groupHasMatch = true;
          anyVisible = true;
        }
      });

      // hide the category heading too if nothing under it matched,
      // otherwise you'd see an empty "payment and billing" heading
      // sitting above nothing
      group.classList.toggle('hidden', !groupHasMatch);
    });

    if (noResults) {
      noResults.classList.toggle('hidden', anyVisible);
    }
  });
}
