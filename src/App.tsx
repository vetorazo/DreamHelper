import { useState, useEffect } from "react";
import type {
  BubbleState,
  Bubble,
  BubbleType,
  BubbleQuality,
  UserWeights,
  LotusEffect,
} from "./types";
import { DEFAULT_QUALITY_MULTIPLIERS, DEFAULT_TYPE_WEIGHTS } from "./types";
import { 
  rankLotusChoices, 
  rankLotusChoicesWithLookahead,
  applyGoalWeights,
  calculateStateValue 
} from "./engine/calculator";
import { LOTUSES } from "./data/lotuses";
import "./App.css";

/**
 * REACT HOOKS vs RAILS:
 *
 * useState - Like Rails instance variables (@bubbles), but with a setter that triggers re-render
 *   Rails: @bubbles = []; then @bubbles << new_bubble (mutate directly)
 *   React: const [bubbles, setBubbles] = useState([]); then setBubbles([...bubbles, new])
 *
 * useEffect - Like Rails callbacks (after_create, after_update)
 *   Rails: after_commit :save_to_cache
 *   React: useEffect(() => { saveToLocalStorage() }, [bubbles]) // runs when bubbles change
 *
 * localStorage - Like Rails.cache, but client-side browser storage
 *   Persists across page reloads until manually cleared
 */

const STORAGE_KEY = "dreamhelper-bubble-state"; // Like a Rails cache key
const WEIGHTS_STORAGE_KEY = "dreamhelper-user-weights";

const VALID_BUBBLE_TYPES: BubbleType[] = [
  "Gear",
  "Blacksail",
  "Cube",
  "Commodity",
  "Netherrealm",
  "Fluorescent",
  "Whim",
];

// Helper to get bubble icon path
function getBubbleIconPath(type: BubbleType, quality: BubbleQuality): string {
  return `/icons/bubbles/${type}_${quality}.webp`;
}

// Helper to calculate nightmare risk
function calculateNightmareRisk(
  bubbles: Bubble[],
  weights: UserWeights
): {
  bubblesAtRisk: number;
  valueAtRisk: number;
  riskLevel: "none" | "low" | "medium" | "high" | "critical";
} {
  if (bubbles.length === 0) {
    return { bubblesAtRisk: 0, valueAtRisk: 0, riskLevel: "none" };
  }

  // Calculate 1/6 of bubbles (rounded up for worst case)
  const bubblesAtRisk = Math.ceil(bubbles.length / 6);

  // Calculate value at risk (assume we lose the least valuable bubbles)
  const sortedByValue = [...bubbles].sort((a, b) => {
    const valueA =
      weights.qualityMultipliers[a.quality] * weights.typeWeights[a.type];
    const valueB =
      weights.qualityMultipliers[b.quality] * weights.typeWeights[b.type];
    return valueA - valueB;
  });

  const valueAtRisk = sortedByValue
    .slice(0, bubblesAtRisk)
    .reduce((sum, bubble) => {
      return (
        sum +
        weights.qualityMultipliers[bubble.quality] *
          weights.typeWeights[bubble.type]
      );
    }, 0);

  // Determine risk level based on number of bubbles
  let riskLevel: "none" | "low" | "medium" | "high" | "critical";
  if (bubblesAtRisk === 0) riskLevel = "none";
  else if (bubblesAtRisk <= 1) riskLevel = "low";
  else if (bubblesAtRisk <= 2) riskLevel = "medium";
  else if (bubblesAtRisk <= 3) riskLevel = "high";
  else riskLevel = "critical";

  return { bubblesAtRisk, valueAtRisk, riskLevel };
}

// Synergy detection
interface Synergy {
  id: string;
  title: string;
  description: string;
  strength: "weak" | "moderate" | "strong" | "powerful";
  icon: string;
}

