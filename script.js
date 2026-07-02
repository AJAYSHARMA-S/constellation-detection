/* ==========================================================
   CURONEX — Camp Booking (Citizen Page)
   ========================================================== */

/* ---------- Mock data (stand-in for API results) ---------- */
const ALL_CAMPS = [
  { id: "CMP-1042", name: "City Care Free Eye Camp",        city: "Chennai",    specialization: "Ophthalmology",  date: "2026-07-10", slots: 18 },
  { id: "CMP-1039", name: "Sunrise Cardiac Screening Camp",  city: "Coimbatore", specialization: "Cardiology",     date: "2026-07-08", slots: 4  },
  { id: "CMP-1035", name: "Little Steps Pediatric Camp",     city: "Madurai",    specialization: "Pediatrics",     date: "2026-07-15", slots: 27 },
  { id: "CMP-1031", name: "SkinCare Community Camp",         city: "Chennai",    specialization: "Dermatology",    date: "2026-07-12", slots: 0  },
  { id: "CMP-1028", name: "Bone & Joint Health Camp",        city: "Trichy",     specialization: "Orthopedics",    date: "2026-07-20", slots: 11 },
  { id: "CMP-1024", name: "Smile Wide Dental Camp",          city: "Salem",      specialization: "Dental",         date: "2026-07-09", slots: 9  },
  { id: "CMP-1019", name: "General Wellness Check Camp",     city: "Sirkazhi",   specialization: "General Medicine", date: "2026-07-11", slots: 32 },
  { id: "CMP-1015", name: "Heartbeat Cardiac Camp",          city: "Chennai",    specialization: "Cardiology",     date: "2026-07-14", slots: 6  },
  { id: "CMP-1011", name: "Vision Plus Eye Screening Camp",  city: "Madurai",    specialization: "Ophthalmology",  date: "2026-07-18", slots: 14 },
  { id: "CMP-1006", name: "MotherCare Pediatric Camp",       city: "Coimbatore", specialization: "Pediatrics",     date: "2026-07-13", slots: 21 },
  { id: "CMP-1002", name: "Family Dental Health Camp",       city: "Trichy",     specialization: "Dental",         date: "2026-07-16", slots: 3  },
  { id: "CMP-0998", name: "Joint Care Ortho Camp",           city: "Salem",      specialization: "Orthopedics",    date: "2026-07-19", slots: 17 },
  { id: "CMP-0994", name: "Community General Checkup Camp",  city: "Sirkazhi",   specialization: "General Medicine", date: "2026-07-07", slots: 25 },
  { id: "CMP-0989", name: "Radiant Skin Clinic Camp",        city: "Chennai",    specialization: "Dermatology",    date: "2026-07-21", slots: 8  },
  { id: "CMP-0985", name: "Clear Sight Eye Camp",             city: "Coimbatore", specialization: "Ophthalmology",  date: "2026-07-22", slots: 12 },
  { id: "CMP-0980", name: "Kids First Pediatric Camp",       city: "Madurai",    specialization: "Pediatrics",     date: "2026-07-23", slots: 19 },
];

const PAGE_SIZE = 8;

const state = {
  query: "",
  specialization: "",
  city: "",
  radiusEnabled: false,
  radius: null,
  page: 1,
  results: ALL_CAMPS.slice(),
};

/* ---------- DOM refs ---------- */
const campGrid       = document.getElementById("campGrid");
const emptyState      = document.getElementById("emptyState");
const paginationEl    = document.getElementById("pagination");
const resultsHeading  = document.getElementById("resultsHeading");
const resultsCount    = document.getElementById("resultsCount");

const searchInput     = document.getElementById("searchInput");
const searchBtn       = document.getElementById("searchBtn");

const filterToggle    = document.getElementById("filterToggle");
const filtersPanel    = document.getElementById("filtersPanel");
const specializationFilter = document.getElementById("specializationFilter");
const cityFilter       = document.getElementById("cityFilter");
const radiusToggle     = document.getElementById("radiusToggle");
const radiusField      = document.getElementById("radiusField");
const radiusInput      = document.getElementById("radiusInput");
const applyFiltersBtn  = document.getElementById("applyFiltersBtn");
const clearFiltersBtn  = document.getElementById("clearFiltersBtn");

const profileBtn = document.getElementById("profileBtn");
const menuBtn    = document.getElementById("menuBtn");
const dropdownMenu = document.getElementById("dropdownMenu");
const logoutBtn  = document.getElementById("logoutBtn");
const backBtn    = document.getElementById("backBtn");

