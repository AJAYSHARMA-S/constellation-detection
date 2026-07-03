/* =====================================================================
   CURONEX — SHARED SCRIPT
   Runs on every page. Each block checks for its own elements first,
   so it's safe to include this one file everywhere.
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------------
     NAVBAR — user dropdown (every page)
     --------------------------------------------------------------- */
  const userTrigger = document.getElementById('userTrigger');
  const userDropdown = document.getElementById('userDropdown');

  if (userTrigger && userDropdown) {
    userTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = userDropdown.classList.toggle('open');
      userTrigger.setAttribute('aria-expanded', isOpen);
    });
    document.addEventListener('click', () => {
      userDropdown.classList.remove('open');
      userTrigger.setAttribute('aria-expanded', 'false');
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
  }

  /* =================================================================
     CAMP BOOKING PAGE (search + filters + grid + pagination)
     Only runs if #campGrid exists on this page.
     ================================================================= */
  const campGrid = document.getElementById('campGrid');

  if (campGrid) {
    const CAMPS_PER_PAGE = 9;

    // Sample camp dataset — replace with real API data.
    const CAMPS = [
      { id: 'CMP-1010', name: 'Camp 10', city: 'Salem', specialization: 'Pediatrics' },
      { id: 'CMP-1011', name: 'Camp 11', city: 'Sirkazhi', specialization: 'Orthopedics' },
      { id: 'CMP-1012', name: 'Camp 12', city: 'Chennai', specialization: 'Ophthalmology' },
      { id: 'CMP-1013', name: 'Camp 13', city: 'Coimbatore', specialization: 'Dental' },
      { id: 'CMP-1014', name: 'Camp 14', city: 'Madurai', specialization: 'General Medicine' },
      { id: 'CMP-1015', name: 'Camp 15', city: 'Trichy', specialization: 'Cardiology' },
      { id: 'CMP-1016', name: 'Camp 16', city: 'Salem', specialization: 'Dermatology' },
      { id: 'CMP-1017', name: 'Camp 17', city: 'Chennai', specialization: 'Pediatrics' },
      { id: 'CMP-1018', name: 'Camp 18', city: 'Madurai', specialization: 'Orthopedics' },
      { id: 'CMP-1019', name: 'Camp 19', city: 'Trichy', specialization: 'General Medicine' },
      { id: 'CMP-1020', name: 'Camp 20', city: 'Sirkazhi', specialization: 'Cardiology' },
      { id: 'CMP-1021', name: 'Camp 21', city: 'Coimbatore', specialization: 'Dental' }
    ];

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const filterToggle = document.getElementById('filterToggle');
    const filtersPanel = document.getElementById('filtersPanel');
    const specializationFilter = document.getElementById('specializationFilter');
    const cityFilter = document.getElementById('cityFilter');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resultsHeading = document.getElementById('resultsHeading');
    const emptyState = document.getElementById('emptyState');
    const pagination = document.getElementById('pagination');

    let currentPage = 1;
    let activeResults = CAMPS.slice();

    // ---- Filter panel toggle ----
    if (filterToggle && filtersPanel) {
      filterToggle.addEventListener('click', () => {
        const isOpen = filtersPanel.classList.toggle('open');
        filterToggle.setAttribute('aria-expanded', isOpen);
      });
    }

    function getFilteredCamps() {
      const query = (searchInput.value || '').trim().toLowerCase();
      const spec = specializationFilter.value;
      const city = (cityFilter.value || '').trim().toLowerCase();

      return CAMPS.filter((camp) => {
        const matchesQuery = !query ||
          camp.id.toLowerCase().includes(query) ||
          camp.name.toLowerCase().includes(query) ||
          camp.city.toLowerCase().includes(query) ||
          camp.specialization.toLowerCase().includes(query);

        const matchesSpec = !spec || camp.specialization === spec;
        const matchesCity = !city || camp.city.toLowerCase().includes(city);

        return matchesQuery && matchesSpec && matchesCity;
      });
    }

    function renderCamps() {
      campGrid.innerHTML = '';

      if (activeResults.length === 0) {
        emptyState.hidden = false;
        pagination.innerHTML = '';
        return;
      }
      emptyState.hidden = true;

      const totalPages = Math.ceil(activeResults.length / CAMPS_PER_PAGE);
      currentPage = Math.min(currentPage, totalPages) || 1;

      const start = (currentPage - 1) * CAMPS_PER_PAGE;
      const pageCamps = activeResults.slice(start, start + CAMPS_PER_PAGE);

      pageCamps.forEach((camp) => {
        const card = document.createElement('article');
        card.className = 'camp-card';
        card.innerHTML = `
          <div class="camp-card-top">
            <span class="camp-id">${camp.id}</span>
            <span class="camp-tag">${camp.specialization}</span>
          </div>
          <h3 class="camp-name">${camp.name}</h3>
          <div class="camp-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>
            ${camp.city}
          </div>
          <button class="btn btn-primary" data-camp-id="${camp.id}">Book</button>
        `;
        card.querySelector('.btn-primary').addEventListener('click', () => {
          window.location.href = `camp-details.html?campId=${encodeURIComponent(camp.id)}`;
        });
        campGrid.appendChild(card);
      });

      renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
      pagination.innerHTML = '';
      if (totalPages <= 1) return;

      const addBtn = (label, page, opts = {}) => {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (opts.active ? ' active' : '');
        btn.textContent = label;
        btn.disabled = !!opts.disabled;
        btn.addEventListener('click', () => {
          currentPage = page;
          renderCamps();
          window.scrollTo({ top: campGrid.offsetTop - 100, behavior: 'smooth' });
        });
        pagination.appendChild(btn);
      };

      addBtn('‹', Math.max(1, currentPage - 1), { disabled: currentPage === 1 });

      // Google-style grouped ranges (1-5, 6-10, ...) collapse to simple
      // numbered pages when there are 10 or fewer pages.
      const maxButtons = 10;
      if (totalPages <= maxButtons) {
        for (let p = 1; p <= totalPages; p++) {
          addBtn(String(p), p, { active: p === currentPage });
        }
      } else {
        const groupSize = 5;
        const groupStart = Math.floor((currentPage - 1) / groupSize) * groupSize + 1;
        const groupEnd = Math.min(groupStart + groupSize - 1, totalPages);
        for (let p = groupStart; p <= groupEnd; p++) {
          addBtn(String(p), p, { active: p === currentPage });
        }
        if (groupEnd < totalPages) addBtn('…', groupEnd + 1);
      }

      addBtn('›', Math.min(totalPages, currentPage + 1), { disabled: currentPage === totalPages });
    }

    function runSearch() {
      currentPage = 1;
      activeResults = getFilteredCamps();
      resultsHeading.textContent = (searchInput.value || specializationFilter.value || cityFilter.value)
        ? `Search results (${activeResults.length})`
        : 'Latest camps';
      renderCamps();
    }

    if (searchBtn) searchBtn.addEventListener('click', runSearch);
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') runSearch();
      });
    }
    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', runSearch);
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        specializationFilter.value = '';
        cityFilter.value = '';
        runSearch();
      });
    }

    // Initial render
    activeResults = CAMPS.slice();
    renderCamps();
  }

  /* =================================================================
     CAMP DETAILS + BOOKING FORM PAGE
     Only runs if #campForm exists on this page.
     ================================================================= */
  const form = document.getElementById('campForm');

  if (form) {
    const requiredFields = form.querySelectorAll('[required]');

    function isFieldValid(field) {
      if (field.type === 'tel') {
        const digits = field.value.replace(/\D/g, '');
        return digits.length >= 10;
      }
      return field.value.trim().length > 0;
    }

    requiredFields.forEach((field) => {
      const group = field.closest('.form-group');

      const clearInvalid = () => {
        if (isFieldValid(field)) group.classList.remove('invalid');
      };

      field.addEventListener('input', clearInvalid);
      field.addEventListener('change', clearInvalid);
      field.addEventListener('blur', () => {
        if (!isFieldValid(field)) group.classList.add('invalid');
      });
    });

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

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      const campIdBadge = document.getElementById('campIdBadge');
      const campName = document.getElementById('campName');
      const campCity = document.getElementById('campCity');
      if (campIdBadge) payload.campId = campIdBadge.textContent;
      if (campName) payload.campName = campName.textContent;
      if (campCity) payload.campCity = campCity.textContent;

      sessionStorage.setItem('curonexBookingData', JSON.stringify(payload));
      window.location.href = 'camp-authentication.html';
    });

    // Cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (confirm('Discard the entered details and go back?')) {
          window.location.href = 'camp-booking.html';
        }
      });
    }
  }

});