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

export const TILE_SIZE = 0.72;
export const TILE_SPACING = 0.94;

/**
 * Classic road grid coordinates (29 tiles: START + 27 skills + FINISH):
 * Balanced 4-column serpentine track with identical column heights and symmetrical start/finish:
 * START (-1,0),
 * Col 0 (rows 0..5, 6 tiles), connector (1,5),
 * Col 2 (rows 5..0, 6 tiles), connector (3,0),
 * Col 4 (rows 0..5, 6 tiles), connector (5,5),
 * Col 6 (rows 5..0, 6 tiles),
 * FINISH (7,0).
 */
export function getClassicGridCoords(): GridCoord[] {
  const coords: GridCoord[] = [];

  // START (-1, 0)
  coords.push({ col: -1, row: 0 });

  // Col 0: rows 0..5 (6 tiles)
  for (let r = 0; r <= 5; r++) coords.push({ col: 0, row: r });

  // Connector (1,5)
  coords.push({ col: 1, row: 5 });

  // Col 2: rows 5..0 (6 tiles)
  for (let r = 5; r >= 0; r--) coords.push({ col: 2, row: r });

  // Connector (3,0)
  coords.push({ col: 3, row: 0 });

  // Col 4: rows 0..5 (6 tiles)
  for (let r = 0; r <= 5; r++) coords.push({ col: 4, row: r });

  // Connector (5,5)
  coords.push({ col: 5, row: 5 });

  // Col 6: rows 5..0 (6 tiles)
  for (let r = 5; r >= 0; r--) coords.push({ col: 6, row: r });

  // FINISH (7, 0)
  coords.push({ col: 7, row: 0 });

  return coords;
}

/**
 * Self-avoiding walk DFS on an grid with node budget, run length 1-3,
 * and rule relaxation on failed attempts.
 */
export function generateShuffleGridCoords(
  cols = 9,
  rows = 7,
  length = 29
): GridCoord[] {
  const directions = [
    { dc: 0, dr: 1 },  // down (+row)
    { dc: 1, dr: 0 },  // right (+col)
    { dc: 0, dr: -1 }, // up (-row)
    { dc: -1, dr: 0 }, // left (-col)
  ];

  for (let attempt = 0; attempt < 80; attempt++) {
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

        // Strict non-consecutive touching rule for first 40 attempts
        if (attempt < 40) {
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
