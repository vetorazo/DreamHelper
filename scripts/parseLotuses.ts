/**
 * Lotus Data Parser
 *
 * This script fetches lotus data from tlidb.com and converts it into our TypeScript types.
 *
 * TYPESCRIPT CONCEPTS USED HERE:
 *
 * 1. Type Annotations: We explicitly declare what type each variable holds
 *    Example: const name: string = "hello"
 *
 * 2. Interfaces: Define the "shape" of objects (what properties they must have)
 *    Example: interface Person { name: string; age: number; }
 *
 * 3. Union Types: A value can be one of several types
 *    Example: type Status = 'active' | 'inactive'
 *
 * 4. Optional Properties: Use ? to mark properties that might not exist
 *    Example: interface User { email?: string }
 *
 * 5. String Literals: Exact string values as types (not just "any string")
 *    Example: type Color = 'red' | 'blue' (only these two specific strings)
 */

import type {
  LotusEffect,
  BubbleType,
  BubbleQuality,
} from "../src/types/index.js";

// INTERFACE: Defines the structure of raw HTML data we'll extract
// Think of it as a "contract" - any object of this type MUST have these properties
interface RawLotusData {
  description: string; // The full text description from the website
  nightmareOmen?: string; // Optional (?) because not all lotuses might have this
}

/**
 * FUNCTION: parseDescription
 *
 * Takes a lotus description string and converts it into our structured LotusEffect type
 *
 * CONCEPTS:
 * - Function type annotations: (param: Type): ReturnType
 * - String methods: toLowerCase(), includes(), match() for text parsing
 * - Conditional logic: if/else to determine effect type
 */
function parseDescription(description: string): LotusEffect["effect"] {
  const lowerDesc = description.toLowerCase();

  // REGEX (Regular Expressions): Pattern matching for text
  // \d+ means "one or more digits"
  // Example: "Adds 2 bubbles" -> match[0] = "2"

  // Parse "Add" effects
  if (lowerDesc.includes("adds")) {
    const countMatch = description.match(/adds (\d+)(?:-(\d+))?/i);
    // TUPLE TYPE: [number, number] means exactly 2 numbers, not just any array
    const count: number | [number, number] = countMatch
      ? countMatch[2]
        ? ([parseInt(countMatch[1]), parseInt(countMatch[2])] as [
            number,
            number
          ])
        : parseInt(countMatch[1])
      : 1;

    // TYPE NARROWING: Determine specific quality based on keywords
    let quality:
      | BubbleQuality
      | "highest"
      | "purple_or_better"
      | "blue_or_better"
      | undefined;

    if (lowerDesc.includes("rainbow")) quality = "Rainbow";
    else if (lowerDesc.includes("red")) quality = "Red";
    else if (lowerDesc.includes("orange")) quality = "Orange";
    else if (lowerDesc.includes("purple or better"))
      quality = "purple_or_better";
    else if (lowerDesc.includes("blue or better")) quality = "blue_or_better";
    else if (lowerDesc.includes("highest")) quality = "highest";

    // OBJECT LITERAL: Creating an object with type-safe properties
    // The 'type' discriminates which effect variant this is
    let bubbleType: BubbleType | "random" | undefined;
    if (lowerDesc.includes("gear")) bubbleType = "Gear";
    else if (lowerDesc.includes("blacksail")) bubbleType = "Blacksail";
    else if (lowerDesc.includes("cube")) bubbleType = "Cube";
    else if (lowerDesc.includes("commodity")) bubbleType = "Commodity";
    else if (lowerDesc.includes("netherrealm")) bubbleType = "Netherrealm";
    else if (lowerDesc.includes("fluorescent")) bubbleType = "Fluorescent";
    else if (lowerDesc.includes("whim")) bubbleType = "Whim";

    return { type: "add", count, quality, bubbleType };
  }

  // Parse "Upgrade" effects
  if (lowerDesc.includes("upgrade")) {
    const countMatch = description.match(/upgrades.*?(\d+) bubble/i);
    const tiersMatch = description.match(/by (\d+) tier/i);

    return {
      type: "upgrade",
      count: countMatch ? parseInt(countMatch[1]) : 1,
      tiers: tiersMatch ? parseInt(tiersMatch[1]) : 1,
    };
  }

  // Parse "Remove" effects
  if (lowerDesc.includes("remove")) {
    const countMatch = description.match(/removes? (\d+)/i);
    return {
      type: "remove",
      count: countMatch ? parseInt(countMatch[1]) : 1,
    };
  }

  // Parse "Replicate" effects
  if (lowerDesc.includes("replicate")) {
    const countMatch = description.match(/(\d+) bubble/i);
    return {
      type: "replicate",
      count: countMatch ? parseInt(countMatch[1]) : 1,
    };
  }

  // Parse "Changes the type" effects
  if (lowerDesc.includes("changes the type")) {
    const countMatch = description.match(/(\d+) bubble/i);
    const upgradeAfter = lowerDesc.includes("upgrades");

    let newType: BubbleType = "Gear"; // Default
    if (lowerDesc.includes("blacksail")) newType = "Blacksail";
    else if (lowerDesc.includes("cube")) newType = "Cube";
    else if (lowerDesc.includes("commodity")) newType = "Commodity";
    else if (lowerDesc.includes("netherrealm")) newType = "Netherrealm";
    else if (lowerDesc.includes("fluorescent")) newType = "Fluorescent";
    else if (lowerDesc.includes("whim")) newType = "Whim";

    return {
      type: "changeType",
      count: countMatch ? parseInt(countMatch[1]) : 1,
      newType,
      upgradeAfter,
    };
  }

  // FUNDAMENTAL EFFECTS: These trigger "upon entering nightmare"
  if (lowerDesc.includes("upon entering a nightmare")) {
    if (lowerDesc.includes("for every")) {
      // Parse multiplication fundamentals
      const everyMatch = description.match(/every (\d+)/i);
      const divider = everyMatch ? parseInt(everyMatch[1]) : 3;

      let bubbleType: BubbleType | undefined;
      if (lowerDesc.includes("gear")) bubbleType = "Gear";
      else if (lowerDesc.includes("blacksail")) bubbleType = "Blacksail";
      // ... etc

      return {
        type: "fundamental_multiplyOnEnterNightmare",
        bubbleType,
        multiplier: 1 / divider,
      };
    }

    if (lowerDesc.includes("chance")) {
      // Parse chance-based upgrades
      const chanceMatch = description.match(/(\d+)%/);
      return {
        type: "fundamental_chanceUpgradeOnEnterNightmare",
        chance: chanceMatch ? parseInt(chanceMatch[1]) / 100 : 0.45,
      };
    }
  }

  // Default to complex for anything we can't parse yet
  return {
    type: "complex",
    customLogic: description,
  };
}

