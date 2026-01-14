import type {
  BubbleState,
  LotusEffect,
  UserWeights,
  BubbleType,
} from "../types";

export interface RecommendationReason {
  type: "synergy" | "upgrade" | "goal" | "high_value" | "quantity";
  label: string;
  icon: string;
  description: string;
}

/**
 * Apply fundamental effects to a state
 * These are persistent "upon entering nightmare" effects
 *
 * CONCEPT vs Rails: Like ActiveRecord scopes that stack
 *   Rails: User.active.premium.recent (chains scopes)
 *   Here: applyFundamental(state, fundamental) modifies state based on fundamental type
 *
 * Monte Carlo Integration: For probabilistic effects, we now track if we should use
 * deterministic (for averaging) or stochastic (for individual simulation runs)
 */
function applyFundamentalEffects(
  state: BubbleState,
  useMonteCarlo: boolean = false
): BubbleState {
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
      const targetBubbles = effect.bubbleType
        ? state.bubbles.filter((b) => b.type === effect.bubbleType)
        : state.bubbles;

      if (useMonteCarlo) {
        // Monte Carlo: actually roll the dice
        if (Math.random() < chance) {
          targetBubbles.forEach((bubble) => {
            bubble.quality = upgradeQuality(bubble.quality, 1);
          });
        }
      } else {
        // Deterministic: apply fractional upgrade (expected value)
        // For averaging, we apply partial upgrades based on probability
        // This is a simplified approach - in reality we'd need weighted averaging
        targetBubbles.forEach((bubble) => {
          if (Math.random() < chance) {
            bubble.quality = upgradeQuality(bubble.quality, 1);
          }
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
  simulatedState = applyFundamentalEffects(simulatedState, false);

  const newValue = calculateStateValue(simulatedState, weights);

  return newValue - currentValue;
}

/**
 * Monte Carlo simulation for probabilistic effects
 * Runs N simulations and returns the average score
 *
 * CONCEPT: Like running A/B tests multiple times to get statistical significance
 * Instead of one roll of the dice, we roll many times and average the results
 */
export function scoreLotusChoiceMonteCarlo(
  currentState: BubbleState,
  lotus: LotusEffect,
  weights: UserWeights,
  numSimulations: number = 100
): number {
  const currentValue = calculateStateValue(currentState, weights);
  let totalValue = 0;

  for (let i = 0; i < numSimulations; i++) {
    // Each simulation gets its own random outcomes
    let simulatedState = simulateLotusEffect(currentState, lotus);
    simulatedState = applyFundamentalEffects(simulatedState, true);
    totalValue += calculateStateValue(simulatedState, weights);
  }

  const averageValue = totalValue / numSimulations;
  return averageValue - currentValue;
}

/**
 * Apply goal-oriented weights by boosting a specific bubble type
 * Returns modified weights that heavily favor the goal type
 */
export function applyGoalWeights(
  baseWeights: UserWeights,
  goalType: BubbleType | null
): UserWeights {
  if (!goalType) return baseWeights;

  const modifiedWeights: UserWeights = {
    ...baseWeights,
    typeWeights: { ...baseWeights.typeWeights },
  };

  // Boost goal type weight by 3x
  modifiedWeights.typeWeights[goalType] *= 3;

  return modifiedWeights;
}

/**
 * Rank all available lotus choices and return top N
 * Can optionally use Monte Carlo for better accuracy
 */
export function rankLotusChoices(
  currentState: BubbleState,
  availableLotuses: LotusEffect[],
  weights: UserWeights,
  topN: number = 3,
  useMonteCarlo: boolean = false
): Array<{ lotus: LotusEffect; score: number; simulatedState: BubbleState }> {
  const scored = availableLotuses.map((lotus) => ({
    lotus,
    score: useMonteCarlo
      ? scoreLotusChoiceMonteCarlo(currentState, lotus, weights, 100)
      : scoreLotusChoice(currentState, lotus, weights),
    simulatedState: simulateLotusEffect(currentState, lotus),
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, topN);
}

/**
 * Lookahead optimization: evaluate lotus choices considering future moves
 * For each option, simulate taking it and then rank the next best moves
 * Returns choices sorted by their long-term value (current + future potential)
 *
 * CONCEPT: Like chess engines - don't just look at immediate move,
 * but consider what moves become available afterwards
 */
export function rankLotusChoicesWithLookahead(
  currentState: BubbleState,
  availableLotuses: LotusEffect[],
  weights: UserWeights,
  topN: number = 3,
  lookaheadDepth: number = 2,
  useMonteCarlo: boolean = false
): Array<{
  lotus: LotusEffect;
  score: number;
  lookaheadScore: number;
  simulatedState: BubbleState;
}> {
  const scored = availableLotuses.map((lotus) => {
    // Score the immediate effect
    const immediateScore = useMonteCarlo
      ? scoreLotusChoiceMonteCarlo(currentState, lotus, weights, 100)
      : scoreLotusChoice(currentState, lotus, weights);

    // Simulate taking this lotus
    let nextState = simulateLotusEffect(currentState, lotus);
    nextState = applyFundamentalEffects(nextState, useMonteCarlo);

    // Look ahead to future moves (recursive lookahead)
    let futureValue = 0;
    if (lookaheadDepth > 1 && availableLotuses.length > 1) {
      // For performance, only look at top 5 next moves
      const nextBestMoves = rankLotusChoices(
        nextState,
        availableLotuses,
        weights,
        Math.min(5, availableLotuses.length),
        false // Don't use Monte Carlo in lookahead for performance
      );

      // Average the top 3 future options (representing uncertainty about what will be offered)
      futureValue =
        nextBestMoves.slice(0, 3).reduce((sum, move) => sum + move.score, 0) /
        Math.min(3, nextBestMoves.length);

      // Discount future value (immediate gains > future potential)
      futureValue *= 0.7;
    }

    return {
      lotus,
      score: immediateScore,
      lookaheadScore: immediateScore + futureValue,
      simulatedState: nextState,
    };
  });

  // Sort by lookahead score (which includes future potential)
  return scored
    .sort((a, b) => b.lookaheadScore - a.lookaheadScore)
    .slice(0, topN);
}

/**
 * Analyze why a lotus recommendation is good
 * Returns tags explaining the strategic value
 */
export function explainRecommendation(
  currentState: BubbleState,
  lotus: LotusEffect,
  simulatedState: BubbleState,
  goalType: BubbleType | null
): RecommendationReason[] {
  const reasons: RecommendationReason[] = [];
  const effect = lotus.effect;

  // Check for synergy boost (adds bubbles that create/enhance combos)
  if (effect.type === "add" && effect.bubbleType) {
    const currentTypeCount = currentState.bubbles.filter(
      (b) => b.type === effect.bubbleType
    ).length;
    const newTypeCount = simulatedState.bubbles.filter(
      (b) => b.type === effect.bubbleType
    ).length;
    const addedCount = newTypeCount - currentTypeCount;

    // Creates strong type cluster (3+ of same type)
    if (currentTypeCount >= 2 && currentTypeCount < 3 && newTypeCount >= 3) {
      reasons.push({
        type: "synergy",
        label: "Synergy Boost!",
        icon: "✨",
        description: `Creates ${effect.bubbleType} cluster (${newTypeCount} total)`,
      });
    } else if (currentTypeCount >= 3 && addedCount > 0) {
      reasons.push({
        type: "synergy",
        label: "Synergy +",
        icon: "⚡",
        description: `Strengthens ${effect.bubbleType} combo`,
      });
    }
  }

  // Check for upgrades
  if (effect.type === "upgrade") {
    const upgradedCount = simulatedState.bubbles.filter((b) => {
      const original = currentState.bubbles.find((orig) => orig.id === b.id);
      return original && b.quality !== original.quality;
    }).length;

    if (upgradedCount >= 3) {
      reasons.push({
        type: "upgrade",
        label: "Major Upgrade!",
        icon: "⬆️",
        description: `Upgrades ${upgradedCount} bubbles`,
      });
    } else if (upgradedCount > 0) {
      reasons.push({
        type: "upgrade",
        label: "Upgrade",
        icon: "↗️",
        description: `Upgrades ${upgradedCount} bubble${
          upgradedCount > 1 ? "s" : ""
        }`,
      });
    }
  }

  // Check for goal progress
  if (goalType && effect.type === "add" && effect.bubbleType === goalType) {
    const addedGoalBubbles =
      simulatedState.bubbles.filter((b) => b.type === goalType).length -
      currentState.bubbles.filter((b) => b.type === goalType).length;
    if (addedGoalBubbles > 0) {
      reasons.push({
        type: "goal",
        label: "Goal Progress!",
        icon: "🎯",
        description: `Adds ${addedGoalBubbles} ${goalType} bubble${
          addedGoalBubbles > 1 ? "s" : ""
        }`,
      });
    }
  }

  // Check for high value additions (Orange+ bubbles)
  if (effect.type === "add") {
    const highQualityAdded =
      simulatedState.bubbles.filter((b) =>
        ["Orange", "Red", "Rainbow"].includes(b.quality)
      ).length -
      currentState.bubbles.filter((b) =>
        ["Orange", "Red", "Rainbow"].includes(b.quality)
      ).length;

    if (highQualityAdded >= 2) {
      reasons.push({
        type: "high_value",
        label: "High Value!",
        icon: "💎",
        description: `Adds ${highQualityAdded} premium bubbles`,
      });
    } else if (highQualityAdded === 1) {
      reasons.push({
        type: "high_value",
        label: "Premium Add",
        icon: "💫",
        description: "Adds high-quality bubble",
      });
    }
  }

  // Check for large quantity additions
  if (effect.type === "add" || effect.type === "replicate") {
    const addedCount =
      simulatedState.bubbles.length - currentState.bubbles.length;
    if (addedCount >= 3) {
      reasons.push({
        type: "quantity",
        label: "Big Gain!",
        icon: "📈",
        description: `Adds ${addedCount} bubbles`,
      });
    }
  }

  return reasons;
}
