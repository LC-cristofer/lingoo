/** The route of a stop. Stop ids look like "forest-animals/lesson-1", so the slash is part of the path. */
export function stopHref(stopId: string): string {
  return `/parada/${stopId}`;
}