/**
 * FUNCTION: generateLotusId
 *
 * Creates a unique, URL-friendly ID from a description
 *
 * CONCEPTS:
 * - String manipulation: replace(), toLowerCase()
 * - Method chaining: calling multiple methods in sequence
 */
function generateLotusId(description: string): string {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dash
    .replace(/^-|-$/g, ""); // Remove leading/trailing dashes
}

/**
 * MANUAL DATA ARRAY
 *
 * For now, we'll manually curate some key lotuses from the website
 * Later we could fetch from an API or scrape HTML
 *
 * ARRAY TYPE: RawLotusData[] means "array of RawLotusData objects"
 */
const manualLotusData: RawLotusData[] = [
  // Basic adds
  { description: "Adds 1 bubble", nightmareOmen: "Minor difficulty increase" },
  { description: "Adds 2 bubbles", nightmareOmen: "Minor difficulty increase" },
  {
    description: "Adds 1-3 bubbles",
    nightmareOmen: "Minor difficulty increase",
  },
  {
    description: "Adds 1 bubble that is Blue or better",
    nightmareOmen: "Minor difficulty increase",
  },
  {
    description: "Adds 2 bubbles that are Blue or better",
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    description: "Adds 1-3 bubbles that are Blue or better",
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    description: "Adds 1 bubble that is Purple or better",
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    description: "Adds 2 bubbles that are Purple or better",
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    description: "Adds 1-3 bubbles that are Purple or better",
    nightmareOmen: "Significant difficulty increase",
  },
  {
    description:
      "Adds 1 bubble that is the same quality as the highest-quality bubble you own (including Rainbow)",
    nightmareOmen: "Significant difficulty increase",
  },
  {
    description:
      "Adds 2 bubbles that are the same quality as the highest-quality bubble you own (including Rainbow)",
    nightmareOmen: "Major difficulty increase",
  },

  // Upgrades
  {
    description: "Upgrades the quality of 1 bubble by 1 tier",
    nightmareOmen: "Minor difficulty increase",
  },
  {
    description: "Upgrades the quality of 1 bubble by 2 tiers",
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    description: "Upgrades the quality of 1 bubble by 3 tiers",
    nightmareOmen: "Significant difficulty increase",
  },

  // Replicates
  {
    description: "Randomly selects 1 bubble to replicate",
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    description: "Randomly selects 2 bubbles to replicate",
    nightmareOmen: "Significant difficulty increase",
  },
  {
    description: "Randomly selects 1-3 bubbles to replicate",
    nightmareOmen: "Significant difficulty increase",
  },

  // Type-specific adds - Gear
  {
    description: "Adds 1 Gear Bubble",
    nightmareOmen: "Minor difficulty increase",
  },
  {
    description: "Adds 2 Gear Bubbles",
    nightmareOmen: "Minor difficulty increase",
  },
  {
    description: "Adds 1-3 Gear Bubbles",
    nightmareOmen: "Minor difficulty increase",
  },
  {
    description: "Adds 1 Gear Bubble that is Blue or better",
    nightmareOmen: "Minor difficulty increase",
  },
  {
    description: "Adds 2 Gear Bubbles that are Blue or better",
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    description: "Adds 1-3 Gear Bubbles that are Blue or better",
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    description: "Adds 1 Gear Bubble that is Purple or better",
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    description: "Adds 2 Gear Bubble that is Purple or better",
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    description: "Adds 1-3 Gear Bubbles that are Purple or better",
    nightmareOmen: "Significant difficulty increase",
  },

  // Type changes
  {
    description: "Changes the type of 1 bubble to Gear",
    nightmareOmen: "Minor difficulty increase",
  },
  {
    description: "Changes the type of 2 bubbles to Gear",
    nightmareOmen: "Minor difficulty increase",
  },
  {
    description: "Changes the type of 3 bubbles to Gear",
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    description:
      "Changes the type of 1 bubble to Gear, and then upgrades its quality by 1 tier",
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    description:
      "Changes the type of 2 bubbles to Gear and upgrades their quality by 1 tier",
    nightmareOmen: "Significant difficulty increase",
  },

  // Remove + benefit
  {
    description:
      "Removes 1 bubble and then upgrades the quality of 1 bubble by 4 tiers",
    nightmareOmen: "Significant difficulty increase",
  },
  {
    description:
      "Removes 1 bubble and then upgrades the quality of 2 bubbles by 2 tiers",
    nightmareOmen: "Significant difficulty increase",
  },

  // More types (abbreviated for brevity - we'd add all 7 types)
  {
    description: "Adds 1 Blacksail Bubble",
    nightmareOmen: "Minor difficulty increase",
  },
  {
    description: "Adds 1 Cube Bubble",
    nightmareOmen: "Minor difficulty increase",
  },
  {
    description: "Adds 1 Commodity Bubble",
    nightmareOmen: "Minor difficulty increase",
  },
  {
    description: "Adds 1 Netherrealm Bubble",
    nightmareOmen: "Minor difficulty increase",
  },
  {
    description: "Adds 1 Fluorescent Bubble",
    nightmareOmen: "Minor difficulty increase",
  },
  {
    description: "Adds 1 Whim Bubble",
    nightmareOmen: "Minor difficulty increase",
  },
];

