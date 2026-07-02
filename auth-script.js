/* =====================================================================
   CURONEX — UNIQUE AUTHENTICATION (PIN & QR) PAGE LOGIC
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* -------------------------------------------------------------
     1. USER DROPDOWN (same behaviour as other pages)
     ------------------------------------------------------------- */
  const userTrigger = document.getElementById('userTrigger');
  const userDropdown = document.getElementById('userDropdown');
  if (userTrigger && userDropdown) {
    userTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = userDropdown.classList.toggle('open');
      userTrigger.setAttribute('aria-expanded', open);
    });
    document.addEventListener('click', () => {
      userDropdown.classList.remove('open');
      userTrigger.setAttribute('aria-expanded', 'false');
    });
  }

  /* -------------------------------------------------------------
     2. LOAD BOOKING DATA
     In production this page would receive the camp + the personal
     details form submitted on camp-details.html (e.g. via
     sessionStorage, a query param, or an API call). Here we read
     sessionStorage if it exists, and otherwise fall back to demo
     data so the page still renders on its own for review.
     ------------------------------------------------------------- */
  const demoCamp = {
    campId: 'CMP-1011',
    campName: 'Camp 11',
    city: 'Sirkazhi',
    specialization: 'Orthopedics',
    date: '12 July 2026',
    timing: '9:00 AM – 4:00 PM',
    doctorName: 'Dr. Karthik Raman',
    hospitalName: 'City Care Hospital'
  };

  const demoPatient = {
    fullName: 'Aravind Suresh',
    phone: '+91 98765 43210',
    age: '34',
    gender: 'Male',
    city: 'Sirkazhi',
    reason: 'Knee pain checkup',
    slot: '9:00 AM – 11:00 AM'
  };

  let camp = demoCamp;
  let patient = demoPatient;

  try {
    const storedCamp = sessionStorage.getItem('curonexCampSummary');
    const storedPatient = sessionStorage.getItem('curonexPatientData');
    if (storedCamp) camp = { ...demoCamp, ...JSON.parse(storedCamp) };
    if (storedPatient) patient = { ...demoPatient, ...JSON.parse(storedPatient) };
  } catch (err) {
    console.warn('Could not read stored booking data, using demo data.', err);
  }

  document.getElementById('summaryCampId').textContent = camp.campId;

  const row = (label, value) => `
    <div class="detail-row">
      <span class="detail-label">${label}</span>
      <span class="detail-value">${value || '—'}</span>
    </div>`;

  document.getElementById('campSummaryList').innerHTML =
    row('Camp Name', camp.campName) +
    row('City', camp.city) +
    row('Specialization', camp.specialization) +
    row('Date', camp.date) +
    row('Timing', camp.timing) +
    row('Doctor', camp.doctorName) +
    row('Hospital', camp.hospitalName);

  document.getElementById('patientSummaryList').innerHTML =
    row('Full Name', patient.fullName) +
    row('Phone', patient.phone) +
    row('Age', patient.age) +
    row('Gender', patient.gender) +
    row('City', patient.city) +
    row('Reason', patient.reason) +
    row('Preferred Slot', patient.slot);

  /* -------------------------------------------------------------
     3. FORM VALIDATION
     Mandatory fields are marked with a red border/background when
     left empty on submit. As soon as the user clicks (focuses) or
     edits the field again, the red state clears.
     ------------------------------------------------------------- */
  const verifyForm = document.getElementById('verifyForm');
  const phoneInput = document.getElementById('verifyPhone');
  const phoneGroup = document.getElementById('phoneGroup');
  const confirmInput = document.getElementById('confirmDetails');
  const confirmGroup = document.getElementById('confirmGroup');

  // Numbers only in the mobile field
  phoneInput.addEventListener('input', () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 4);
  });

  function clearInvalid(group) {
    group.classList.remove('invalid');
  }

  // Red disappears as soon as the field is clicked / focused again
  [phoneInput].forEach(el => el.addEventListener('focus', () => clearInvalid(phoneGroup)));
  confirmInput.addEventListener('focus', () => clearInvalid(confirmGroup));
  phoneInput.addEventListener('input', () => {
    if (phoneInput.value.length === 4) clearInvalid(phoneGroup);
  });
  confirmInput.addEventListener('change', () => {
    if (confirmInput.checked) clearInvalid(confirmGroup);
  });

  function validateForm() {
    let valid = true;

    if (phoneInput.value.trim().length !== 4) {
      phoneGroup.classList.add('invalid');
      valid = false;
    } else {
      clearInvalid(phoneGroup);
    }

    if (!confirmInput.checked) {
      confirmGroup.classList.add('invalid');
      valid = false;
    } else {
      clearInvalid(confirmGroup);
    }

    return valid;
  }

  /* -------------------------------------------------------------
     4. PIN + QR GENERATION
     ------------------------------------------------------------- */
  const authResult = document.getElementById('authResult');
  const pinValue = document.getElementById('pinValue');
  const bookingRef = document.getElementById('bookingRef');
  const validFor = document.getElementById('validFor');
  const qrFrame = document.getElementById('qrcode');
  const ticketQr = document.getElementById('ticketQr');

  let qrInstance = null;
  let ticketQrInstance = null;

  function generatePin() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function generateRef() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let ref = 'CNX-';
    for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
    return ref;
  }

  function renderQr(container, text) {
    container.innerHTML = '';
    // eslint-disable-next-line no-undef
    return new QRCode(container, {
      text,
      width: 200,
      height: 200,
      colorDark: '#0B3D91',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  function generatePass() {
    const pin = generatePin();
    const ref = generateRef();
    const validText = `${camp.date} · ${camp.timing}`;
    const qrPayload = JSON.stringify({
      ref, pin, campId: camp.campId, patient: patient.fullName
    });

    pinValue.textContent = pin;
    bookingRef.textContent = ref;
    validFor.textContent = validText;

    qrInstance = renderQr(qrFrame, qrPayload);

    // Mirror the same details onto the hidden downloadable ticket
    document.getElementById('ticketCampName').textContent = `${camp.campName} — ${camp.city}`;
    document.getElementById('ticketPatientName').textContent = patient.fullName;
    document.getElementById('ticketDateTime').textContent = validText;
    document.getElementById('ticketRef').textContent = ref;
    document.getElementById('ticketPin').textContent = pin;
    ticketQrInstance = renderQr(ticketQr, qrPayload);

    authResult.hidden = false;
    authResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  verifyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstInvalid = verifyForm.querySelector('.invalid input, .invalid');
      if (firstInvalid) firstInvalid.querySelector('input')?.focus();
      return;
    }
    generatePass();
  });

  document.getElementById('regenerateBtn').addEventListener('click', generatePass);

  /* -------------------------------------------------------------
     5. DOWNLOAD PIN & QR AS ONE IMAGE
     ------------------------------------------------------------- */
  document.getElementById('downloadBtn').addEventListener('click', async () => {
    const downloadBtn = document.getElementById('downloadBtn');
    const originalLabel = downloadBtn.innerHTML;
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Preparing…';

    try {
      const ticketEl = document.querySelector('.ticket-card');
      // eslint-disable-next-line no-undef
      const canvas = await html2canvas(ticketEl, { scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `Curonex-Camp-Pass-${bookingRef.textContent}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Could not generate the downloadable pass.', err);
      alert('Sorry, the download could not be generated. Please try again.');
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = originalLabel;
    }
  });

});
