/* =====================================================================
   CURONEX — Doctor Camp Review
   Handles: user dropdown, camp data, "today's ongoing" filtering,
   Camp ID search, table rendering, and "Enter Data" navigation.
   ===================================================================== */

(function () {
  "use strict";

  /* -------------------------------------------------------------------
     1. MOCK CAMP DATA
     In production this would come from an API call, e.g.
     fetch('/api/doctor/camps?doctorId=...').then(r => r.json())
     ------------------------------------------------------------------- */
  const ALL_CAMPS = [
    {
      campId: "CMP-2031",
      campName: "General Health Camp",
      location: "Hyderabad",
      date: "2026-07-03", // today (see TODAY below)
      status: "ongoing",
      assignedDoctor: "Dr. Sharma"
    },
    {
      campId: "CMP-2032",
      campName: "Diabetes Screening Camp",
      location: "Hyderabad",
      date: "2026-07-05",
      status: "upcoming",
      assignedDoctor: "Dr. Sharma"
    },
    {
      campId: "CMP-2018",
      campName: "Orthopedic Checkup Camp",
      location: "Sirkazhi",
      date: "2026-06-20",
      status: "closed",
      assignedDoctor: "Dr. Mohan"
    }
  ];

  // "Today" is treated as the camp's date field for demo purposes.
  const TODAY = "2026-07-03";

  const state = {
    query: ""
  };

  /* -------------------------------------------------------------------
     2. DOM REFERENCES
     ------------------------------------------------------------------- */
  const els = {
    userTrigger: document.getElementById("userTrigger"),
    userDropdown: document.getElementById("userDropdown"),
    logoutBtn: document.getElementById("logoutBtn"),
    snapshotStrip: document.getElementById("snapshotStrip"),
    searchInput: document.getElementById("campSearchInput"),
    searchBtn: document.getElementById("searchBtn"),
    resetBtn: document.getElementById("resetBtn"),
    campTableBody: document.getElementById("campTableBody"),
    campCountLabel: document.getElementById("campCountLabel"),
    emptyState: document.getElementById("emptyState"),
    todayCampCount: document.getElementById("todayCampCount")
  };

  /* -------------------------------------------------------------------
     3. USER DROPDOWN (navbar)
     ------------------------------------------------------------------- */
  function initUserMenu() {
    if (!els.userTrigger || !els.userDropdown) return;

    els.userTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = els.userDropdown.classList.toggle("open");
      els.userTrigger.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (e) => {
      if (!els.userDropdown.contains(e.target) && e.target !== els.userTrigger) {
        els.userDropdown.classList.remove("open");
        els.userTrigger.setAttribute("aria-expanded", "false");
      }
    });

    if (els.logoutBtn) {
      els.logoutBtn.addEventListener("click", () => {
        // Hook up real logout logic / redirect here.
        window.location.href = "login.html";
      });
    }
  }

  /* -------------------------------------------------------------------
     4. DATA HELPERS
     ------------------------------------------------------------------- */
  function getTodaysOngoingCamps() {
    return ALL_CAMPS.filter(c => c.date === TODAY && c.status === "ongoing");
  }

  function formatDate(isoDate) {
    const d = new Date(isoDate + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }

  function statusChip(status) {
    const map = {
      ongoing: { label: "Ongoing", cls: "status-ongoing" },
      upcoming: { label: "Upcoming", cls: "status-upcoming" },
      closed: { label: "Closed", cls: "status-closed" }
    };
    const info = map[status] || map.closed;
    return `<span class="status-chip ${info.cls}">${info.label}</span>`;
  }

  /* -------------------------------------------------------------------
     5. RENDERING
     ------------------------------------------------------------------- */
  function renderSnapshotStrip() {
    const todaysCamps = getTodaysOngoingCamps();
    const stats = [
      { label: "Today's Camps", value: todaysCamps.length, accent: true },
      { label: "Patients Completed", value: 18 },
      { label: "Slots Remaining", value: 22 },
      { label: "Department", value: "General Medicine" }
    ];

    els.snapshotStrip.innerHTML = stats
      .map(
        (s) => `
      <div class="stat-pill${s.accent ? " accent" : ""}">
        <div class="stat-label">${s.label}</div>
        <div class="stat-value">${s.value}</div>
      </div>`
      )
      .join("");

    if (els.todayCampCount) {
      els.todayCampCount.textContent = String(todaysCamps.length);
    }
  }

  function renderTable(camps) {
    if (!camps.length) {
      els.campTableBody.innerHTML = "";
      els.emptyState.style.display = "flex";
      els.campCountLabel.textContent = "No camps found";
      return;
    }

    els.emptyState.style.display = "none";
    els.campCountLabel.textContent =
      camps.length === 1 ? "Showing 1 ongoing camp" : `Showing ${camps.length} camps`;

    els.campTableBody.innerHTML = camps
      .map((camp) => {
        const canEnterData = camp.status === "ongoing";
        return `
        <tr data-camp-id="${camp.campId}">
          <td>${camp.campId}</td>
          <td>${camp.campName}</td>
          <td>${camp.location}</td>
          <td>${formatDate(camp.date)}</td>
          <td>${statusChip(camp.status)}</td>
          <td>
            <button
              class="enter-data-btn"
              data-camp-id="${camp.campId}"
              ${canEnterData ? "" : "disabled"}
              title="${canEnterData ? "Enter patient data for this camp" : "Camp is not currently ongoing"}"
            >
              Enter Data
            </button>
          </td>
        </tr>`;
      })
      .join("");

    // Wire up "Enter Data" buttons after render.
    els.campTableBody.querySelectorAll(".enter-data-btn").forEach((btn) => {
      btn.addEventListener("click", onEnterDataClick);
    });
  }

  /* -------------------------------------------------------------------
     6. SEARCH / RESET
     ------------------------------------------------------------------- */
  function getVisibleCamps() {
    const q = state.query.trim().toLowerCase();

    // Default view = only today's ongoing camps (doctor's assigned camp).
    if (!q) {
      return getTodaysOngoingCamps();
    }

    // Search view = match Camp ID across ALL camps (so a doctor can look
    // up a camp even if it isn't "today").
    return ALL_CAMPS.filter((c) => c.campId.toLowerCase().includes(q));
  }

  function refresh() {
    renderTable(getVisibleCamps());
  }

  function onSearch() {
    state.query = els.searchInput.value;
    refresh();
  }

  function onReset() {
    state.query = "";
    els.searchInput.value = "";
    refresh();
  }

  function initSearch() {
    els.searchBtn.addEventListener("click", onSearch);
    els.resetBtn.addEventListener("click", onReset);
    els.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSearch();
      }
    });
    // Live-filter as the doctor types (optional convenience).
    els.searchInput.addEventListener("input", () => {
      state.query = els.searchInput.value;
      refresh();
    });
  }

  /* -------------------------------------------------------------------
     7. NAVIGATION — "Enter Data" opens the camp entry page
     ------------------------------------------------------------------- */
 /* function onEnterDataClick(e) {
    const campId = e.currentTarget.getAttribute("data-camp-id");
    if (!campId) return;

    // Navigate to the camp details / patient entry page, passing the
    // Camp ID so that page can load the right camp's data.
    window.location.href = `camp-details.html?campId=${encodeURIComponent(campId)}`;
  }
*/
  /* -------------------------------------------------------------------
     8. INIT
     ------------------------------------------------------------------- */
  function init() {
    initUserMenu();
    initSearch();
    renderSnapshotStrip();
    refresh();
  }

  document.addEventListener("DOMContentLoaded", init);
})();