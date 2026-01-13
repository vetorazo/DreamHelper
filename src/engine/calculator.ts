import type { BubbleState, LotusEffect, UserWeights } from "../types";

/**
 * Apply fundamental effects to a state
 * These are persistent "upon entering nightmare" effects
 * 
 * CONCEPT vs Rails: Like ActiveRecord scopes that stack
 *   Rails: User.active.premium.recent (chains scopes)
 *   Here: applyFundamental(state, fundamental) modifies state based on fundamental type
 */
function applyFundamentalEffects(state: BubbleState): BubbleState {
  if (!state.fundamental) return state;

  const fundamental = state.fundamental;
  const effect = fundamental.effect;

  // Handle different fundamental types
  switch (effect.type) {
    case "fundamental_multiplyOnEnterNightmare": {
      // Example: "For every 3 Gear bubbles, add 1 Red Gear bubble"
      const targetBubbles = effect.bubbleType
        ? state.bubbles.filter((b) => b.type === effect.bubbleType)
        : state.bubbles;

      const multiplier = effect.multiplier || 0.33;
      const toAdd = Math.floor(targetBubbles.length * multiplier);

      for (let i = 0; i < toAdd; i++) {
        state.bubbles.push({
          id: `fundamental-bonus-${Date.now()}-${i}`,
          type: effect.bubbleType || "Whim",
          quality: "Red",
        });
      }
      break;
    }

    case "fundamental_chanceUpgradeOnEnterNightmare": {
      // Example: "45% chance to upgrade all Gear bubbles by 1 tier"
      const chance = effect.chance || 0.45;
      // For simulation, we use expected value (multiply by chance)
      const targetBubbles = effect.bubbleType
        ? state.bubbles.filter((b) => b.type === effect.bubbleType)
        : state.bubbles;

      // Simplified: upgrade if we "roll" success
      if (Math.random() < chance) {
        targetBubbles.forEach((bubble) => {
          bubble.quality = upgradeQuality(bubble.quality, 1);
        });
      }
      break;
    }

    case "fundamental_bonusOnQualityChange":
    case "fundamental_bonusOnTypeChange":
    case "fundamental_bonusOnAddRemove":
      // These are reactive fundamentals that trigger during gameplay
      // For now, we don't simulate these as they depend on lotus choices
      // In a real implementation, we'd track these and apply bonuses
      break;

    default:
      // Complex or unhandled fundamentals
      break;
  }

  return state;
}

/**
 * Calculate the total value of a bubble state based on user weights
 */
export function calculateStateValue(
  state: BubbleState,
  weights: UserWeights
): number {
  return state.bubbles.reduce((total, bubble) => {
    const qualityValue = weights.qualityMultipliers[bubble.quality];
    const typeWeight = weights.typeWeights[bubble.type];
    return total + qualityValue * typeWeight;
  }, 0);
}

/**
 * Simulate applying a lotus effect to the current state
 * Returns the new state (immutable)
 */
export function simulateLotusEffect(
  currentState: BubbleState,
  lotus: LotusEffect
): BubbleState {
  // Deep clone to avoid mutations
  const newState: BubbleState = {
    ...currentState,
    bubbles: [...currentState.bubbles.map((b) => ({ ...b }))],
  };

  const effect = lotus.effect;

  switch (effect.type) {
    case "add":
      return handleAddEffect(newState, effect);
    case "remove":
      return handleRemoveEffect(newState, effect);
    case "upgrade":
      return handleUpgradeEffect(newState, effect);
    case "replicate":
      return handleReplicateEffect(newState, effect);
    case "changeType":
      return handleChangeTypeEffect(newState, effect);
    default:
      // For fundamentals and complex effects, just note them
      if (lotus.isFundamental) {
        newState.fundamental = lotus;
      }
      return newState;
  }
}

function handleAddEffect(
  state: BubbleState,
  effect: Extract<LotusEffect["effect"], { type: "add" }>
): BubbleState {
  const count = Array.isArray(effect.count)
    ? Math.floor((effect.count[0] + effect.count[1]) / 2) // Average for simulation
    : effect.count;

  const availableSlots = state.visionCapacity - state.bubbles.length;
  const actualAdd = Math.min(count, availableSlots);

  if (actualAdd <= 0) return state; // Vision full

  for (let i = 0; i < actualAdd; i++) {
    const quality = determineQuality(effect.quality, state);
    const type =
      effect.bubbleType === "random" || !effect.bubbleType
        ? "Whim" // Default to Whim for random
        : effect.bubbleType;

    state.bubbles.push({
      id: `bubble-${Date.now()}-${i}`,
      type,
      quality,
    });
  }

  return state;
}

