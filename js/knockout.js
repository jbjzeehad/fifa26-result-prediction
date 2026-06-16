/* ===========================================================
   knockout.js
   Generates the Round of 32 bracket from group winners,
   runners-up and the best 8 third-placed teams, then manages
   click-to-advance progression through:
     R32 -> R16 -> Quarter Finals -> Semi Finals -> Final
   plus the Third Place Match (semifinal losers).
   =========================================================== */

const KnockoutModule = {
  /**
   * Build a fresh, empty knockout bracket skeleton.
   */
  initKnockout(state) {
    state.knockout = {
      r32: Array.from({ length: 16 }, () => ({
        home: null,
        away: null,
        winner: null,
      })),
      r16: Array.from({ length: 8 }, () => ({
        home: null,
        away: null,
        winner: null,
      })),
      qf: Array.from({ length: 4 }, () => ({
        home: null,
        away: null,
        winner: null,
      })),
      sf: Array.from({ length: 2 }, () => ({
        home: null,
        away: null,
        winner: null,
      })),
      third: { home: null, away: null, winner: null },
      final: { home: null, away: null, winner: null },
    };
  },

  /**
   * Build the 16 Round of 32 matchups from current group standings.
   *
   * Bracket logic:
   *  - Groups A-H: 8 matches pairing each group's winner against the
   *    runner-up of the next group in sequence (no same-group clash
   *    possible since offsets always differ).
   *  - Groups I-L: the 4 winners + 4 runners-up (8 teams) are paired
   *    against the 8 qualified third-placed teams.
   *  - A conflict-resolution pass swaps third-place opponents so that
   *    no team ever faces a team from its own group in the Round of 32.
   *
   * @param {Object} state
   * @returns {Array} 16 matches of shape { home: {name, group}, away: {name, group} }
   */
  generateR32Teams(state) {
    const groups = getGroupLetters(); // A..L
    const winners = {};
    const runnersUp = {};

    groups.forEach((g) => {
      const table = StandingsModule.compute(g, state);
      winners[g] = { name: table[0].name, group: g };
      runnersUp[g] = { name: table[1].name, group: g };
    });

    const bestThirds = ThirdPlaceModule.compute(state)
      .slice(0, 8)
      .map((t) => ({ name: t.name, group: t.group }));

    const matches = [];

    // 8 matches: winners of A-H vs runners-up of the next group (A-H, wrapped)
    const whGroups = groups.slice(0, 8); // A-H
    for (let i = 0; i < 8; i++) {
      const g1 = whGroups[i];
      const g2 = whGroups[(i + 1) % 8];
      matches.push({
        home: { ...winners[g1] },
        away: { ...runnersUp[g2] },
      });
    }

    // Remaining 8 teams: winners + runners-up of groups I-L
    const remGroups = groups.slice(8); // I, J, K, L
    const remTeams = [];
    remGroups.forEach((g) => remTeams.push({ ...winners[g] }));
    remGroups.forEach((g) => remTeams.push({ ...runnersUp[g] }));

    // 8 matches: those 8 teams vs the 8 best third-placed teams
    for (let i = 0; i < 8; i++) {
      matches.push({
        home: { ...remTeams[i] },
        away: { ...bestThirds[i] },
      });
    }

    // Conflict resolution: ensure no team meets a team from its own group
    for (let i = 8; i < 16; i++) {
      if (matches[i].home.group === matches[i].away.group) {
        for (let j = 8; j < 16; j++) {
          if (j === i) continue;
          const swapOk =
            matches[j].away.group !== matches[i].home.group &&
            matches[i].away.group !== matches[j].home.group;
          if (swapOk) {
            const tmp = matches[i].away;
            matches[i].away = matches[j].away;
            matches[j].away = tmp;
            break;
          }
        }
      }
    }

    return matches;
  },

  /**
   * Re-generate R32 teams from current standings and merge them into
   * the persisted bracket. If a slot's team has changed, that match's
   * winner selection (and everything downstream) is reset.
   * @param {Object} state
   */
  syncR32(state) {
    if (!state.knockout) this.initKnockout(state);

    const freshTeams = this.generateR32Teams(state);

    freshTeams.forEach((nt, i) => {
      const m = state.knockout.r32[i];

      if (
        !m.home ||
        m.home.name !== nt.home.name ||
        m.home.group !== nt.home.group
      ) {
        m.home = nt.home;
        m.winner = null;
      }
      if (
        !m.away ||
        m.away.name !== nt.away.name ||
        m.away.group !== nt.away.group
      ) {
        m.away = nt.away;
        m.winner = null;
      }
    });

    this.propagate(state);
  },

  /** @returns {Object|null} the winning team object of a match, or null */
  getWinner(m) {
    if (!m || !m.winner) return null;
    return m.winner === "home" ? m.home : m.away;
  },

  /** @returns {Object|null} the losing team object of a match, or null */
  getLoser(m) {
    if (!m || !m.winner) return null;
    return m.winner === "home" ? m.away : m.home;
  },

  /**
   * Push winners (and semifinal losers) forward through the bracket.
   * Whenever a slot's team identity changes, that match's own winner
   * selection is cleared so invalid progressions can't persist.
   * @param {Object} state
   */
  propagate(state) {
    const ko = state.knockout;

    const advance = (prevRound, nextRound) => {
      nextRound.forEach((m, i) => {
        const t1 = this.getWinner(prevRound[2 * i]);
        const t2 = this.getWinner(prevRound[2 * i + 1]);

        if (!this.sameTeam(m.home, t1)) {
          m.home = t1;
          m.winner = null;
        }
        if (!this.sameTeam(m.away, t2)) {
          m.away = t2;
          m.winner = null;
        }
      });
    };

    advance(ko.r32, ko.r16);
    advance(ko.r16, ko.qf);
    advance(ko.qf, ko.sf);

    // Final: semifinal winners
    const f1 = this.getWinner(ko.sf[0]);
    const f2 = this.getWinner(ko.sf[1]);
    if (!this.sameTeam(ko.final.home, f1)) {
      ko.final.home = f1;
      ko.final.winner = null;
    }
    if (!this.sameTeam(ko.final.away, f2)) {
      ko.final.away = f2;
      ko.final.winner = null;
    }

    // Third place match: semifinal losers
    const l1 = this.getLoser(ko.sf[0]);
    const l2 = this.getLoser(ko.sf[1]);
    if (!this.sameTeam(ko.third.home, l1)) {
      ko.third.home = l1;
      ko.third.winner = null;
    }
    if (!this.sameTeam(ko.third.away, l2)) {
      ko.third.away = l2;
      ko.third.winner = null;
    }
  },

  /** @returns {boolean} true if two team objects (or nulls) represent the same team */
  sameTeam(a, b) {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a.name === b.name && a.group === b.group;
  },

  /**
   * Set the winner of a knockout match and propagate the result forward.
   * @param {Object} state
   * @param {string} round - 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'third'
   * @param {number} idx - match index within the round (ignored for final/third)
   * @param {string} side - 'home' | 'away'
   */
  setWinner(state, round, idx, side) {
    const m =
      round === "final" || round === "third"
        ? state.knockout[round]
        : state.knockout[round][idx];

    if (!m || !m.home || !m.away) return; // both teams must be known

    m.winner = m.winner === side ? null : side; // click again to undo
    this.propagate(state);
  },

  /**
   * Render the full knockout bracket plus champion banner.
   * @param {Object} state
   */
  render(state) {
    if (!state.knockout) this.initKnockout(state);
    this.syncR32(state);

    const container = document.getElementById("knockoutBracket");
    container.innerHTML = "";

    const buildColumn = (title, matches, roundKey) => {
      const col = document.createElement("div");
      col.className = "bracket-column";

      const heading = document.createElement("h3");
      heading.textContent = title;
      col.appendChild(heading);

      matches.forEach((m, idx) => {
        const box = document.createElement("div");
        box.className = "ko-match";

        ["home", "away"].forEach((side) => {
          const team = m[side];
          const row = document.createElement("div");

          const ready = !!(m.home && m.away);
          row.className = "ko-team";
          if (m.winner === side) row.classList.add("winner");
          if (!team) row.classList.add("tbd");
          if (ready) row.classList.add("clickable");

          row.innerHTML = team
            ? `<span class='flag-content'><img class="flag" src="${getFlag(team.name)}" alt="${team.name}"> ${team.name}</span>`
            : "TBD";

          if (ready) {
            row.addEventListener("click", () => {
              this.setWinner(state, roundKey, idx, side);
              App.saveAndRerenderKnockout();
            });
          }

          box.appendChild(row);
        });

        col.appendChild(box);
      });

      container.appendChild(col);
    };

    buildColumn("Round of 32", state.knockout.r32, "r32");
    buildColumn("Round of 16", state.knockout.r16, "r16");
    buildColumn("Quarter Finals", state.knockout.qf, "qf");
    buildColumn("Semi Finals", state.knockout.sf, "sf");
    buildColumn("Final", [state.knockout.final], "final");
    buildColumn("3rd Place", [state.knockout.third], "third");

    // Champion banner
    const champ = this.getWinner(state.knockout.final);
    const champDiv = document.getElementById("championDisplay");
    if (champ) {
      champDiv.innerHTML = `
        <span class="trophy-winner">
      
  <img class="big-flag" src="${getFlag(champ.name)}" />
  <span class="team-name">${champ.name}</span>
  <img class="big-flag" src="${getFlag(champ.name)}" />

        </span>
      `;
      champDiv.style.display = "flex";
    } else {
      champDiv.style.display = "none";
    }
  },
};
