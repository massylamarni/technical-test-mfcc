// Minimal haversine distance helper — avoids pulling in a full geo library
// (e.g. turf) just for one calculation. Used to compute each trajectory
// point's REAL cumulative-distance fraction along the route, so MapLibre's
// line-gradient stops reflect actual distance traveled, not just point index
// (which would be wrong if points are unevenly spaced, e.g. during a port
// stop where many points cluster at ~0 speed in the same location).

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Given an ordered list of [lon, lat] points, returns each point's
 * cumulative-distance fraction along the full route (0 for the first point,
 * 1 for the last). Points with identical coordinates (e.g. stationary at
 * port) correctly collapse to the same fraction — no divide-by-zero, since
 * total distance across a real multi-point voyage is never 0 in practice;
 * guarded anyway for a degenerate 1-point or fully-stationary trajectory.
 */
export function cumulativeDistanceFractions(
  points: [number, number][],
): number[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [0];

  const cumulative: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const [lon1, lat1] = points[i - 1];
    const [lon2, lat2] = points[i];
    const dist = haversineDistanceKm(lat1, lon1, lat2, lon2);
    cumulative.push(cumulative[i - 1] + dist);
  }

  const total = cumulative[cumulative.length - 1];
  if (total === 0) {
    // Degenerate case: vessel never moved across the whole window. Spread
    // fractions evenly by index instead of collapsing everything to 0.
    return points.map((_, i) => i / (points.length - 1));
  }

  return cumulative.map((d) => d / total);
}