/**
 * MAIN FUNCTION: Process all lotus data
 *
 * MAP: Transforms each item in an array
 * Array.map(item => transformedItem) returns a new array
 */
function generateLotusEffects(): LotusEffect[] {
  return manualLotusData.map((raw): LotusEffect => {
    // OBJECT DESTRUCTURING: Extract properties from object
    const { description, nightmareOmen } = raw;

    const id = generateLotusId(description);
    const effect = parseDescription(description);

    // Check if it's a fundamental (persistent effect)
    const isFundamental = description.toLowerCase().includes("upon entering");

    // RETURN: Object that matches LotusEffect interface
    return {
      id,
      name: description.slice(0, 50), // Shortened name
      description,
      effect,
      nightmareOmen,
      isFundamental,
    };
  });
}

// EXPORT: Make this available to other files
export function generateLotusDatabase(): string {
  const lotuses = generateLotusEffects();

  // TEMPLATE LITERALS: Use backticks for multi-line strings with ${} for interpolation
  return `// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Generated by scripts/parseLotuses.ts

import type { LotusEffect } from '../types';

export const LOTUSES: LotusEffect[] = ${JSON.stringify(lotuses, null, 2)};

// Total lotuses: ${lotuses.length}
`;
}

// If running as a script (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(generateLotusDatabase());
}
