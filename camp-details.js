// ===== Curonex | Camp Details & Booking Form =====

document.addEventListener('DOMContentLoaded', () => {

  // ---- Back button ----
  const backBtn = document.getElementById('backBtn');
  backBtn.addEventListener('click', () => {
    // Navigate back to the camp booking / listing page
    window.location.href = 'camp-booking.html';
  });

  // ---- Cancel button ----
  const cancelBtn = document.getElementById('cancelBtn');
  cancelBtn.addEventListener('click', () => {
    const confirmLeave = confirm('Discard the entered details and go back?');
    if (confirmLeave) {
      window.location.href = 'camp-booking.html';
    }
  });

  // ---- Form validation ----
  const form = document.getElementById('campForm');
  const requiredFields = form.querySelectorAll('[required]');

  // Clear the red/invalid state as soon as the citizen starts fixing the field
  requiredFields.forEach((field) => {
    const group = field.closest('.form-group');

    const clearInvalid = () => {
      if (isFieldValid(field)) {
        group.classList.remove('invalid');
      }
    };

    field.addEventListener('input', clearInvalid);
    field.addEventListener('change', clearInvalid);
    field.addEventListener('blur', () => {
      // Light validation on blur too, so users get feedback before hitting submit
      if (!isFieldValid(field)) {
        group.classList.add('invalid');
      }
    });
  });

  function isFieldValid(field) {
    if (field.type === 'tel') {
      const digits = field.value.replace(/\D/g, '');
      return digits.length >= 10;
    }
    return field.value.trim().length > 0;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let firstInvalid = null;

    requiredFields.forEach((field) => {
      const group = field.closest('.form-group');
      if (!isFieldValid(field)) {
        group.classList.add('invalid');
        if (!firstInvalid) firstInvalid = field;
      } else {
        group.classList.remove('invalid');
      }
    });

    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.focus();
      return;
    }

    // All required fields are valid — collect data and move to the
    // Unique Authentication (PIN & QR) page.
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    // Attach camp context so the next page can display it alongside the PIN/QR
    payload.campId = document.getElementById('campIdBadge').textContent;
    payload.campName = document.getElementById('campName').textContent;
    payload.campCity = document.getElementById('campCity').textContent;

    sessionStorage.setItem('curonexBookingData', JSON.stringify(payload));

    window.location.href = 'camp-authentication.html';
  });

});
