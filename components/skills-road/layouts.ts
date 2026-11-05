export interface GridCoord {
  col: number;
  row: number;
}

export interface TileLayoutPoint {
  col: number;
  row: number;
  x: number;
  z: number;
}

export const TILE_SIZE = 0.92;
export const TILE_SPACING = 1.16;

/**
 * Classic road grid coordinates (37 tiles):
 * START (-1,0), col 0 (rows 0..6), connector (1,6), col 2 (rows 6..1),
 * connector (3,1), col 4 (rows 1..6), connector (5,6), col 6 (rows 6..1),
 * connector (7,1), col 8 (rows 1..6), FINISH (9,6).
 */
export function getClassicGridCoords(): GridCoord[] {
  const coords: GridCoord[] = [];

  // START
  coords.push({ col: -1, row: 0 });

  // Col 0: rows 0..6 (7 tiles)
  for (let r = 0; r <= 6; r++) coords.push({ col: 0, row: r });

  // Connector (1,6)
  coords.push({ col: 1, row: 6 });

  // Col 2: rows 6..1 (6 tiles)
  for (let r = 6; r >= 1; r--) coords.push({ col: 2, row: r });

  // Connector (3,1)
  coords.push({ col: 3, row: 1 });

  // Col 4: rows 1..6 (6 tiles)
  for (let r = 1; r <= 6; r++) coords.push({ col: 4, row: r });

  // Connector (5,6)
  coords.push({ col: 5, row: 6 });

  // Col 6: rows 6..1 (6 tiles)
  for (let r = 6; r >= 1; r--) coords.push({ col: 6, row: r });

  // Connector (7,1)
  coords.push({ col: 7, row: 1 });

  // Col 8: rows 1..6 (6 tiles)
  for (let r = 1; r <= 6; r++) coords.push({ col: 8, row: r });

  // FINISH (9,6)
  coords.push({ col: 9, row: 6 });

  return coords;
}

/**
 * Self-avoiding walk DFS on an 11x8 grid with node budget, run length 1-3,
 * and rule relaxation on failed attempts.
 */
export function generateShuffleGridCoords(
  cols = 11,
  rows = 8,
  length = 37
): GridCoord[] {
  const directions = [
    { dc: 0, dr: 1 },  // down (+row)
    { dc: 1, dr: 0 },  // right (+col)
    { dc: 0, dr: -1 }, // up (-row)
    { dc: -1, dr: 0 }, // left (-col)
  ];

  for (let attempt = 0; attempt < 60; attempt++) {
    const visited = new Set<string>();
    const path: GridCoord[] = [];

    // Start on left edge
    const startCol = 0;
    const startRow = Math.min(rows - 2, Math.max(1, Math.floor(Math.random() * (rows - 2))));
    let curr = { col: startCol, row: startRow };
    path.push(curr);
    visited.add(`${curr.col},${curr.row}`);

    let lastDir = { dc: 1, dr: 0 };
    let runLength = 0;
    let maxRun = Math.floor(Math.random() * 3) + 1;

    let stuck = false;
    while (path.length < length) {
      const candidates: Array<{
        dir: { dc: number; dr: number };
        next: GridCoord;
        score: number;
      }> = [];

      for (const dir of directions) {
        const nextCol = curr.col + dir.dc;
        const nextRow = curr.row + dir.dr;
        if (nextCol < 0 || nextCol >= cols || nextRow < 0 || nextRow >= rows) continue;
        const key = `${nextCol},${nextRow}`;
        if (visited.has(key)) continue;

        // Strict non-consecutive touching rule for first 30 attempts
        if (attempt < 30) {
          let touchingNonConsecutive = false;
          for (const d of directions) {
            const adjCol = nextCol + d.dc;
            const adjRow = nextRow + d.dr;
            const adjKey = `${adjCol},${adjRow}`;
            if (visited.has(adjKey) && !(adjCol === curr.col && adjRow === curr.row)) {
              touchingNonConsecutive = true;
              break;
            }
          }
          if (touchingNonConsecutive) continue;
        }

        let score = Math.random();
        if (dir.dc === lastDir.dc && dir.dr === lastDir.dr) {
          score += runLength < maxRun ? 2 : -2;
        } else {
          score += runLength >= maxRun ? 2 : 0;
        }
        // Slight eastward bias
        if (dir.dc > 0) score += 0.8;

        candidates.push({ dir, next: { col: nextCol, row: nextRow }, score });
      }

      if (candidates.length === 0) {
        stuck = true;
        break;
      }

      candidates.sort((a, b) => b.score - a.score);
      const chosen = candidates[0];
      if (chosen.dir.dc === lastDir.dc && chosen.dir.dr === lastDir.dr) {
        runLength++;
      } else {
        lastDir = chosen.dir;
        runLength = 1;
        maxRun = Math.floor(Math.random() * 3) + 1;
      }

      curr = chosen.next;
      path.push(curr);
      visited.add(`${curr.col},${curr.row}`);
    }

    if (!stuck && path.length === length) {
      return path;
    }
  }

  // Graceful fallback to Classic if randomized search exhausts budget
  return getClassicGridCoords();
}

/**
 * Converts grid coordinates to centered 3D world coordinates (X, Z).
 */
export function coordsToWorldLayout(coords: GridCoord[]): TileLayoutPoint[] {
  let minCol = Infinity;
  let maxCol = -Infinity;
  let minRow = Infinity;
  let maxRow = -Infinity;

  for (const c of coords) {
    if (c.col < minCol) minCol = c.col;
    if (c.col > maxCol) maxCol = c.col;
    if (c.row < minRow) minRow = c.row;
    if (c.row > maxRow) maxRow = c.row;
  }

  const centerCol = (minCol + maxCol) / 2;
  const centerRow = (minRow + maxRow) / 2;

  return coords.map((c) => ({
    col: c.col,
    row: c.row,
    x: (c.col - centerCol) * TILE_SPACING,
    z: (c.row - centerRow) * TILE_SPACING,
  }));
}

