import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getBank } from "@/domain/letras/bank";
import { buildLetrasUnits } from "@/domain/letras/build";
import { parseUnit } from "@/domain/trail/schema";

// Writes content/units/letras-1.json … letras-4.json from content/areas/letras/bank.json.
// The unit files are generated: edit the bank (or the templates) and run `npm run content:letras`.

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
for (const unit of buildLetrasUnits(getBank())) {
  parseUnit(unit);
  const out = resolve(root, "content/units", `${unit.id}.json`);
  writeFileSync(out, JSON.stringify(unit, null, 2) + "\n");
  console.log(`${unit.id}: ${unit.stops.length} stops, ${unit.words.length} words -> ${out}`);
}
