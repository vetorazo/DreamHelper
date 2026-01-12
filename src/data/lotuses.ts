import type { LotusEffect } from "../types";

/**
 * Sample lotus data - will expand this significantly
 * Based on tlidb.com lotus database
 */
export const SAMPLE_LOTUSES: LotusEffect[] = [
  {
    id: "add-1-bubble",
    name: "Add 1 Bubble",
    description: "Adds 1 bubble",
    effect: { type: "add", count: 1 },
    nightmareOmen: "Minor difficulty increase",
  },
  {
    id: "add-1-blue-bubble",
    name: "Add 1 Blue Bubble",
    description: "Adds 1 bubble that is Blue or better",
    effect: { type: "add", count: 1, quality: "blue_or_better" },
    nightmareOmen: "Minor difficulty increase",
  },
  {
    id: "add-1-purple-bubble",
    name: "Add 1 Purple Bubble",
    description: "Adds 1 bubble that is Purple or better",
    effect: { type: "add", count: 1, quality: "purple_or_better" },
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    id: "add-2-bubbles",
    name: "Add 2 Bubbles",
    description: "Adds 2 bubbles",
    effect: { type: "add", count: 2 },
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    id: "add-2-blue-bubbles",
    name: "Add 2 Blue Bubbles",
    description: "Adds 2 bubbles that are Blue or better",
    effect: { type: "add", count: 2, quality: "blue_or_better" },
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    id: "add-1-highest-quality",
    name: "Add Highest Quality",
    description:
      "Adds 1 bubble that is the same quality as the highest-quality bubble you own (including Rainbow)",
    effect: { type: "add", count: 1, quality: "highest" },
    nightmareOmen: "Significant difficulty increase",
  },
  {
    id: "upgrade-1-by-1",
    name: "Upgrade 1 Bubble",
    description: "Upgrades the quality of 1 bubble by 1 tier",
    effect: { type: "upgrade", count: 1, tiers: 1 },
    nightmareOmen: "Minor difficulty increase",
  },
  {
    id: "upgrade-1-by-2",
    name: "Upgrade 1 Bubble +2",
    description: "Upgrades the quality of 1 bubble by 2 tiers",
    effect: { type: "upgrade", count: 1, tiers: 2 },
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    id: "upgrade-1-by-3",
    name: "Upgrade 1 Bubble +3",
    description: "Upgrades the quality of 1 bubble by 3 tiers",
    effect: { type: "upgrade", count: 1, tiers: 3 },
    nightmareOmen: "Significant difficulty increase",
  },
  {
    id: "replicate-1",
    name: "Replicate 1 Bubble",
    description: "Randomly selects 1 bubble to replicate",
    effect: { type: "replicate", count: 1 },
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    id: "add-1-gear",
    name: "Add 1 Gear Bubble",
    description: "Adds 1 Gear Bubble",
    effect: { type: "add", count: 1, bubbleType: "Gear" },
    nightmareOmen: "Minor difficulty increase",
  },
  {
    id: "add-1-gear-purple",
    name: "Add Purple Gear",
    description: "Adds 1 Gear Bubble that is Purple or better",
    effect: {
      type: "add",
      count: 1,
      quality: "purple_or_better",
      bubbleType: "Gear",
    },
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    id: "change-to-gear",
    name: "Convert to Gear",
    description: "Changes the type of 1 bubble to Gear",
    effect: { type: "changeType", count: 1, newType: "Gear" },
    nightmareOmen: "Minor difficulty increase",
  },
  {
    id: "change-to-gear-upgrade",
    name: "Convert to Gear +1",
    description:
      "Changes the type of 1 bubble to Gear, and then upgrades its quality by 1 tier",
    effect: {
      type: "changeType",
      count: 1,
      newType: "Gear",
      upgradeAfter: true,
    },
    nightmareOmen: "Moderate difficulty increase",
  },
  {
    id: "remove-1-upgrade-4",
    name: "Remove 1, Upgrade +4",
    description:
      "Removes 1 bubble and then upgrades the quality of 1 bubble by 4 tiers",
    effect: { type: "complex", customLogic: "remove-1-upgrade-4" },
    nightmareOmen: "Significant difficulty increase",
  },
];
