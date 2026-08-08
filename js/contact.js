// js for the contact page. this one actually does something since
// "form with validation" is one of the required bits for the project,
// so figured it's worth getting a basic version working now rather
// than leaving it for later.

const form = document.getElementById('contact-form');

if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    let isValid = true;

    // grab the three fields we care about
    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const message = document.getElementById('message');

    // little helper so we're not repeating the same 4 lines 3 times
    function setError(field, hasError) {
      const errorMsg = field.parentElement.querySelector('.field-error-msg');
      field.classList.toggle('field-error', hasError);
      if (errorMsg) errorMsg.classList.toggle('visible', hasError);
      if (hasError) isValid = false;
    }

    // name just needs to not be empty
    setError(name, name.value.trim() === '');

    // super basic email check, doesn't need to be bulletproof,
    // just catches the obvious "forgot the @" type mistakes
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setError(email, !emailPattern.test(email.value.trim()));

    // message just needs a few characters in it
    setError(message, message.value.trim().length < 5);

    if (isValid) {
      // no backend yet, so just swap the form out for a little
      // confirmation message for now
      form.innerHTML = '<p class="text-navy font-medium">Thanks — we will get back to you soon! · Merci! — nous vous répondrons bientôt.</p>';
    }
  });
}
