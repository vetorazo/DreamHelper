// Core type definitions for Dream Helper

export type BubbleQuality =
  | "White"
  | "Blue"
  | "Purple"
  | "Orange"
  | "Red"
  | "Rainbow";

export type BubbleType =
  | "Gear"
  | "Blacksail"
  | "Cube"
  | "Commodity"
  | "Netherrealm"
  | "Fluorescent"
  | "Fuel"
  | "Whim";

export interface Bubble {
  id: string;
  type: BubbleType;
  quality: BubbleQuality;
  locked?: boolean; // For lotus effects that lock bubbles
}

export interface BubbleState {
  bubbles: Bubble[];
  visionCapacity: number; // Max slots (typically 10)
  fundamental?: LotusEffect; // First lotus choice with persistent effect
}

export interface LotusEffect {
  id: string;
  name: string;
  description: string;
  effect: EffectType;
  nightmareOmen?: string; // Associated nightmare difficulty increase
  isFundamental?: boolean; // True if "upon entering nightmare" or persistent
}

export type EffectType =
  | {
      type: "add";
      count: number | [number, number];
      quality?:
        | BubbleQuality
        | "highest"
        | "purple_or_better"
        | "blue_or_better";
      bubbleType?: BubbleType | "random";
    }
  | { type: "remove"; count: number; target?: "random" | "lowest" | "highest" }
  | { type: "upgrade"; count: number; tiers: number; target?: "random" | "all" }
  | { type: "replicate"; count: number; target?: "random" | BubbleType }
  | {
      type: "changeType";
      count: number;
      newType: BubbleType;
      upgradeAfter?: boolean;
    }
  | {
      type: "fundamental_multiplyOnEnterNightmare";
      bubbleType?: BubbleType;
      multiplier: number;
      minQuality?: BubbleQuality;
    }
  | {
      type: "fundamental_chanceUpgradeOnEnterNightmare";
      chance: number;
      bubbleType?: BubbleType;
    }
  | { type: "fundamental_bonusOnQualityChange" }
  | { type: "fundamental_bonusOnTypeChange" }
  | { type: "fundamental_bonusOnAddRemove" }
  | { type: "complex"; customLogic: string }; // For complex multi-step effects

export interface UserWeights {
  qualityMultipliers: Record<BubbleQuality, number>;
  typeWeights: Record<BubbleType, number>;
  riskTolerance: number; // 0-1, how much to discount nightmare difficulty
}

export interface LotusChoice {
  lotus: LotusEffect;
  score: number;
  explanation: string;
  simulatedState: BubbleState;
}

// Default weights
export const DEFAULT_QUALITY_MULTIPLIERS: Record<BubbleQuality, number> = {
  White: 1,
  Blue: 2,
  Purple: 4,
  Orange: 8,
  Red: 16,
  Rainbow: 32,
};

export const DEFAULT_TYPE_WEIGHTS: Record<BubbleType, number> = {
  Gear: 1.0,
  Blacksail: 1.0,
  Cube: 1.0,
  Commodity: 1.0,
  Netherrealm: 1.0,
  Fluorescent: 1.0,
  Fuel: 1.0,
  Whim: 1.2, // Slightly higher as it counts as all types
};
