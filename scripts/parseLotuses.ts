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
 * PROGRAMMATIC GENERATION
 * 
 * Instead of manually typing 287 lotuses, we generate them based on patterns
 * Like Rails: BUBBLE_TYPES.each { |type| generate_variants(type) }
 * 
 * CONCEPT: DRY (Don't Repeat Yourself) - automate repetitive patterns
 */

const BUBBLE_TYPES: BubbleType[] = [
  'Gear', 'Blacksail', 'Cube', 'Commodity', 
  'Netherrealm', 'Fluorescent', 'Whim'
];

function generateLotusVariants(): RawLotusData[] {
  const lotuses: RawLotusData[] = [];

  // ===== BASIC ADDS (no type specified) =====
  lotuses.push(
    { description: 'Adds 1 bubble', nightmareOmen: 'Minor difficulty increase' },
    { description: 'Adds 2 bubbles', nightmareOmen: 'Minor difficulty increase' },
    { description: 'Adds 1-3 bubbles', nightmareOmen: 'Minor difficulty increase' },
    { description: 'Adds 1 bubble that is Blue or better', nightmareOmen: 'Minor difficulty increase' },
    { description: 'Adds 2 bubbles that are Blue or better', nightmareOmen: 'Moderate difficulty increase' },
    { description: 'Adds 1-3 bubbles that are Blue or better', nightmareOmen: 'Moderate difficulty increase' },
    { description: 'Adds 1 bubble that is Purple or better', nightmareOmen: 'Moderate difficulty increase' },
    { description: 'Adds 2 bubbles that are Purple or better', nightmareOmen: 'Moderate difficulty increase' },
    { description: 'Adds 1-3 bubbles that are Purple or better', nightmareOmen: 'Significant difficulty increase' },
    { description: 'Adds 1 bubble that is the same quality as the highest-quality bubble you own (including Rainbow)', nightmareOmen: 'Significant difficulty increase' },
    { description: 'Adds 2 bubbles that are the same quality as the highest-quality bubble you own (including Rainbow)', nightmareOmen: 'Major difficulty increase' },
    { description: 'Adds 1-3 bubbles that are the same quality as the highest-quality bubble you own (including Rainbow)', nightmareOmen: 'Major difficulty increase' }
  );

  // ===== UPGRADES =====
  lotuses.push(
    { description: 'Upgrades the quality of 1 bubble by 1 tier', nightmareOmen: 'Minor difficulty increase' },
    { description: 'Upgrades the quality of 1 bubble by 2 tiers', nightmareOmen: 'Moderate difficulty increase' },
    { description: 'Upgrades the quality of 1 bubble by 3 tiers', nightmareOmen: 'Significant difficulty increase' },
    { description: 'Upgrades the quality of 1 bubble to the same quality as the highest-quality bubble you own (including Rainbow)', nightmareOmen: 'Major difficulty increase' },
    { description: 'Upgrades the quality of 2 bubbles to the same quality as the highest-quality bubble you own (including Rainbow)', nightmareOmen: 'Major difficulty increase' }
  );

  // ===== REPLICATES =====
  lotuses.push(
    { description: 'Randomly selects 1 bubble to replicate', nightmareOmen: 'Moderate difficulty increase' },
    { description: 'Randomly selects 2 bubbles to replicate', nightmareOmen: 'Significant difficulty increase' },
    { description: 'Randomly selects 1-3 bubbles to replicate', nightmareOmen: 'Significant difficulty increase' }
  );

  // ===== TYPE-SPECIFIC VARIANTS =====
  // For each bubble type, generate all variations
  // Like Rails: BUBBLE_TYPES.each { |type| generate_adds(type) }
  BUBBLE_TYPES.forEach((type) => {
    // Basic adds
    lotuses.push(
      { description: `Adds 1 ${type} Bubble`, nightmareOmen: 'Minor difficulty increase' },
      { description: `Adds 2 ${type} Bubbles`, nightmareOmen: 'Minor difficulty increase' },
      { description: `Adds 1-3 ${type} Bubbles`, nightmareOmen: 'Minor difficulty increase' },
      { description: `Adds 1 ${type} Bubble that is Blue or better`, nightmareOmen: 'Minor difficulty increase' },
      { description: `Adds 2 ${type} Bubbles that are Blue or better`, nightmareOmen: 'Moderate difficulty increase' },
      { description: `Adds 1-3 ${type} Bubbles that are Blue or better`, nightmareOmen: 'Moderate difficulty increase' },
      { description: `Adds 1 ${type} Bubble that is Purple or better`, nightmareOmen: 'Moderate difficulty increase' },
      { description: `Adds 2 ${type} Bubble that is Purple or better`, nightmareOmen: 'Moderate difficulty increase' },
      { description: `Adds 1-3 ${type} Bubbles that are Purple or better`, nightmareOmen: 'Significant difficulty increase' },
      { description: `Adds 1 ${type} Bubble that is the same quality as the highest-quality bubble you own (including Rainbow)`, nightmareOmen: 'Significant difficulty increase' },
      { description: `Adds 2 ${type} Bubbles that are the same quality as the highest-quality bubble you own (including Rainbow)`, nightmareOmen: 'Major difficulty increase' },
      { description: `Adds 1-3 ${type} Bubbles that are the same quality as the highest-quality bubble you own (including Rainbow)`, nightmareOmen: 'Major difficulty increase' }
    );

    // Replicates
    lotuses.push(
      { description: `Randomly selects 1 ${type} Bubble to replicate`, nightmareOmen: 'Moderate difficulty increase' },
      { description: `Randomly selects 2 ${type} Bubbles to replicate`, nightmareOmen: 'Significant difficulty increase' },
      { description: `Randomly selects 1-3 ${type} Bubbles to replicate`, nightmareOmen: 'Significant difficulty increase' }
    );

    // Type changes
    lotuses.push(
      { description: `Changes the type of 1 bubble to ${type}`, nightmareOmen: 'Minor difficulty increase' },
      { description: `Changes the type of 2 bubbles to ${type}`, nightmareOmen: 'Minor difficulty increase' },
      { description: `Changes the type of 3 bubbles to ${type}`, nightmareOmen: 'Moderate difficulty increase' },
      { description: `Changes the type of 3-5 bubbles to ${type}`, nightmareOmen: 'Moderate difficulty increase' },
      { description: `Changes the type of 1 bubble to ${type}, and then upgrades its quality by 1 tier`, nightmareOmen: 'Moderate difficulty increase' },
      { description: `Changes the type of 2 bubbles to ${type} and upgrades their quality by 1 tier`, nightmareOmen: 'Significant difficulty increase' },
      { description: `Changes the type of 2-3 bubbles to ${type} and upgrades their quality by 1 tier`, nightmareOmen: 'Significant difficulty increase' }
    );

    // Remove + Add specific type
    lotuses.push(
      { description: `Removes 1 bubble and then adds 1 ${type} Bubble that is Purple or better`, nightmareOmen: 'Moderate difficulty increase' },
      { description: `Removes 1 bubble and then adds 2 ${type} Bubbles that are Blue or better`, nightmareOmen: 'Moderate difficulty increase' },
      { description: `Removes 1 bubble and then adds 1-3 ${type} Bubbles that are Blue or better`, nightmareOmen: 'Significant difficulty increase' },
      { description: `Removes 1 bubble, changes the type of 1 bubble to ${type}, and then upgrades its quality by 1 tier`, nightmareOmen: 'Significant difficulty increase' },
      { description: `Removes 1 bubble and changes the type of 2 bubbles to ${type}`, nightmareOmen: 'Moderate difficulty increase' },
      { description: `Removes 1 bubble and changes the type of 1-3 bubbles to ${type}`, nightmareOmen: 'Significant difficulty increase' }
    );

    // Fundamentals - "Upon entering Nightmare"
    lotuses.push(
      { description: `Upon entering a Nightmare, for every 3 ${type} Bubbles you have, you additionally gain 1 Red ${type} Bubble`, nightmareOmen: 'Major difficulty increase' },
      { description: `Upon entering a Nightmare, for every 6 ${type} Bubbles you have, you additionally gain 1 Rainbow ${type} Bubble`, nightmareOmen: 'Extreme difficulty increase' },
      { description: `Upon entering a Nightmare, for every 3 Purple or lower ${type} Bubbles you have, converts them into 1 Orange or better (including Rainbow) Whim Bubble`, nightmareOmen: 'Major difficulty increase' },
      { description: `Upon entering a Nightmare, there is a 45% chance that the quality of all your ${type} Bubbles will be upgraded by 1 tier, up to Rainbow`, nightmareOmen: 'Major difficulty increase' }
    );
  });

  // ===== REMOVE + BENEFIT COMBOS =====
  lotuses.push(
    { description: 'Removes 1 bubble and then upgrades the quality of 1 bubble by 4 tiers', nightmareOmen: 'Significant difficulty increase' },
    { description: 'Removes 1 bubble and then upgrades the quality of 2 bubbles by 2 tiers', nightmareOmen: 'Significant difficulty increase' },
    { description: 'Removes 1 bubble and then adds 1 bubble that is Purple or better', nightmareOmen: 'Moderate difficulty increase' },
    { description: 'Removes 1 bubble and then adds 2 bubbles that are Blue or better', nightmareOmen: 'Moderate difficulty increase' },
    { description: 'Removes 1 bubble and then adds 1-3 bubbles that are Blue or better', nightmareOmen: 'Significant difficulty increase' },
    { description: 'Removes 1 bubble, then randomly upgrades the quality of 1-3 bubbles by 1 tier', nightmareOmen: 'Moderate difficulty increase' }
  );

  // ===== SPECIAL FUNDAMENTALS =====
  lotuses.push(
    { description: 'Upon entering a Nightmare, for every 3 different types of bubbles you have, you additionally gain 1 Red bubble of a random type', nightmareOmen: 'Major difficulty increase' },
    { description: 'Upon entering a Nightmare, for every 3 different types of bubbles you have, you additionally gain 1 Red Whim Bubble', nightmareOmen: 'Major difficulty increase' },
    { description: 'Upon entering a Nightmare, fills up the initial empty slots of the Vision with White bubbles of random types', nightmareOmen: 'Minor difficulty increase' },
    { description: 'Upon entering a Nightmare, fills up the initial empty slots of the Vision with Purple bubbles of a random type', nightmareOmen: 'Significant difficulty increase' },
    { description: 'Upon entering a Nightmare, fills up the initial empty slots of the Vision with Orange bubbles of a random type', nightmareOmen: 'Major difficulty increase' },
    { description: 'Upon entering a Nightmare, there is a 100% chance to upgrade the quality of each bubble by 2 tiers. For every unfilled initial empty slot, the chance is reduced by 10%', nightmareOmen: 'Extreme difficulty increase' },
    { description: 'Whenever the quality of a bubble changes, additionally upgrades the quality of 1 bubble by 1 tier', nightmareOmen: 'Significant difficulty increase' },
    { description: 'Whenever adding or removing a bubble, additionally upgrades the quality of 1 bubble by 1 tier', nightmareOmen: 'Significant difficulty increase' },
    { description: 'Whenever the type of a bubble changes, additionally upgrades the quality of 1 bubble by 1 tier', nightmareOmen: 'Significant difficulty increase' }
  );

  // ===== HIGH-RISK HIGH-REWARD =====
  lotuses.push(
    { description: 'Adds 4 Rainbow bubbles. In each Dream Omen selection after this, 1 bubble will be removed (from lowest quality to highest quality)', nightmareOmen: 'Extreme difficulty increase' },
    { description: 'Adds 1 bubble, but no more bubbles can be added later. Upon entering a Nightmare, each bubble is additionally replicated 1 time', nightmareOmen: 'Major difficulty increase' },
    { description: 'Removes bubbles until leaving only 1 random bubble of each type, then changes their quality to Orange', nightmareOmen: 'Extreme difficulty increase' },
    { description: 'Removes bubbles until only 1 random bubble is left, then changes its quality to Red and replicates 1 copy of it', nightmareOmen: 'Extreme difficulty increase' },
    { description: 'Randomly changes the type of all bubbles, and then randomly changes the quality of all bubbles, reducing their quality by at most 1 tier or upgrading their quality by at most 2 tiers', nightmareOmen: 'Major difficulty increase' },
    { description: 'Randomly changes the quality of 1 bubble, reducing their quality by at most 1 tier or upgrading their quality by at most 2 tiers', nightmareOmen: 'Minor difficulty increase' },
    { description: 'The quality of bubbles can\'t be changed anymore. Upon entering a Nightmare, you additionally obtain a number of Whim Bubbles equal to the number of bubbles you already have', nightmareOmen: 'Extreme difficulty increase' },
    { description: 'Upon entering a Nightmare, you additionally gain all the bubbles that have been removed in the Sweet Dreams of this round', nightmareOmen: 'Major difficulty increase' },
    { description: 'Removes half your bubbles (rounding down) and replicates your remaining bubbles, with the chance to upgrade their quality by 1 tier', nightmareOmen: 'Major difficulty increase' }
  );

  // ===== LOCKING MECHANICS =====
  lotuses.push(
    { description: 'Adds 1 White bubble and locks it. During each omen selection, its quality is upgraded by 1 tier, up to Rainbow', nightmareOmen: 'Moderate difficulty increase' },
    { description: 'Adds 1 Rainbow bubble and locks it. During each omen selection, its quality is reduced by 1 tier', nightmareOmen: 'Minor difficulty increase' },
    { description: 'Locks the highest-quality bubble', nightmareOmen: 'Minor difficulty increase' },
    { description: 'Locks the 1-3 highest-quality bubbles', nightmareOmen: 'Moderate difficulty increase' },
    { description: 'Adds 1 Rainbow Bubble that will be removed during the next omen selection', nightmareOmen: 'Minor difficulty increase' },
    { description: 'Removes the highest quality bubble and replicates 2 copies of it in the next omen selection', nightmareOmen: 'Moderate difficulty increase' }
  );

  return lotuses;
}

const manualLotusData: RawLotusData[] = generateLotusVariants();

/**
 * MAIN FUNCTION: Process all lotus data
 *
 * MAP: Transforms each item in an array
 * Array.map(item => transformedItem) returns a new array
 */
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
