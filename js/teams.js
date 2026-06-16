/* ===========================================================
   teams.js
   Small helper utilities for working with the TEAMS data set,
   plus the factory for the default (empty) tournament state.
   =========================================================== */

/** @returns {string[]} array of group letters, e.g. ['A','B',...,'L'] */
function getGroupLetters() {
  return Object.keys(TEAMS);
}

/** @returns {string} team name for a given group + index (0-3) */
function getTeamName(group, idx) {
  return TEAMS[group][idx];
}

/** @returns {string} flag emoji for a team name (fallback to a generic flag) */
function getFlag(name) {
  return FLAGS[name] || '🏳️';
}

/**
 * Build a brand-new, empty tournament prediction state.
 * Shape:
 * {
 *   theme: 'light' | 'dark',
 *   activeGroup: 'A'..'L',
 *   groupMatches: { A: [ {home, away, hs, as}, ...6 ], ... },
 *   knockout: null  // populated lazily by KnockoutModule
 * }
 */
function createDefaultState() {
  const groupMatches = {};
  getGroupLetters().forEach((g) => {
    groupMatches[g] = FIXTURE_PAIRS.map(([home, away]) => ({
      home,
      away,
      hs: null, // home score
      as: null  // away score
    }));
  });

  return {
    theme: 'light',
    activeGroup: 'A',
    groupMatches,
    knockout: null
  };
}
