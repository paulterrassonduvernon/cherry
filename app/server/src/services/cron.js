import cron from "node-cron";
import { config } from "../config.js";
import { listSpaces } from "./spaces.js";
import { listEntries } from "./entries.js";
import { generateSynthesis } from "./synthesis.js";

export function startSynthesisCron() {
  if (!cron.validate(config.synthesisCron)) {
    console.warn(`SYNTHESIS_CRON invalide ("${config.synthesisCron}") — cron de synthèse désactivé.`);
    return;
  }

  cron.schedule(config.synthesisCron, async () => {
    console.log("Régénération automatique des synthèses...");
    for (const space of listSpaces()) {
      if (space.archived || listEntries(space.id).length === 0) continue;
      try {
        await generateSynthesis(space.id);
        console.log(`  ✓ ${space.name}`);
      } catch (err) {
        console.error(`  ✗ ${space.name}: ${err.message}`);
      }
    }
  });
}