function detectSynergies(bubbles: Bubble[]): Synergy[] {
  const synergies: Synergy[] = [];

  // Count bubbles by type and quality
  const typeCounts: Record<BubbleType, number> = {
    Gear: 0,
    Blacksail: 0,
    Cube: 0,
    Commodity: 0,
    Netherrealm: 0,
    Fluorescent: 0,
    Whim: 0,
  };

  const qualityCounts: Record<BubbleQuality, number> = {
    White: 0,
    Blue: 0,
    Purple: 0,
    Orange: 0,
    Red: 0,
    Rainbow: 0,
  };

  bubbles.forEach((bubble) => {
    typeCounts[bubble.type]++;
    qualityCounts[bubble.quality]++;
  });

  // Type-based synergies (3+ of same type)
  VALID_BUBBLE_TYPES.forEach((type) => {
    const count = typeCounts[type];
    if (count >= 6) {
      synergies.push({
        id: `${type}-critical-mass`,
        title: `${type} Dominance`,
        description: `${count} ${type} bubbles! Lotuses that add Rainbow ${type} bubbles become extremely valuable (gain 1 per 6)`,
        strength: "powerful",
        icon: "🔥",
      });
    } else if (count >= 4) {
      synergies.push({
        id: `${type}-strong`,
        title: `${type} Focus`,
        description: `${count} ${type} bubbles benefit from type-specific lotuses that replicate or upgrade`,
        strength: "strong",
        icon: "⚡",
      });
    } else if (count >= 3) {
      synergies.push({
        id: `${type}-moderate`,
        title: `${type} Cluster`,
        description: `${count} ${type} bubbles - enough to gain bonus bubbles from nightmare lotuses`,
        strength: "moderate",
        icon: "✨",
      });
    }
  });

  // Quality-based synergies
  const highQualityCount =
    qualityCounts.Rainbow + qualityCounts.Red + qualityCounts.Orange;
  if (highQualityCount >= 5) {
    synergies.push({
      id: "high-quality-focus",
      title: "Premium Collection",
      description: `${highQualityCount} high-quality bubbles (Orange+)! Protect these from nightmare - extremely valuable`,
      strength: "powerful",
      icon: "💎",
    });
  } else if (highQualityCount >= 3) {
    synergies.push({
      id: "quality-stack",
      title: "Quality Stack",
      description: `${highQualityCount} Orange+ bubbles benefit from 'highest quality' lotuses`,
      strength: "strong",
      icon: "💫",
    });
  }

  if (qualityCounts.Rainbow >= 2) {
    synergies.push({
      id: "rainbow-power",
      title: "Rainbow Power",
      description: `${qualityCounts.Rainbow} Rainbow bubbles! Maximum value - prioritize protection`,
      strength: "powerful",
      icon: "🌈",
    });
  }

  // Diversity synergy (many different types)
  const diverseTypes = VALID_BUBBLE_TYPES.filter(
    (t) => typeCounts[t] > 0
  ).length;
  if (diverseTypes >= 5 && bubbles.length >= 7) {
    synergies.push({
      id: "diverse-portfolio",
      title: "Diverse Portfolio",
      description: `${diverseTypes} different bubble types! Whim bubbles become more valuable (count as any type)`,
      strength: "moderate",
      icon: "🎨",
    });
  }

  // Gear + Blacksail combo (common endgame pairing)
  if (typeCounts.Gear >= 2 && typeCounts.Blacksail >= 2) {
    synergies.push({
      id: "gear-blacksail-combo",
      title: "Gear & Blacksail Combo",
      description: "Balanced offensive setup - great synergy for late game",
      strength: "strong",
      icon: "⚔️",
    });
  }

  // Cube collection (inventory expansion)
  if (typeCounts.Cube >= 3) {
    synergies.push({
      id: "cube-collector",
      title: "Cube Collector",
      description: `${typeCounts.Cube} Cubes = more inventory space. Cube-specific lotuses are valuable`,
      strength: "moderate",
      icon: "📦",
    });
  }

  // Whim flexibility
  if (typeCounts.Whim >= 2) {
    synergies.push({
      id: "whim-flexibility",
      title: "Whim Flexibility",
      description: `${typeCounts.Whim} Whim bubbles provide type flexibility for all lotus effects`,
      strength: "moderate",
      icon: "🎭",
    });
  }

  // Low quality upgrade potential
  const lowQualityCount = qualityCounts.White + qualityCounts.Blue;
  if (lowQualityCount >= 4) {
    synergies.push({
      id: "upgrade-potential",
      title: "Upgrade Potential",
      description: `${lowQualityCount} low-quality bubbles - prioritize upgrade lotuses for massive gains`,
      strength: "moderate",
      icon: "⬆️",
    });
  }

  return synergies;
}

// Helper to safely access localStorage
function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("localStorage access denied:", e);
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn("localStorage access denied:", e);
  }
}

function safeLocalStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn("localStorage access denied:", e);
  }
}

