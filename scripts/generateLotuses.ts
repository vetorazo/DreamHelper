/**
 * Script runner to generate lotus database
 *
 * This is a Node.js script that will:
 * 1. Import our parser
 * 2. Generate the lotus data
 * 3. Write it to the lotuses.ts file
 */

import { writeFileSync } from "fs";
import { generateLotusDatabase } from "./parseLotuses.ts";

// CONCEPT: Node.js file system (fs) module
// writeFileSync writes data to a file synchronously (waits until done)
const output = generateLotusDatabase();
const outputPath = "./src/data/lotuses.ts";

writeFileSync(outputPath, output, "utf-8");

console.log(`✓ Generated ${outputPath} successfully!`);