/* ==========================================================
   REUSABLE MANDATORY-FIELD VALIDATION
   Usage pattern for any page in the product:
   <div class="form-group" data-required>
     <label>Field <span class="required">*</span></label>
     <input>
     <p class="error-text">Message shown when invalid</p>
   </div>
   markInvalid(fieldEl) / clearInvalid(fieldEl) do the rest.
   A field auto-clears its red state the moment the user
   focuses or edits it (per product requirement).
   ========================================================== */
function markInvalid(inputEl) {
  const group = inputEl.closest(".form-group");
  if (group) group.classList.add("invalid");
}
function clearInvalid(inputEl) {
  const group = inputEl.closest(".form-group");
  if (group) group.classList.remove("invalid");
}
function attachAutoClear(inputEl) {
  ["focus", "input", "change"].forEach(evt =>
    inputEl.addEventListener(evt, () => clearInvalid(inputEl))
  );
}
attachAutoClear(radiusInput);

/* ---------- Render camp cards ---------- */
function renderCamps() {
  const start = (state.page - 1) * PAGE_SIZE;
  const pageItems = state.results.slice(start, start + PAGE_SIZE);

  campGrid.innerHTML = "";

  if (state.results.length === 0) {
    campGrid.hidden = true;
    emptyState.hidden = false;
  } else {
    campGrid.hidden = false;
    emptyState.hidden = true;

    pageItems.forEach(camp => {
      const card = document.createElement("article");
      card.className = "camp-card";

      const slotsLabel = camp.slots === 0
        ? `<span class="slots-left" style="color:var(--error);font-weight:600;">Fully booked</span>`
        : `<span class="slots-left">${camp.slots} slots left</span>`;

      card.innerHTML = `
        <div class="camp-card-top">
          <span class="camp-id">${camp.id}</span>
          <span class="camp-badge">${camp.specialization}</span>
        </div>
        <h3 class="camp-name">${camp.name}</h3>
        <div class="camp-meta">
          <div class="camp-meta-row">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v2M7 11v2M1 7h2M11 7h2" stroke="#6B7280" stroke-width="1.3" stroke-linecap="round"/>
              <circle cx="7" cy="7" r="4.5" stroke="#6B7280" stroke-width="1.3"/>
            </svg>
            ${camp.city}
          </div>
          <div class="camp-meta-row">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="#6B7280" stroke-width="1.3"/>
              <path d="M1.5 5.5h11" stroke="#6B7280" stroke-width="1.3"/>
              <path d="M4 1v2M10 1v2" stroke="#6B7280" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            ${formatDate(camp.date)}
          </div>
        </div>
        <div class="camp-card-footer">
          ${slotsLabel}
          <button class="btn btn-primary book-btn" ${camp.slots === 0 ? "disabled style='opacity:.5;cursor:not-allowed;'" : ""} data-camp-id="${camp.id}">
            Book
          </button>
        </div>
      `;
      campGrid.appendChild(card);
    });
  }

  resultsCount.textContent = state.results.length
    ? `${state.results.length} camp${state.results.length > 1 ? "s" : ""} found`
    : "";

  renderPagination();
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ---------- Pagination (Google-style numbered pages) ---------- */
function renderPagination() {
  paginationEl.innerHTML = "";
  const totalPages = Math.max(1, Math.ceil(state.results.length / PAGE_SIZE));
  if (totalPages <= 1) return;

  const makeBtn = (label, page, opts = {}) => {
    const btn = document.createElement("button");
    btn.className = "page-btn" + (opts.active ? " active" : "");
    btn.textContent = label;
    btn.disabled = !!opts.disabled;
    btn.addEventListener("click", () => {
      state.page = page;
      renderCamps();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    return btn;
  };

  paginationEl.appendChild(makeBtn("‹ Prev", state.page - 1, { disabled: state.page === 1 }));

  const windowSize = 5;
  let startPage = Math.max(1, state.page - Math.floor(windowSize / 2));
  let endPage = Math.min(totalPages, startPage + windowSize - 1);
  startPage = Math.max(1, endPage - windowSize + 1);

  if (startPage > 1) {
    paginationEl.appendChild(makeBtn("1", 1));
    if (startPage > 2) {
      const dots = document.createElement("span");
      dots.className = "page-ellipsis";
      dots.textContent = "…";
      paginationEl.appendChild(dots);
    }
  }

  for (let p = startPage; p <= endPage; p++) {
    paginationEl.appendChild(makeBtn(String(p), p, { active: p === state.page }));
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement("span");
      dots.className = "page-ellipsis";
      dots.textContent = "…";
      paginationEl.appendChild(dots);
    }
    paginationEl.appendChild(makeBtn(String(totalPages), totalPages));
  }

  paginationEl.appendChild(makeBtn("Next ›", state.page + 1, { disabled: state.page === totalPages }));
}

/* ---------- Search / filter logic ---------- */
function applySearch() {
  const q = state.query.trim().toLowerCase();
  const spec = state.specialization;
  const city = state.city.trim().toLowerCase();

  let filtered = ALL_CAMPS.filter(camp => {
    const matchesQuery = !q ||
      camp.id.toLowerCase().includes(q) ||
      camp.name.toLowerCase().includes(q) ||
      camp.city.toLowerCase().includes(q) ||
      camp.specialization.toLowerCase().includes(q);

    const matchesSpec = !spec || camp.specialization === spec;
    const matchesCity = !city || camp.city.toLowerCase().includes(city);

    return matchesQuery && matchesSpec && matchesCity;
  });

  state.results = filtered;
  state.page = 1;

  resultsHeading.textContent = (q || spec || city || state.radiusEnabled)
    ? "Search results"
    : "Latest camps";

  renderCamps();
}

/* Default view: latest camps (already newest-first in mock data) */
function loadLatest() {
  state.results = ALL_CAMPS.slice();
  state.page = 1;
  resultsHeading.textContent = "Latest camps";
  renderCamps();
}

/* ---------- Event bindings ---------- */
searchBtn.addEventListener("click", () => {
  state.query = searchInput.value;
  applySearch();
});
searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    state.query = searchInput.value;
    applySearch();
  }
});
searchInput.addEventListener("input", () => {
  if (searchInput.value.trim() === "") {
    state.query = "";
    applySearch();
  }
});

