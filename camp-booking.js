const ALL_CAMPS = Array.from({ length: 24 }, (_, i) => {
  const specs = ["General Medicine","Cardiology","Dermatology","Pediatrics","Orthopedics","Ophthalmology","Dental"];
  const cities = ["Chennai","Coimbatore","Madurai","Trichy","Salem","Sirkazhi"];
  const n = i + 1;
  return { id: "CMP-" + (1000 + n), name: "Camp " + n, city: cities[n % cities.length], specialization: specs[n % specs.length] };
});

const PAGE_SIZE = 9;
const state = { query: "", specialization: "", city: "", page: 1, results: ALL_CAMPS.slice() };

const campGrid = document.getElementById("campGrid");
const emptyState = document.getElementById("emptyState");
const paginationEl = document.getElementById("pagination");
const resultsHeading = document.getElementById("resultsHeading");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const filterToggle = document.getElementById("filterToggle");
const filtersPanel = document.getElementById("filtersPanel");
const specializationFilter = document.getElementById("specializationFilter");
const cityFilter = document.getElementById("cityFilter");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const userTrigger = document.getElementById("userTrigger");
const userDropdown = document.getElementById("userDropdown");
const logoutBtn = document.getElementById("logoutBtn");

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
      card.innerHTML = `
        <div class="camp-card-top">
          <span class="camp-id">${camp.id}</span>
          <span class="camp-badge">${camp.specialization}</span>
        </div>
        <h3 class="camp-name">${camp.name}</h3>
        <div class="camp-meta">
          <div class="camp-meta-row">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="#6B7280" stroke-width="1.3"/>
            </svg>
            ${camp.city}
          </div>
        </div>
        <div class="camp-card-footer">
          <button class="btn btn-primary book-btn" data-camp-id="${camp.id}">Book</button>
        </div>`;
      campGrid.appendChild(card);
    });
  }
  renderPagination();
}

function renderPagination() {
  paginationEl.innerHTML = "";
  const totalPages = Math.max(1, Math.ceil(state.results.length / PAGE_SIZE));
  if (totalPages <= 1) return;

  const makeBtn = (label, page, opts = {}) => {
    const btn = document.createElement("button");
    btn.className = "page-btn" + (opts.active ? " active" : "");
    btn.textContent = label;
    btn.disabled = !!opts.disabled;
    btn.addEventListener("click", () => { state.page = page; renderCamps(); });
    return btn;
  };

  paginationEl.appendChild(makeBtn("‹ Prev", state.page - 1, { disabled: state.page === 1 }));
  for (let p = 1; p <= totalPages; p++) paginationEl.appendChild(makeBtn(String(p), p, { active: p === state.page }));
  paginationEl.appendChild(makeBtn("Next ›", state.page + 1, { disabled: state.page === totalPages }));
}

function applySearch() {
  const q = state.query.trim().toLowerCase();
  const spec = state.specialization;
  const city = state.city.trim().toLowerCase();

  state.results = ALL_CAMPS.filter(camp => {
    const matchesQuery = !q || camp.id.toLowerCase().includes(q) || camp.name.toLowerCase().includes(q) || camp.city.toLowerCase().includes(q) || camp.specialization.toLowerCase().includes(q);
    const matchesSpec = !spec || camp.specialization === spec;
    const matchesCity = !city || camp.city.toLowerCase().includes(city);
    return matchesQuery && matchesSpec && matchesCity;
  });
  state.page = 1;
  resultsHeading.textContent = (q || spec || city) ? "Search results" : "Latest camps";
  renderCamps();
}

searchBtn.addEventListener("click", () => { state.query = searchInput.value; applySearch(); });
searchInput.addEventListener("keydown", e => { if (e.key === "Enter") { state.query = searchInput.value; applySearch(); } });

filterToggle.addEventListener("click", () => {
  const isOpen = filtersPanel.classList.toggle("open");
  filterToggle.setAttribute("aria-expanded", String(isOpen));
});

applyFiltersBtn.addEventListener("click", () => {
  state.specialization = specializationFilter.value;
  state.city = cityFilter.value;
  state.query = searchInput.value;
  applySearch();
});

clearFiltersBtn.addEventListener("click", () => {
  specializationFilter.value = ""; cityFilter.value = "";
  state.specialization = ""; state.city = ""; state.query = ""; searchInput.value = "";
  state.results = ALL_CAMPS.slice(); state.page = 1;
  resultsHeading.textContent = "Latest camps";
  renderCamps();
});

userTrigger.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = userDropdown.classList.toggle("open");
  userTrigger.setAttribute("aria-expanded", String(isOpen));
});
document.addEventListener("click", (e) => {
  if (!userDropdown.contains(e.target) && e.target !== userTrigger) {
    userDropdown.classList.remove("open");
    userTrigger.setAttribute("aria-expanded", "false");
  }
});
logoutBtn.addEventListener("click", () => console.log("Logging out…"));

campGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".book-btn");
  if (!btn) return;
  console.log("Book camp:", btn.getAttribute("data-camp-id"));
});

renderCamps();