function App() {
  // CONCEPT: Lazy initialization - function runs only on first render
  // Like Rails: @bubbles ||= load_from_cache
  const [bubbleState, setBubbleState] = useState<BubbleState>(() => {
    // Try to load from localStorage on initial mount
    const saved = safeLocalStorageGet(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate and filter out any bubbles with invalid types
        if (parsed.bubbles && Array.isArray(parsed.bubbles)) {
          const filteredBubbles = parsed.bubbles.filter(
            (b: any) =>
              b.type && VALID_BUBBLE_TYPES.includes(b.type as BubbleType)
          );
          // If all bubbles were invalid, clear storage and start fresh
          if (parsed.bubbles.length > 0 && filteredBubbles.length === 0) {
            console.warn("All bubbles invalid, clearing storage");
            safeLocalStorageRemove(STORAGE_KEY);
            return {
              bubbles: [],
              visionCapacity: 10,
            };
          }
          parsed.bubbles = filteredBubbles;
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved state:", e);
        // Clear corrupted data
        safeLocalStorageRemove(STORAGE_KEY);
      }
    }
    // Default state if nothing saved
    return {
      bubbles: [],
      visionCapacity: 10,
    };
  });

  const [userWeights, setUserWeights] = useState<UserWeights>(() => {
    const saved = safeLocalStorageGet(WEIGHTS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clean up any invalid type weights (like "Fuel")
        if (parsed.typeWeights) {
          const cleanedWeights: Record<BubbleType, number> = {} as Record<
            BubbleType,
            number
          >;
          VALID_BUBBLE_TYPES.forEach((type) => {
            cleanedWeights[type] =
              parsed.typeWeights[type] ?? DEFAULT_TYPE_WEIGHTS[type];
          });
          parsed.typeWeights = cleanedWeights;
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved weights:", e);
      }
    }
    return {
      qualityMultipliers: DEFAULT_QUALITY_MULTIPLIERS,
      typeWeights: DEFAULT_TYPE_WEIGHTS,
      riskTolerance: 0.5,
    };
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingBubbleId, setEditingBubbleId] = useState<string | null>(null);

  // NEW: Current lotus choices for comparison (like Rails shopping cart)
  const [currentChoices, setCurrentChoices] = useState<LotusEffect[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Monte Carlo simulation toggle
  const [useMonteCarlo, setUseMonteCarlo] = useState<boolean>(false);

  // Goal-oriented mode
  const [goalType, setGoalType] = useState<BubbleType | null>(null);

  // Lookahead optimization
  const [useLookahead, setUseLookahead] = useState<boolean>(false);
  const [lookaheadDepth, setLookaheadDepth] = useState<number>(2);

  /**
   * useEffect - SIDE EFFECTS hook
   *
   * Like Rails callbacks, runs after component renders
   *
   * Rails equivalent:
   *   after_commit :save_to_cache, if: :bubbles_changed?
   *
   * Syntax: useEffect(() => { code }, [dependencies])
   * - First arg: function to run (the effect)
   * - Second arg: array of dependencies (when to re-run)
   *   - [] = run once on mount (like Rails after_create)
   *   - [bubbleState] = run whenever bubbleState changes (like Rails after_update)
   *   - no array = run on every render (usually bad, like N+1 queries)
   */
  useEffect(() => {
    // DEBOUNCING: In production, you'd debounce this like Rails queue_as :low_priority
    // For now, save immediately on every change
    safeLocalStorageSet(STORAGE_KEY, JSON.stringify(bubbleState));
  }, [bubbleState]); // Dependency array - re-run when bubbleState changes

  useEffect(() => {
    safeLocalStorageSet(WEIGHTS_STORAGE_KEY, JSON.stringify(userWeights));
  }, [userWeights]);

  const updateTypeWeight = (type: BubbleType, weight: number) => {
    setUserWeights({
      ...userWeights,
      typeWeights: {
        ...userWeights.typeWeights,
        [type]: weight,
      },
    });
  };

  const resetWeights = () => {
    setUserWeights({
      qualityMultipliers: DEFAULT_QUALITY_MULTIPLIERS,
      typeWeights: DEFAULT_TYPE_WEIGHTS,
      riskTolerance: 0.5,
    });
  };

  const addBubble = (type: BubbleType, quality: BubbleQuality) => {
    if (bubbleState.bubbles.length >= bubbleState.visionCapacity) {
      alert("Vision is full!");
      return;
    }

    const newBubble: Bubble = {
      id: `bubble-${Date.now()}`,
      type,
      quality,
    };

    setBubbleState({
      ...bubbleState,
      bubbles: [...bubbleState.bubbles, newBubble],
    });
  };

  const removeBubble = (id: string) => {
    setBubbleState({
      ...bubbleState,
      bubbles: bubbleState.bubbles.filter((b) => b.id !== id),
    });
  };

  const updateBubbleQuality = (id: string, newQuality: BubbleQuality) => {
    setBubbleState({
      ...bubbleState,
      bubbles: bubbleState.bubbles.map((b) =>
        b.id === id ? { ...b, quality: newQuality } : b
      ),
    });
  };

  const startNewRun = () => {
    // Clear everything including fundamental
    setBubbleState({
      bubbles: [],
      visionCapacity: 10,
    });
    safeLocalStorageRemove(STORAGE_KEY);
  };

  const moveBubble = (fromIndex: number, toIndex: number) => {
    const newBubbles = [...bubbleState.bubbles];
    const [removed] = newBubbles.splice(fromIndex, 1);
    newBubbles.splice(toIndex, 0, removed);
    setBubbleState({
      ...bubbleState,
      bubbles: newBubbles,
    });
  };

  const clearAll = () => {
    setBubbleState({
      ...bubbleState,
      bubbles: [],
    });
  };

  // NEW: Functions for lotus choice comparison
  const addToCurrentChoices = (lotus: LotusEffect) => {
    // Don't add duplicates (like Rails: unless @cart.include?(product))
    if (!currentChoices.find((l) => l.id === lotus.id)) {
      setCurrentChoices([...currentChoices, lotus]);
    }
    setSearchQuery(""); // Clear search after adding
  };

  const removeFromCurrentChoices = (lotusId: string) => {
    setCurrentChoices(currentChoices.filter((l) => l.id !== lotusId));
  };

  const clearCurrentChoices = () => {
    setCurrentChoices([]);
  };

  // Export/Import functionality
  const [exportMessage, setExportMessage] = useState<string>("");
  const [importError, setImportError] = useState<string>("");

  const exportRun = async () => {
    const exportData = {
      bubbleState,
      userWeights,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    try {
      await navigator.clipboard.writeText(jsonString);
      setExportMessage("✓ Copied to clipboard!");
      setTimeout(() => setExportMessage(""), 3000);
    } catch (err) {
      // Fallback: show in alert if clipboard fails
      alert("Export data (copy manually):\n\n" + jsonString);
    }
  };

  const importRun = () => {
    const input = prompt("Paste your exported run data (JSON):");

    if (!input) return;

    try {
      const parsed = JSON.parse(input);

      // Validate structure
      if (!parsed.bubbleState || !parsed.userWeights) {
        throw new Error("Invalid export format");
      }

      // Validate bubble types
      if (parsed.bubbleState.bubbles) {
        const validBubbles = parsed.bubbleState.bubbles.filter((b: Bubble) =>
          VALID_BUBBLE_TYPES.includes(b.type)
        );
        parsed.bubbleState.bubbles = validBubbles;
      }

      // Apply imported state
      setBubbleState(parsed.bubbleState);
      setUserWeights(parsed.userWeights);

      setExportMessage("✓ Run imported successfully!");
      setTimeout(() => setExportMessage(""), 3000);
      setImportError("");
    } catch (err) {
      setImportError("Failed to import: Invalid JSON or format");
      setTimeout(() => setImportError(""), 5000);
    }
  };

  // Filter lotuses based on search query (like Rails: Product.where("name LIKE ?", query))
  const searchResults =
    searchQuery.length >= 2
      ? LOTUSES.filter((lotus) =>
          lotus.description.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 10) // Limit to 10 results
      : [];

  // SMART RECOMMENDATIONS: Use currentChoices if available, otherwise show top 3 from all
  const lotusesToRank = currentChoices.length > 0 ? currentChoices : LOTUSES;
  
  // Apply goal-oriented weights if a goal type is selected
  const activeWeights = applyGoalWeights(userWeights, goalType);
  
  // Use lookahead optimization if enabled, otherwise standard ranking
  const recommendations = useLookahead
    ? rankLotusChoicesWithLookahead(
        bubbleState,
        lotusesToRank,
        activeWeights,
        3,
        lookaheadDepth,
        useMonteCarlo
      )
    : rankLotusChoices(
        bubbleState,
        lotusesToRank,
        activeWeights,
        3,
        useMonteCarlo
      );

  // Calculate nightmare risk
  const nightmareRisk = calculateNightmareRisk(
    bubbleState.bubbles,
    userWeights
  );

  // Detect synergies
  const synergies = detectSynergies(bubbleState.bubbles);

  const selectLotus = (lotusId: string) => {
    const lotus = LOTUSES.find((l) => l.id === lotusId);
    if (!lotus) return;

    // If this is the first lotus choice and it's a fundamental, track it
    if (!bubbleState.fundamental && lotus.isFundamental) {
      setBubbleState({
        ...bubbleState,
        fundamental: lotus,
      });
    }

    // Clear current choices after selecting (ready for next choice)
    clearCurrentChoices();
  };

  return (
    <div className="app-container">
      <h1 className="app-title">🌙 Dream Helper - Twinightmare Calculator</h1>
      <p className="app-subtitle">
        Optimize your Dream Lotus choices in Torchlight Infinite
      </p>

      <div className="mb-2">
        <button
          onClick={startNewRun}
          className="btn btn-danger"
          title="Clear all bubbles and start fresh"
        >
          🆕 New Run
        </button>
        <button
          onClick={exportRun}
          className="btn btn-primary"
          style={{ marginLeft: "10px" }}
          title="Export current run to clipboard"
        >
          📤 Export Run
        </button>
        <button
          onClick={importRun}
          className="btn btn-secondary"
          style={{ marginLeft: "10px" }}
          title="Import run from clipboard"
        >
          📥 Import Run
        </button>
        <span className="help-text" style={{ marginLeft: "10px" }}>
          (Your progress auto-saves!)
        </span>
        {exportMessage && (
          <span className="success-message" style={{ marginLeft: "10px" }}>
            {exportMessage}
          </span>
        )}
        {importError && (
          <span className="error-message" style={{ marginLeft: "10px" }}>
            {importError}
          </span>
        )}
      </div>

      {bubbleState.fundamental && (
        <div className="card-info mb-3">
          <strong style={{ color: "#1976D2" }}>⭐ Fundamental Active:</strong>
          <p className="text-sm" style={{ margin: "5px 0 0 0" }}>
            {bubbleState.fundamental.description}
          </p>
        </div>
      )}

      {/* Nightmare Risk Visualization */}
      {bubbleState.bubbles.length > 0 && (
        <div className={`risk-card risk-${nightmareRisk.riskLevel} mb-3`}>
          <div className="risk-header">
            <strong className="risk-title">
              {nightmareRisk.riskLevel === "none" && "✅"}
              {nightmareRisk.riskLevel === "low" && "⚠️"}
              {nightmareRisk.riskLevel === "medium" && "⚠️"}
              {nightmareRisk.riskLevel === "high" && "🔥"}
              {nightmareRisk.riskLevel === "critical" && "💀"} Nightmare Risk
            </strong>
            <span className="risk-badge">
              {nightmareRisk.riskLevel.toUpperCase()}
            </span>
          </div>
          <p className="risk-description">
            If you die in Nightmare, you'll lose{" "}
            <strong>{nightmareRisk.bubblesAtRisk}</strong> bubble
            {nightmareRisk.bubblesAtRisk !== 1 ? "s" : ""} (1/6 of your current{" "}
            {bubbleState.bubbles.length})
          </p>
          <div className="risk-stats">
            <div className="risk-stat">
              <span className="risk-stat-label">Value at Risk:</span>
              <span className="risk-stat-value">
                {nightmareRisk.valueAtRisk.toFixed(1)}
              </span>
            </div>
            <div className="risk-stat">
              <span className="risk-stat-label">Total Value:</span>
              <span className="risk-stat-value">
                {calculateStateValue(bubbleState, userWeights).toFixed(1)}
              </span>
            </div>
            <div className="risk-stat">
              <span className="risk-stat-label">Loss %:</span>
              <span className="risk-stat-value">
                {(
                  (nightmareRisk.valueAtRisk /
                    calculateStateValue(bubbleState, userWeights)) *
                  100
                ).toFixed(0)}
                %
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Synergy Detection */}
      {synergies.length > 0 && (
        <div className="synergy-container mb-3">
          <h3 className="synergy-header">
            ✨ Active Synergies ({synergies.length})
          </h3>
          <div className="synergy-grid">
            {synergies.map((synergy) => (
              <div
                key={synergy.id}
                className={`synergy-card synergy-${synergy.strength}`}
              >
                <div className="synergy-title">
                  <span className="synergy-icon">{synergy.icon}</span>
                  <strong>{synergy.title}</strong>
                </div>
                <p className="synergy-description">{synergy.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="main-grid">
        {/* Left side: Current State */}
        <div>
          <h2 className="section-title">
            Current Dream Bubbles ({bubbleState.bubbles.length}/
            {bubbleState.visionCapacity})
          </h2>

          <div className="card mb-3">
            <h3 className="section-subtitle">Add Bubble:</h3>
            <div className="bubble-selector">
              {(
                [
                  "Gear",
                  "Blacksail",
                  "Cube",
                  "Commodity",
                  "Netherrealm",
                  "Fluorescent",

                  "Whim",
                ] as BubbleType[]
              ).map((type) => (
                <div key={type} className="bubble-type-group">
                  <span className="bubble-type-label">{type}:</span>
                  <select
                    className="select"
                    onChange={(e) =>
                      addBubble(type, e.target.value as BubbleQuality)
                    }
                    value=""
                  >
                    <option value="">--</option>
                    <option value="White">White</option>
                    <option value="Blue">Blue</option>
                    <option value="Purple">Purple</option>
                    <option value="Orange">Orange</option>
                    <option value="Red">Red</option>
                    <option value="Rainbow">Rainbow</option>
                  </select>
                </div>
              ))}
            </div>
            <button
              onClick={clearAll}
              className="btn btn-secondary btn-small mt-2"
            >
              Clear All
            </button>
          </div>

          <div className="bubble-container">
            {bubbleState.bubbles.length === 0 ? (
              <p className="empty-state">No bubbles yet. Add some above!</p>
            ) : (
              <div className="bubble-grid">
                {bubbleState.bubbles.map((bubble, index) => (
                  <div
                    key={bubble.id}
                    draggable
                    onDragStart={() => setDraggedIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedIndex !== null) {
                        moveBubble(draggedIndex, index);
                        setDraggedIndex(null);
                      }
                    }}
                    className={`bubble ${
                      editingBubbleId === bubble.id ? "editing" : ""
                    }`}
                    style={{
                      backgroundColor: getQualityColor(bubble.quality),
                      color:
                        bubble.quality === "White" || bubble.quality === "Blue"
                          ? "#000"
                          : "#fff",
                    }}
                  >
                    <img
                      src={getBubbleIconPath(bubble.type, bubble.quality)}
                      alt={`${bubble.type} ${bubble.quality}`}
                      className="bubble-icon"
                      onError={(e) => {
                        // Fallback if icon fails to load
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="bubble-type">{bubble.type}</div>
                    <div className="bubble-quality">{bubble.quality}</div>

                    {editingBubbleId === bubble.id ? (
                      <div className="quality-dropdown">
                        {(
                          [
                            "White",
                            "Blue",
                            "Purple",
                            "Orange",
                            "Red",
                            "Rainbow",
                          ] as BubbleQuality[]
                        ).map((quality) => (
                          <button
                            key={quality}
                            onClick={() => {
                              updateBubbleQuality(bubble.id, quality);
                              setEditingBubbleId(null);
                            }}
                            style={{
                              backgroundColor: getQualityColor(quality),
                              color:
                                quality === "White" || quality === "Blue"
                                  ? "#000"
                                  : "#fff",
                            }}
                          >
                            {quality}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <div className="bubble-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingBubbleId(
                            editingBubbleId === bubble.id ? null : bubble.id
                          );
                        }}
                        className="btn btn-secondary btn-tiny"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.3)",
                          border: "1px solid rgba(0,0,0,0.3)",
                        }}
                        title="Change quality"
                      >
                        ✎
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBubble(bubble.id);
                        }}
                        className="btn btn-danger btn-tiny"
                        style={{
                          backgroundColor: "rgba(255,0,0,0.6)",
                        }}
                        title="Remove bubble"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Recommendations */}
        <div>
          {/* Bubble Type Weights Section */}
          <div className="card mb-3">
            <div className="flex-between mb-2">
              <h3 className="section-subtitle" style={{ margin: 0 }}>
                ⚖️ Bubble Type Priorities
              </h3>
              <button
                onClick={resetWeights}
                className="btn btn-secondary btn-small"
                title="Reset to default weights"
              >
                Reset
              </button>
            </div>
            <p className="help-text mb-2">
              Higher values = more valuable in recommendations
            </p>
            <div className="weight-list">
              {(Object.keys(userWeights.typeWeights) as BubbleType[]).map(
                (type) => (
                  <div key={type} className="weight-item">
                    <label className="weight-label">{type}:</label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={userWeights.typeWeights[type]}
                      onChange={(e) =>
                        updateTypeWeight(type, parseFloat(e.target.value))
                      }
                      className="weight-slider"
                    />
                    <span className="weight-value">
                      {userWeights.typeWeights[type].toFixed(1)}
                    </span>
                  </div>
                )
              )}
            </div>

            {/* Monte Carlo Toggle */}
            <div
              className="monte-carlo-toggle mt-3"
              style={{ paddingTop: "1rem", borderTop: "1px solid #e1e8ed" }}
            >
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={useMonteCarlo}
                  onChange={(e) => setUseMonteCarlo(e.target.checked)}
                  className="toggle-checkbox"
                />
                <span className="toggle-text">
                  🎲 Use Monte Carlo Simulation (more accurate for probabilistic
                  effects)
                </span>
              </label>
              {useMonteCarlo && (
                <p
                  className="help-text"
                  style={{ marginTop: "0.5rem", fontSize: "0.8125rem" }}
                >
                  Running 100 simulations per lotus - may be slightly slower but
                  more accurate
                </p>
              )}
            </div>

            {/* Lookahead Optimization Toggle */}
            <div
              className="lookahead-toggle mt-3"
              style={{ paddingTop: "1rem", borderTop: "1px solid #e1e8ed" }}
            >
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={useLookahead}
                  onChange={(e) => setUseLookahead(e.target.checked)}
                  className="toggle-checkbox"
                />
                <span className="toggle-text">
                  🔮 Enable Lookahead Optimization (plan {lookaheadDepth} moves ahead)
                </span>
              </label>
              {useLookahead && (
                <div style={{ marginTop: "0.75rem" }}>
                  <label
                    className="help-text"
                    style={{ display: "block", marginBottom: "0.25rem" }}
                  >
                    Lookahead Depth: {lookaheadDepth}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="3"
                    value={lookaheadDepth}
                    onChange={(e) => setLookaheadDepth(Number(e.target.value))}
                    style={{ width: "100%" }}
                  />
                  <p
                    className="help-text"
                    style={{ marginTop: "0.5rem", fontSize: "0.8125rem" }}
                  >
                    Considers future lotus opportunities - better long-term strategy but slower
                  </p>
                </div>
              )}
            </div>

            {/* Goal-Oriented Mode */}
            <div
              className="goal-mode mt-3"
              style={{ paddingTop: "1rem", borderTop: "1px solid #e1e8ed" }}
            >
              <h4 className="help-text" style={{ marginBottom: "0.5rem", fontWeight: "600" }}>
                🎯 Goal-Oriented Mode
              </h4>
              <p className="help-text" style={{ marginBottom: "0.75rem", fontSize: "0.8125rem" }}>
                Focus recommendations on a specific bubble type
              </p>
              <div className="goal-buttons">
                <button
                  onClick={() => setGoalType(null)}
                  className={`goal-btn ${goalType === null ? "active" : ""}`}
                >
                  None
                </button>
                {VALID_BUBBLE_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setGoalType(type)}
                    className={`goal-btn ${goalType === type ? "active" : ""}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {goalType && (
                <p
                  className="help-text"
                  style={{ marginTop: "0.5rem", fontSize: "0.8125rem" }}
                >
                  Prioritizing {goalType} bubbles (3x weight boost)
                </p>
              )}
            </div>
          </div>

          {/* NEW: Lotus Choice Comparison Section */}
          <div className="card-warning mb-3">
            <h3 className="section-subtitle" style={{ margin: "0 0 10px 0" }}>
              🎯 Compare Lotus Choices
            </h3>
            <p className="help-text mb-2">
              Search and add the lotuses you're offered in-game
            </p>

            {/* Search Input */}
            <div className="relative mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lotus... (e.g. 'adds 2 gear')"
                className="input input-search"
              />

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="search-dropdown">
                  {searchResults.map((lotus) => (
                    <div
                      key={lotus.id}
                      onClick={() => addToCurrentChoices(lotus)}
                      className="search-result"
                    >
                      {lotus.description}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Choices */}
            {currentChoices.length > 0 && (
              <div>
                <div className="flex-between mb-1">
                  <strong className="text-sm">
                    Comparing ({currentChoices.length}):
                  </strong>
                  <button
                    onClick={clearCurrentChoices}
                    className="btn btn-danger btn-small"
                  >
                    Clear All
                  </button>
                </div>
                <div className="choice-list">
                  {currentChoices.map((lotus) => (
                    <div key={lotus.id} className="choice-item">
                      <span>{lotus.description}</span>
                      <button
                        onClick={() => removeFromCurrentChoices(lotus.id)}
                        className="btn btn-danger btn-tiny"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <h2 className="section-title">Recommended Lotus Choices</h2>
          {currentChoices.length > 0 && (
            <p className="text-success text-sm" style={{ marginTop: "-8px" }}>
              ✓ Comparing your {currentChoices.length} selected choices
            </p>
          )}
          {bubbleState.bubbles.length === 0 ? (
            <p className="text-muted">
              Add some bubbles to see recommendations
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              {recommendations.map((rec, index) => (
                <div
                  key={rec.lotus.id}
                  className={`recommendation ${index === 0 ? "best" : ""}`}
                >
                  <div className="recommendation-header">
                    <div>
                      <h3 className="recommendation-title">
                        {index === 0 && "⭐ "}
                        {rec.lotus.name}
                      </h3>
                      <p className="recommendation-description">
                        {rec.lotus.description}
                      </p>
                      <p className="recommendation-omen">
                        Nightmare: {rec.lotus.nightmareOmen}
                      </p>
                    </div>
                    <div
                      className={`recommendation-score ${
                        index === 0 ? "best" : "normal"
                      }`}
                    >
                      +{rec.score.toFixed(1)}
                      {useLookahead && "lookaheadScore" in rec && typeof rec.lookaheadScore === "number" && (
                        <div className="lookahead-score" style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                          (w/ future: +{rec.lookaheadScore.toFixed(1)})
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="recommendation-info">
                    Result: {rec.simulatedState.bubbles.length} bubbles
                  </div>
                  {rec.lotus.isFundamental && !bubbleState.fundamental && (
                    <div className="card-warning" style={{ marginTop: "10px" }}>
                      ⚠️ This is a <strong>Fundamental</strong> - persistent
                      effect for the whole run!
                    </div>
                  )}
                  <button
                    onClick={() => selectLotus(rec.lotus.id)}
                    className={`btn ${
                      index === 0 ? "btn-success" : "btn-primary"
                    }`}
                    style={{ marginTop: "10px" }}
                  >
                    {rec.lotus.isFundamental && !bubbleState.fundamental
                      ? "Set as Fundamental"
                      : "Select This Lotus"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card mt-4">
        <h3 className="section-subtitle">How to Use:</h3>
        <ol>
          <li>Add your current Dream Bubbles using the dropdowns above</li>
          <li>
            <strong>Drag bubbles to reorder them</strong>
          </li>
          <li>
            <strong>Click the ✎ button to change a bubble's quality</strong>
          </li>
          <li>Click the ✕ button to remove a bubble</li>
          <li>
            The calculator will show you the top 3 recommended Lotus choices
          </li>
          <li>The score shows the expected value increase for each choice</li>
          <li>Green highlight = best choice</li>
        </ol>
        <p className="help-text mt-3">
          Note: This is an MVP version. More lotus options and advanced features
          coming soon!
        </p>
      </div>

      {/* Attribution Footer */}
      <div className="attribution-footer mt-4">
        <p className="text-xs text-muted">
          Bubble icons © XD Entertainment - Torchlight Infinite. Accessed via{" "}
          <a
            href="https://tlidb.com/en/Dream_Bubbles"
            target="_blank"
            rel="noopener noreferrer"
          >
            TLIDB.com
          </a>
          . This is a fan-made tool and is not affiliated with XD Entertainment.
        </p>
      </div>
    </div>
  );
}

function getQualityColor(quality: BubbleQuality): string {
  switch (quality) {
    case "White":
      return "#f0f0f0";
    case "Blue":
      return "#4FC3F7";
    case "Purple":
      return "#BA68C8";
    case "Orange":
      return "#FF9800";
    case "Red":
      return "#F44336";
    case "Rainbow":
      return "linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)";
  }
}

export default App;
