document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================
     PROFILE DROPDOWN (navbar) — same pattern as camp-details/authentication
  ========================================================== */
  const userTrigger  = document.getElementById('userTrigger');
  const userDropdown = document.getElementById('userDropdown');
  const logoutBtn    = document.getElementById('logoutBtn');

  if (userTrigger && userDropdown) {
    userTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = userDropdown.classList.toggle('open');
      userTrigger.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!userTrigger.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('open');
        userTrigger.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        userDropdown.classList.remove('open');
        userTrigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      console.log('Logout clicked');
    });
  }

  /* ==========================================================
     MEDICAL REPORTS — dynamic add / remove
  ========================================================== */
  const termsCheckbox     = document.getElementById('termsCheckbox');
  const termsBox          = document.getElementById('termsBox');
  const addReportBtn      = document.getElementById('addReportBtn');
  const reportsList       = document.getElementById('reportsList');
  const noReportsMsg      = document.getElementById('noReportsMsg');
  const reportsCountBadge = document.getElementById('reportsCountBadge');

  let reportCounter = 0;

  function updateReportsUI() {
    const count = reportsList.children.length;
    reportsCountBadge.textContent = `${count} added`;
    noReportsMsg.style.display = count === 0 ? 'block' : 'none';
  }

  function addReportBlock() {
    reportCounter += 1;
    const id = reportCounter;

    const item = document.createElement('div');
    item.className = 'report-item';
    item.dataset.id = id;

    item.innerHTML = `
      <div class="report-item-header">
        <span class="report-item-title">Report #${id}</span>
        <button type="button" class="remove-report-btn" aria-label="Remove report">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z"/></svg>
        </button>
      </div>
      <div class="form-group">
        <label>Report Name <span class="req-star">*</span></label>
        <input type="text" class="report-name" placeholder="e.g. Blood Test Report">
        <span class="error-text">Please enter a report name.</span>
      </div>
      <div class="form-group">
        <label>Upload File <span class="req-star">*</span></label>
        <input type="file" class="report-file">
        <span class="error-text">Please choose a file to upload.</span>
        <p class="report-file-name" hidden></p>
      </div>
    `;

    reportsList.appendChild(item);
    updateReportsUI();

    const fileInput   = item.querySelector('.report-file');
    const fileNameTag = item.querySelector('.report-file-name');
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        fileNameTag.textContent = `Selected: ${fileInput.files[0].name}`;
        fileNameTag.hidden = false;
      } else {
        fileNameTag.hidden = true;
      }
    });

    item.querySelector('.remove-report-btn').addEventListener('click', () => {
      item.remove();
      renumberReports();
      updateReportsUI();
    });
  }

  function renumberReports() {
    [...reportsList.children].forEach((item, index) => {
      item.querySelector('.report-item-title').textContent = `Report #${index + 1}`;
    });
  }

  function refreshTermsGate() {
    const accepted = termsCheckbox.checked;
    addReportBtn.disabled = !accepted;
    if (accepted) {
      termsBox.classList.remove('has-error');
    }
  }

  if (termsCheckbox) {
    termsCheckbox.addEventListener('change', refreshTermsGate);
  }

  if (addReportBtn) {
    addReportBtn.addEventListener('click', () => {
      if (termsCheckbox.checked) {
        addReportBlock();
      } else {
        termsBox.classList.add('has-error');
      }
    });
  }

  updateReportsUI();

  /* ==========================================================
     FORM VALIDATION + SUBMIT
  ========================================================== */
  const recordForm      = document.getElementById('recordForm');
  const successCard     = document.getElementById('successCard');
  const newRecordBtn    = document.getElementById('newRecordBtn');
  const draftBtn        = document.getElementById('draftBtn');
  const consentCheckbox = document.getElementById('consentCheckbox');
  const consentCard     = document.getElementById('consentCard');

  function setFieldError(fieldEl, hasError) {
    const group = fieldEl.closest('.form-group');
    if (group) group.classList.toggle('invalid', hasError);
  }

  function validateForm() {
    let isValid = true;

    // Required top-level fields
    const requiredFields = recordForm.querySelectorAll('[required]');
    requiredFields.forEach((field) => {
      const empty = !field.value || !field.value.trim();
      setFieldError(field, empty);
      if (empty) isValid = false;
    });

    // Each added report needs a name + a file
    reportsList.querySelectorAll('.report-item').forEach((item) => {
      const nameInput = item.querySelector('.report-name');
      const fileInput = item.querySelector('.report-file');

      const nameGroup = nameInput.closest('.form-group');
      const fileGroup = fileInput.closest('.form-group');

      const nameEmpty = !nameInput.value.trim();
      const fileEmpty = !fileInput.files || fileInput.files.length === 0;

      nameGroup.classList.toggle('invalid', nameEmpty);
      fileGroup.classList.toggle('invalid', fileEmpty);

      if (nameEmpty || fileEmpty) isValid = false;
    });

    // Terms checkbox required if any report has been added
    if (reportsList.children.length > 0 && !termsCheckbox.checked) {
      termsBox.classList.add('has-error');
      isValid = false;
    }

    // Patient consent required
    if (!consentCheckbox.checked) {
      consentCard.classList.add('has-error');
      isValid = false;
    } else {
      consentCard.classList.remove('has-error');
    }

    return isValid;
  }

  if (recordForm) {
    recordForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateForm()) {
        const firstError = recordForm.querySelector('.invalid, .terms-box.has-error, .consent-card.has-error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Simulate storing the record in the database
      recordForm.hidden = true;
      successCard.hidden = false;
      successCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (newRecordBtn) {
    newRecordBtn.addEventListener('click', () => {
      recordForm.reset();
      reportsList.innerHTML = '';
      reportCounter = 0;
      updateReportsUI();
      refreshTermsGate();
      termsBox.classList.remove('has-error');
      consentCard.classList.remove('has-error');
      recordForm.querySelectorAll('.form-group.invalid').forEach((g) => g.classList.remove('invalid'));

      successCard.hidden = true;
      recordForm.hidden = false;
      recordForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (draftBtn) {
    draftBtn.addEventListener('click', () => {
      // Draft saving is kept in-memory only (no backend wired up yet)
      console.log('Draft saved (in-memory only):', {
        patientId: document.getElementById('patientId').value,
        patientName: document.getElementById('patientName').value,
      });
      draftBtn.textContent = 'Draft Saved ✓';
      setTimeout(() => { draftBtn.textContent = 'Save Draft'; }, 1800);
    });
  }

});