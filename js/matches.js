/* ===========================================================
   matches.js
   Renders the match-by-match score input cards for the
   currently selected group, and wires up score input events.
   =========================================================== */

const MatchesModule = {
  /**
   * Render the 6 group-stage match cards for a given group.
   * @param {string} group - group letter ('A'..'L')
   * @param {Object} state - full app state
   * @param {Function} onChange - called whenever a score changes
   */
  render(group, state, onChange) {
    const container = document.getElementById("matchCards");
    container.innerHTML = "";

    const matches = state.groupMatches[group];

    matches.forEach((m, idx) => {
      const homeName = getTeamName(group, m.home);
      const awayName = getTeamName(group, m.away);

      const card = document.createElement("div");
      card.className = "match-card";
      card.innerHTML = `
        <div class="match-team home">
          <img class="flag" src="${getFlag(homeName)}"/>
          <span class="team-name">${homeName}</span>
        </div>
        <div class="score-inputs">
          <input  inputmode="numeric" min="0" max="20"
                 class="score-input" data-idx="${idx}" data-side="home"
                 value="${m.hs === null ? "" : m.hs}" aria-label="${homeName} score">
          <span class="vs">:</span>
          <input  inputmode="numeric" min="0" max="20"
                 class="score-input" data-idx="${idx}" data-side="away"
                 value="${m.as === null ? "" : m.as}" aria-label="${awayName} score">
        </div>
        <div class="match-team away">
        <img class="flag" src="${getFlag(awayName)}"/img>
          <span class="team-name">${awayName}</span>
        </div>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll(".score-input").forEach((input) => {
      input.addEventListener("input", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        const side = e.target.dataset.side;
        let val = e.target.value;

        if (val === "") {
          val = null;
        } else {
          val = parseInt(val, 10);
          if (isNaN(val) || val < 0) val = 0;
          if (val > 20) val = 20;
          // reflect clamped value back into the input
          e.target.value = val;
        }

        state.groupMatches[group][idx][side === "home" ? "hs" : "as"] = val;
        onChange();
      });
    });
  },
};