filterToggle.addEventListener("click", () => {
  const isOpen = filtersPanel.classList.toggle("open");
  filterToggle.setAttribute("aria-expanded", String(isOpen));
});

radiusToggle.addEventListener("change", () => {
  state.radiusEnabled = radiusToggle.checked;
  radiusInput.disabled = !radiusToggle.checked;
  if (!radiusToggle.checked) {
    clearInvalid(radiusInput);
    radiusInput.value = "";
    state.radius = null;
  }
});

applyFiltersBtn.addEventListener("click", () => {
  // VR20: search radius must be a positive number (km), when the filter is enabled
  if (state.radiusEnabled) {
    const val = parseFloat(radiusInput.value);
    if (isNaN(val) || val <= 0) {
      markInvalid(radiusInput);
      radiusInput.focus();
      return;
    }
    clearInvalid(radiusInput);
    state.radius = val;
  }

  state.specialization = specializationFilter.value;
  state.city = cityFilter.value;
  state.query = searchInput.value;
  applySearch();
});

clearFiltersBtn.addEventListener("click", () => {
  specializationFilter.value = "";
  cityFilter.value = "";
  radiusToggle.checked = false;
  radiusInput.value = "";
  radiusInput.disabled = true;
  clearInvalid(radiusInput);

  state.specialization = "";
  state.city = "";
  state.radiusEnabled = false;
  state.radius = null;
  state.query = "";
  searchInput.value = "";
  loadLatest();
});

/* Profile / hamburger menu */
menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = dropdownMenu.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(isOpen));
});
document.addEventListener("click", (e) => {
  if (!dropdownMenu.contains(e.target) && e.target !== menuBtn) {
    dropdownMenu.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }
});
profileBtn.addEventListener("click", () => {
  // Hook up to the citizen's profile page.
  console.log("Open profile");
});
logoutBtn.addEventListener("click", () => {
  // Hook up to actual logout flow / auth clear.
  console.log("Logging out…");
});

/* Back navigation */
backBtn.addEventListener("click", () => {
  if (window.history.length > 1) window.history.back();
});

/* Book button (event delegation) -> would route to Camp Details page */
campGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".book-btn");
  if (!btn || btn.disabled) return;
  const campId = btn.getAttribute("data-camp-id");
  // Navigate to the Camp Details / Personal Details page for this camp.
  console.log("Book camp:", campId);
  // window.location.href = `camp-details.html?campId=${encodeURIComponent(campId)}`;
});

/* ---------- Init ---------- */
loadLatest();
