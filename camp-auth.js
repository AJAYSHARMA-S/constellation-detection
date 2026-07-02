/* =====================================================================
   CURONEX — UNIQUE AUTHENTICATION (PIN & QR) PAGE LOGIC
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* -------------------------------------------------------------
     0. User dropdown (same behaviour as the shared navbar)
  --------------------------------------------------------------*/
  const userTrigger = document.getElementById('userTrigger');
  const userDropdown = document.getElementById('userDropdown');
  if (userTrigger && userDropdown) {
    userTrigger.addEventListener('click', () => {
      const isOpen = userDropdown.classList.toggle('open');
      userTrigger.setAttribute('aria-expanded', isOpen);
    });
    document.addEventListener('click', (e) => {
      if (!userTrigger.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('open');
        userTrigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* -------------------------------------------------------------
     1. Camp + patient data
     In production this page reads the camp info + the details the
     citizen just submitted on camp-details.html (e.g. passed via
     sessionStorage as JSON under 'curonexBooking'). If nothing is
     found (page opened directly), demo data is used so the UI can
     still be previewed/tested standalone.
  --------------------------------------------------------------*/
  const DEMO_DATA = {
    camp: {
      id: 'CMP-1011',
      name: 'Camp 11',
      city: 'Sirkazhi',
      date: '12 July 2026',
      doctor: 'Dr. Karthik Raman',
      hospital: 'City Care Hospital'
    },
    patient: {
      rFullName: '',
      rPhone: '',
      rAge: '',
      rGender: '',
      rCity: '',
      rAddress: '',
      rReason: '',
      rSlot: '',
      rAltPhone: '',
      rConditions: ''
    }
  };

  let bookingData = DEMO_DATA;
  try {
    const stored = sessionStorage.getItem('curonexBooking');
    if (stored) {
      const parsed = JSON.parse(stored);
      bookingData = {
        camp: { ...DEMO_DATA.camp, ...(parsed.camp || {}) },
        patient: { ...DEMO_DATA.patient, ...(parsed.patient || {}) }
      };
    }
  } catch (err) {
    console.warn('Could not read previous booking data, using demo data.', err);
  }

  /* -------------------------------------------------------------
     2. Render booking summary chips
  --------------------------------------------------------------*/
  document.getElementById('campIdBadge').textContent = bookingData.camp.id;

  const summaryFields = [
    { label: 'Camp', value: bookingData.camp.name },
    { label: 'City', value: bookingData.camp.city },
    { label: 'Date', value: bookingData.camp.date },
    { label: 'Doctor', value: bookingData.camp.doctor },
    { label: 'Hospital', value: bookingData.camp.hospital }
  ];
  const chipsWrap = document.getElementById('summaryChips');
  chipsWrap.innerHTML = summaryFields.map(f => `
    <div class="summary-chip">
      <span class="chip-label">${f.label}</span>
      <span class="chip-value">${f.value}</span>
    </div>
  `).join('');

  /* -------------------------------------------------------------
     3. Pre-fill the review form with the patient's submitted data
  --------------------------------------------------------------*/
  const form = document.getElementById('reviewForm');
  Object.keys(bookingData.patient).forEach(key => {
    const field = form.elements[key];
    if (field) field.value = bookingData.patient[key];
  });

  /* -------------------------------------------------------------
     4. Validation — mandatory fields show red on empty submit
        attempt, and clear red as soon as the person interacts
        with the field (matches camp-details.html form behaviour).
  --------------------------------------------------------------*/
  const requiredGroups = Array.from(form.querySelectorAll('.form-group[data-required="true"]'));

  function clearInvalid(group) {
    group.classList.remove('invalid');
  }

  requiredGroups.forEach(group => {
    const field = group.querySelector('input, select, textarea');
    if (!field) return;
    ['input', 'change', 'focus'].forEach(evt => {
      field.addEventListener(evt, () => clearInvalid(group));
    });
  });

  function validateForm() {
    let firstInvalid = null;
    requiredGroups.forEach(group => {
      const field = group.querySelector('input, select, textarea');
      const isEmpty = !field || !field.value || !field.value.trim();
      if (isEmpty) {
        group.classList.add('invalid');
        if (!firstInvalid) firstInvalid = field;
      } else {
        group.classList.remove('invalid');
      }
    });
    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return !firstInvalid;
  }

  /* -------------------------------------------------------------
     5. Generate PIN + QR
  --------------------------------------------------------------*/
  const generateBtn = document.getElementById('generateBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const authPlaceholder = document.getElementById('authPlaceholder');
  const authResult = document.getElementById('authResult');
  const pinDigitsEl = document.getElementById('pinDigits');
  const refIdEl = document.getElementById('refId');
  const authNote = document.getElementById('authNote');
  const qrContainer = document.getElementById('qrcode');

  const printPatientName = document.getElementById('printPatientName');
  const printCampName = document.getElementById('printCampName');
  const printCampMeta = document.getElementById('printCampMeta');
  const printRefId = document.getElementById('printRefId');
  const printPinDigits = document.getElementById('printPinDigits');
  const printQr = document.getElementById('printQr');

  let currentPin = null;
  let currentRefId = null;

  function generatePin() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function renderPinDigits(container, pin) {
    container.innerHTML = pin.split('').map(d => `<span>${d}</span>`).join('');
  }

  function drawQr(container, text, size) {
    container.innerHTML = '';
    // eslint-disable-next-line no-undef
    new QRCode(container, {
      text,
      width: size,
      height: size,
      colorDark: '#0B3D91',
      colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  generateBtn.addEventListener('click', () => {
    if (!validateForm()) {
      authNote.textContent = 'Please fill in all required fields above before generating your PIN.';
      authNote.className = 'auth-note error';
      return;
    }

    currentPin = generatePin();
    currentRefId = `${bookingData.camp.id}-${currentPin.slice(-4)}`;
    const qrPayload = JSON.stringify({
      ref: currentRefId,
      pin: currentPin,
      camp: bookingData.camp.id,
      name: form.elements['rFullName'].value.trim(),
      slot: form.elements['rSlot'].value
    });

    // On-page result
    renderPinDigits(pinDigitsEl, currentPin);
    refIdEl.textContent = `Reference ID: ${currentRefId}`;
    drawQr(qrContainer, qrPayload, 130);
    authPlaceholder.hidden = true;
    authResult.hidden = false;

    // Off-screen printable card
    printPatientName.textContent = form.elements['rFullName'].value.trim();
    printCampName.textContent = `${bookingData.camp.name} · ${bookingData.camp.city}`;
    printCampMeta.textContent = `${bookingData.camp.date} · ${bookingData.camp.doctor}`;
    printRefId.textContent = `Reference ID: ${currentRefId}`;
    renderPinDigits(printPinDigits, currentPin);
    drawQr(printQr, qrPayload, 150);

    downloadBtn.disabled = false;
    authNote.textContent = 'PIN & QR generated successfully. You can now download them.';
    authNote.className = 'auth-note success';
  });

  /* -------------------------------------------------------------
     6. Download PIN + QR as a PDF (captures the off-screen print
        card using html2canvas, then embeds it into a PDF via jsPDF)
  --------------------------------------------------------------*/
  downloadBtn.addEventListener('click', async () => {
    if (!currentPin) return;
    const printCard = document.getElementById('printCard');

    downloadBtn.disabled = true;
    const originalLabel = downloadBtn.textContent;
    downloadBtn.textContent = 'Preparing download…';

    try {
      // eslint-disable-next-line no-undef
      const canvas = await html2canvas(printCard, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');

      // eslint-disable-next-line no-undef
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Curonex-${currentRefId}.pdf`);

      authNote.textContent = 'Download complete.';
      authNote.className = 'auth-note success';
    } catch (err) {
      console.error('Download failed:', err);
      authNote.textContent = 'Something went wrong preparing the download. Please try again.';
      authNote.className = 'auth-note error';
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.textContent = originalLabel;
    }
  });
});
