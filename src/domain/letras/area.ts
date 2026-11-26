/* Which area a unit or stop belongs to: the one place that knows the Árvore das Letras' ids (`letras-1`…`letras-4`,
   stops `letras-<n>/<slug>`). The exit target, the stop screen and the island all ask here. */
import type { Branch } from "./access";

export type Area = "farol" | "letras";

const LETRAS_UNIT = /^letras-([1-4])$/;

/** Whether `unitId` is one of the tree's four branches. */
export const isLetrasUnit = (unitId: string): boolean => LETRAS_UNIT.test(unitId);

/** The branch (1..4) a unit is, or null for any other unit. */
export function branchOfUnit(unitId: string): Branch | null {
  const m = LETRAS_UNIT.exec(unitId);
  return m ? (Number(m[1]) as Branch) : null;
}

/** The area a stop belongs to: the tree for a stop of one of its branches, the farol for the rest. */
export const areaOfStop = (stopId: string): Area => (isLetrasUnit(stopId.split("/")[0]) ? "letras" : "farol");
