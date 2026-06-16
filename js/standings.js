/* ===========================================================
   standings.js
   Computes group standings from predicted match scores and
   renders the standings table with qualification highlighting.

   Sorting rules (in order):
     1. Points
     2. Goal Difference
     3. Goals Scored
     4. Alphabetical (final fair tie-break for display only)
   =========================================================== */

const StandingsModule = {
  /**
   * Compute the sorted standings table for a group.
   * @param {string} group
   * @param {Object} state
   * @returns {Array} sorted array of team stat objects
   */
  compute(group, state) {
    const table = TEAMS[group].map((name, idx) => ({
      idx,
      name,
      played: 0,
      won: 0,
      draw: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
    }));

    state.groupMatches[group].forEach((m) => {
      if (m.hs === null || m.as === null) return; // not predicted yet

      const home = table[m.home];
      const away = table[m.away];

      home.played++;
      away.played++;
      home.gf += m.hs;
      home.ga += m.as;
      away.gf += m.as;
      away.ga += m.hs;

      if (m.hs > m.as) {
        home.won++;
        home.pts += 3;
        away.lost++;
      } else if (m.hs < m.as) {
        away.won++;
        away.pts += 3;
        home.lost++;
      } else {
        home.draw++;
        away.draw++;
        home.pts += 1;
        away.pts += 1;
      }
    });

    table.forEach((t) => (t.gd = t.gf - t.ga));

    table.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.name.localeCompare(b.name);
    });

    return table;
  },

  /**
   * Check whether every group-stage match across all 12 groups
   * has a predicted score.
   * @param {Object} state
   * @returns {boolean}
   */
  allComplete(state) {
    return getGroupLetters().every((g) =>
      state.groupMatches[g].every((m) => m.hs !== null && m.as !== null),
    );
  },

  /**
   * Render the standings table for a group into a target container.
   * @param {string} group
   * @param {Object} state
   * @param {string} containerId - DOM id of the container to render into
   * @returns {Array} the computed standings table
   */
  render(group, state, containerId = "standingsTable") {
    const table = this.compute(group, state);
    const container = document.getElementById(containerId);
    if (!container) return table;

    // Determine which 3rd-placed teams overall qualify as "best 8 thirds"
    const qualifiedThirdNames = ThirdPlaceModule.compute(state)
      .slice(0, 8)
      .map((t) => t.name);

    let html = `
      <table class="standings-table">
        <thead>
          <tr>
            <th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th>
            <th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
    `;

    table.forEach((t, i) => {
      let rowClass = "";
      if (i < 2) {
        rowClass = "qualified";
      } else if (i === 2) {
        rowClass = qualifiedThirdNames.includes(t.name)
          ? "third-qualified"
          : "third-pending";
      } else {
        rowClass = "eliminated";
      }

      html += `
        <tr class="${rowClass}">
          <td>${i + 1}</td>
<td class="team-cell">
  <img class="flag" src="${getFlag(t.name)}" />
  <span class="team-name">${t.name}</span>
</td>
          <td>${t.played}</td>
          <td>${t.won}</td>
          <td>${t.draw}</td>
          <td>${t.lost}</td>
          <td>${t.gf}</td>
          <td>${t.ga}</td>
          <td>${t.gd > 0 ? "+" + t.gd : t.gd}</td>
          <td><strong>${t.pts}</strong></td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;

    return table;
  },
};
