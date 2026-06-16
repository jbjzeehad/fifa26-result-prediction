/* ===========================================================
   FIFA World Cup 2026 - Group Stage Fixture Template
   Standard round-robin pairing (by team index 0-3) applied
   identically to every group (A - L).
   6 matches per group:
     MD1: 0 vs 1, 2 vs 3
     MD2: 0 vs 2, 1 vs 3
     MD3: 0 vs 3, 1 vs 2
   =========================================================== */

const FIXTURE_PAIRS = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2]
];