function handleRemoveEffect(
  state: BubbleState,
  effect: Extract<LotusEffect["effect"], { type: "remove" }>
): BubbleState {
  if (state.bubbles.length === 0) return state;

  const count = Math.min(effect.count, state.bubbles.length);

  // Simple removal: remove first N bubbles (can be improved later)
  state.bubbles = state.bubbles.slice(count);

  return state;
}

function handleUpgradeEffect(
  state: BubbleState,
  effect: Extract<LotusEffect["effect"], { type: "upgrade" }>
): BubbleState {
  if (state.bubbles.length === 0) return state;

  const count = Math.min(effect.count, state.bubbles.length);

  for (let i = 0; i < count; i++) {
    const bubble = state.bubbles[i];
    bubble.quality = upgradeQuality(bubble.quality, effect.tiers);
  }

  return state;
}

function handleReplicateEffect(
  state: BubbleState,
  effect: Extract<LotusEffect["effect"], { type: "replicate" }>
): BubbleState {
  if (state.bubbles.length === 0) return state;

  const availableSlots = state.visionCapacity - state.bubbles.length;
  const count = Math.min(effect.count, state.bubbles.length, availableSlots);

  for (let i = 0; i < count; i++) {
    const original = state.bubbles[i];
    state.bubbles.push({
      ...original,
      id: `bubble-${Date.now()}-replicate-${i}`,
    });
  }

  return state;
}

function handleChangeTypeEffect(
  state: BubbleState,
  effect: Extract<LotusEffect["effect"], { type: "changeType" }>
): BubbleState {
  if (state.bubbles.length === 0) return state;

  const count = Math.min(effect.count, state.bubbles.length);

  for (let i = 0; i < count; i++) {
    const bubble = state.bubbles[i];
    bubble.type = effect.newType;
    if (effect.upgradeAfter) {
      bubble.quality = upgradeQuality(bubble.quality, 1);
    }
  }

  return state;
}

function determineQuality(
  qualitySpec: string | undefined,
  state: BubbleState
): "White" | "Blue" | "Purple" | "Orange" | "Red" | "Rainbow" {
  if (!qualitySpec) return "White";

  if (qualitySpec === "highest") {
    const qualities: Array<
      "White" | "Blue" | "Purple" | "Orange" | "Red" | "Rainbow"
    > = ["White", "Blue", "Purple", "Orange", "Red", "Rainbow"];
    let highest: "White" | "Blue" | "Purple" | "Orange" | "Red" | "Rainbow" =
      "White";
    for (const bubble of state.bubbles) {
      if (qualities.indexOf(bubble.quality) > qualities.indexOf(highest)) {
        highest = bubble.quality;
      }
    }
    return highest;
  }

  if (qualitySpec === "purple_or_better") return "Purple";
  if (qualitySpec === "blue_or_better") return "Blue";

  return qualitySpec as
    | "White"
    | "Blue"
    | "Purple"
    | "Orange"
    | "Red"
    | "Rainbow";
}

function upgradeQuality(
  current: "White" | "Blue" | "Purple" | "Orange" | "Red" | "Rainbow",
  tiers: number
): "White" | "Blue" | "Purple" | "Orange" | "Red" | "Rainbow" {
  const qualities: Array<
    "White" | "Blue" | "Purple" | "Orange" | "Red" | "Rainbow"
  > = ["White", "Blue", "Purple", "Orange", "Red", "Rainbow"];
  const currentIndex = qualities.indexOf(current);
  const newIndex = Math.min(currentIndex + tiers, qualities.length - 1);
  return qualities[newIndex];
}

/**
 * Calculate the score for a lotus choice
 * Now includes fundamental effects!
 */
export function scoreLotusChoice(
  currentState: BubbleState,
  lotus: LotusEffect,
  weights: UserWeights
): number {
  const currentValue = calculateStateValue(currentState, weights);
  
  // Simulate the lotus effect
  let simulatedState = simulateLotusEffect(currentState, lotus);
  
  // Apply fundamental effects if entering nightmare
  // CONCEPT: Like Rails transaction callbacks - apply all accumulated effects
  simulatedState = applyFundamentalEffects(simulatedState);
  
  const newValue = calculateStateValue(simulatedState, weights);


/**
 * Rank all available lotus choices and return top N
 */
export function rankLotusChoices(
  currentState: BubbleState,
  availableLotuses: LotusEffect[],
  weights: UserWeights,
  topN: number = 3
): Array<{ lotus: LotusEffect; score: number; simulatedState: BubbleState }> {
  const scored = availableLotuses.map((lotus) => ({
    lotus,
    score: scoreLotusChoice(currentState, lotus, weights),
    simulatedState: simulateLotusEffect(currentState, lotus),
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, topN);
}
