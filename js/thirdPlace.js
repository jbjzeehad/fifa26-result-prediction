/* ===========================================================
   thirdPlace.js
   Collects the 3rd-placed team from each of the 12 groups,
   ranks them using the same tie-break logic as group
   standings, and determines the best 8 qualifiers.
   =========================================================== */

const ThirdPlaceModule = {
  /**
   * Compute the ranked list of all 12 third-placed teams.
   * The top 8 entries (index 0-7) are the qualified ones.
   * @param {Object} state
   * @returns {Array} sorted array of { ...stats, group }
   */
  compute(state) {
    const thirds = getGroupLetters().map((g) => {
      const table = StandingsModule.compute(g, state);
      const t = table[2]; // 3rd place in this group
      return { ...t, group: g };
    });

    thirds.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.name.localeCompare(b.name);
    });

    return thirds;
  },

  /**
   * Render the ranking table of all 12 third-placed teams,
   * highlighting the best 8 qualifiers.
   * @param {Object} state
   * @returns {Array} the 8 qualified third-placed teams
   */
  render(state) {
    const thirds = this.compute(state);
    const container = document.getElementById("thirdPlaceTable");
    if (!container) return thirds.slice(0, 8);

    let html = `
      <table class="standings-table">
        <thead>
          <tr>
            <th>#</th><th>Grp</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th>
            <th>GF</th><th>GA</th><th>GD</th><th>Pts</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    thirds.forEach((t, i) => {
      const qualified = i < 8;
      html += `
        <tr class="${qualified ? "third-qualified" : "eliminated"}">
          <td>${i + 1}</td>
          <td>${t.group}</td>
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
          <td>${qualified ? "Qualified" : "Eliminated"}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;

    return thirds.slice(0, 8);
  },
};
