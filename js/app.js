/* ===========================================================
   app.js
   Main application controller. Wires together state,
   navigation tabs, group selectors, theme toggle, and the
   export / import / reset functionality.
   =========================================================== */

const App = {
  state: null,

  init() {
    this.state = Storage.load() || createDefaultState();

    // Defensive defaults (e.g. after importing an older/partial file)
    if (!this.state.activeGroup) this.state.activeGroup = "A";
    if (!this.state.theme) this.state.theme = "dark";
    if (!this.state.groupMatches) this.state = createDefaultState();

    this.applyTheme();
    this.buildGroupSelectors();
    this.bindTabs();
    this.bindHeaderControls();
    this.renderActiveTab();
  },

  save() {
    Storage.save(this.state);
  },

  /* ---------------------------------------------------------
     Theme handling
  --------------------------------------------------------- */
  applyTheme() {
    const isDark = this.state.theme === "dark";
    document.body.classList.toggle("dark", isDark);
    const btn = document.getElementById("themeToggle");
    btn.textContent = isDark ? "" : "";
  },

  /* ---------------------------------------------------------
     Group selector buttons (shared layout used in two tabs)
  --------------------------------------------------------- */
  buildGroupSelectors() {
    const groups = getGroupLetters();

    ["groupSelector", "standingsGroupSelector"].forEach((containerId) => {
      const container = document.getElementById(containerId);
      container.innerHTML = "";

      groups.forEach((g) => {
        const btn = document.createElement("button");
        btn.className = "group-btn";
        btn.textContent = `Group ${g}`;
        btn.dataset.group = g;

        btn.addEventListener("click", () => {
          this.state.activeGroup = g;
          this.save();
          this.renderActiveTab();
        });

        container.appendChild(btn);
      });
    });
  },

  refreshGroupSelectorHighlight() {
    document.querySelectorAll(".group-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.group === this.state.activeGroup);
    });
  },

  /* ---------------------------------------------------------
     Tab navigation
  --------------------------------------------------------- */
  bindTabs() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".tab-btn")
          .forEach((b) => b.classList.remove("active"));
        document
          .querySelectorAll(".tab-section")
          .forEach((s) => s.classList.remove("active"));

        btn.classList.add("active");
        document.getElementById(btn.dataset.tab).classList.add("active");

        this.renderActiveTab();
      });
    });
  },

  getActiveTabId() {
    const active = document.querySelector(".tab-section.active");
    return active ? active.id : "groupStageTab";
  },

  renderActiveTab() {
    this.refreshGroupSelectorHighlight();

    switch (this.getActiveTabId()) {
      case "groupStageTab":
        this.renderGroupStage();
        break;
      case "standingsTab":
        this.renderStandings();
        break;
      case "thirdPlaceTab":
        this.renderThirdPlace();
        break;
      case "knockoutTab":
        this.renderKnockout();
        break;
    }
  },

  /* ---------------------------------------------------------
     Tab render functions
  --------------------------------------------------------- */
  renderGroupStage() {
    const g = this.state.activeGroup;
    document.getElementById("groupStageTitle").textContent = `Group ${g}`;

    MatchesModule.render(g, this.state, () => {
      this.save();
      StandingsModule.render(g, this.state, "miniStandingsTable");
    });

    StandingsModule.render(g, this.state, "miniStandingsTable");
  },

  renderStandings() {
    const g = this.state.activeGroup;
    document.getElementById("standingsTitle").textContent = `Group ${g}`;
    StandingsModule.render(g, this.state, "standingsTable");
  },

  renderThirdPlace() {
    ThirdPlaceModule.render(this.state);
  },

  renderKnockout() {
    if (!StandingsModule.allComplete(this.state)) {
      document.getElementById("knockoutNotice").style.display = "block";
    } else {
      document.getElementById("knockoutNotice").style.display = "none";
    }
    KnockoutModule.render(this.state);
  },

  /** Called from KnockoutModule after a winner is clicked */
  saveAndRerenderKnockout() {
    this.save();
    KnockoutModule.render(this.state);
  },

  /* ---------------------------------------------------------
     Header controls: theme / export / import / reset
  --------------------------------------------------------- */
  bindHeaderControls() {
    document.getElementById("themeToggle").addEventListener("click", () => {
      this.state.theme = this.state.theme === "dark" ? "light" : "dark";
      this.applyTheme();
      this.save();
    });

    document.getElementById("exportBtn").addEventListener("click", () => {
      Storage.exportJSON(this.state);
    });

    document.getElementById("importInput").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      Storage.importJSON(file, (data, err) => {
        if (err || !data || !data.groupMatches) {
          alert("That file does not look like a valid prediction export.");
          e.target.value = "";
          return;
        }

        this.state = data;
        if (!this.state.activeGroup) this.state.activeGroup = "A";
        if (!this.state.theme) this.state.theme = "dark";

        this.save();
        this.applyTheme();
        this.renderActiveTab();
        e.target.value = "";
        alert("Predictions imported successfully!");
      });
    });

    document.getElementById("resetBtn").addEventListener("click", () => {
      const confirmed = confirm(
        "Reset ALL predictions (group stage + knockout)? This cannot be undone.",
      );
      if (!confirmed) return;

      Storage.reset();
      this.state = createDefaultState();
      this.save();
      this.applyTheme();
      this.renderActiveTab();
    });
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
