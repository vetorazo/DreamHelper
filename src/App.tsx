import { useState, useEffect } from "react";
import type {
  BubbleState,
  Bubble,
  BubbleType,
  BubbleQuality,
  UserWeights,
} from "./types";
import { DEFAULT_QUALITY_MULTIPLIERS, DEFAULT_TYPE_WEIGHTS } from "./types";
import { rankLotusChoices } from "./engine/calculator";
import { LOTUSES } from "./data/lotuses";

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

function App() {
  // CONCEPT: Lazy initialization - function runs only on first render
  // Like Rails: @bubbles ||= load_from_cache
  const [bubbleState, setBubbleState] = useState<BubbleState>(() => {
    // Try to load from localStorage on initial mount
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate and filter out any bubbles with invalid types
        if (parsed.bubbles) {
          parsed.bubbles = parsed.bubbles.filter((b: Bubble) =>
            VALID_BUBBLE_TYPES.includes(b.type)
          );
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved state:", e);
      }
    }
    // Default state if nothing saved
    return {
      bubbles: [],
      visionCapacity: 10,
    };
  });

  const [userWeights, setUserWeights] = useState<UserWeights>(() => {
    const saved = localStorage.getItem(WEIGHTS_STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bubbleState));
  }, [bubbleState]); // Dependency array - re-run when bubbleState changes

  useEffect(() => {
    localStorage.setItem(WEIGHTS_STORAGE_KEY, JSON.stringify(userWeights));
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
    localStorage.removeItem(STORAGE_KEY);
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

  const recommendations = rankLotusChoices(
    bubbleState,
    LOTUSES,
    userWeights,
    3
  );

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
  };

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif" }}>
      <h1>🌙 Dream Helper - Twinightmare Calculator</h1>
      <p style={{ color: "#666" }}>
        Optimize your Dream Lotus choices in Torchlight Infinite
      </p>

      <div style={{ marginBottom: "10px" }}>
        <button
          onClick={startNewRun}
          style={{
            backgroundColor: "#ff6b6b",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
          title="Clear all bubbles and start fresh"
        >
          🆕 New Run
        </button>
        <span style={{ marginLeft: "10px", fontSize: "12px", color: "#999" }}>
          (Your progress auto-saves!)
        </span>
      </div>

      {bubbleState.fundamental && (
        <div
          style={{
            backgroundColor: "#e3f2fd",
            border: "2px solid #2196F3",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "20px",
          }}
        >
          <strong style={{ color: "#1976D2" }}>⭐ Fundamental Active:</strong>
          <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
            {bubbleState.fundamental.description}
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "40px",
          marginTop: "30px",
        }}
      >
        {/* Left side: Current State */}
        <div>
          <h2>
            Current Dream Bubbles ({bubbleState.bubbles.length}/
            {bubbleState.visionCapacity})
          </h2>

          <div style={{ marginBottom: "20px" }}>
            <h3>Add Bubble:</h3>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
                <div key={type}>
                  <strong>{type}:</strong>
                  <select
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
            <button onClick={clearAll} style={{ marginTop: "10px" }}>
              Clear All
            </button>
          </div>

          <div
            style={{
              border: "2px solid #333",
              borderRadius: "8px",
              padding: "15px",
              minHeight: "200px",
              backgroundColor: "#f9f9f9",
            }}
          >
            {bubbleState.bubbles.length === 0 ? (
              <p style={{ color: "#999", textAlign: "center" }}>
                No bubbles yet. Add some above!
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
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
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      backgroundColor: getQualityColor(bubble.quality),
                      color:
                        bubble.quality === "White" || bubble.quality === "Blue"
                          ? "#000"
                          : "#fff",
                      cursor: "grab",
                      border:
                        editingBubbleId === bubble.id
                          ? "3px solid #4CAF50"
                          : "2px solid #000",
                      position: "relative",
                      minWidth: "80px",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: "bold" }}>
                      {bubble.type}
                    </div>
                    <div style={{ fontSize: "10px", marginBottom: "5px" }}>
                      {bubble.quality}
                    </div>

                    {editingBubbleId === bubble.id ? (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          backgroundColor: "#fff",
                          border: "2px solid #4CAF50",
                          borderRadius: "4px",
                          padding: "5px",
                          zIndex: 1000,
                          marginTop: "5px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        }}
                      >
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
                              display: "block",
                              width: "100%",
                              padding: "5px 10px",
                              margin: "2px 0",
                              backgroundColor: getQualityColor(quality),
                              color:
                                quality === "White" || quality === "Blue"
                                  ? "#000"
                                  : "#fff",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontWeight: "bold",
                            }}
                          >
                            {quality}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <div
                      style={{ display: "flex", gap: "5px", marginTop: "5px" }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingBubbleId(
                            editingBubbleId === bubble.id ? null : bubble.id
                          );
                        }}
                        style={{
                          padding: "2px 6px",
                          fontSize: "10px",
                          backgroundColor: "rgba(255,255,255,0.3)",
                          border: "1px solid rgba(0,0,0,0.3)",
                          borderRadius: "3px",
                          cursor: "pointer",
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
                        style={{
                          padding: "2px 6px",
                          fontSize: "10px",
                          backgroundColor: "rgba(255,0,0,0.6)",
                          border: "1px solid rgba(0,0,0,0.3)",
                          borderRadius: "3px",
                          cursor: "pointer",
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
          <div
            style={{
              backgroundColor: "#f5f5f5",
              border: "2px solid #9e9e9e",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <h3 style={{ margin: 0 }}>⚖️ Bubble Type Priorities</h3>
              <button
                onClick={resetWeights}
                style={{
                  padding: "4px 8px",
                  fontSize: "12px",
                  backgroundColor: "#757575",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                title="Reset to default weights"
              >
                Reset
              </button>
            </div>
            <p
              style={{ fontSize: "12px", color: "#666", margin: "0 0 10px 0" }}
            >
              Higher values = more valuable in recommendations
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {(Object.keys(userWeights.typeWeights) as BubbleType[]).map(
                (type) => (
                  <div
                    key={type}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <label
                      style={{
                        minWidth: "100px",
                        fontSize: "13px",
                        fontWeight: "500",
                      }}
                    >
                      {type}:
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={userWeights.typeWeights[type]}
                      onChange={(e) =>
                        updateTypeWeight(type, parseFloat(e.target.value))
                      }
                      style={{ flex: 1 }}
                    />
                    <span
                      style={{
                        minWidth: "35px",
                        fontSize: "13px",
                        fontWeight: "bold",
                      }}
                    >
                      {userWeights.typeWeights[type].toFixed(1)}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          <h2>Recommended Lotus Choices</h2>
          {bubbleState.bubbles.length === 0 ? (
            <p style={{ color: "#999" }}>
              Add some bubbles to see recommendations
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              {recommendations.map((rec, index) => (
                <div
                  key={rec.lotus.id}
                  style={{
                    border: `3px solid ${index === 0 ? "#4CAF50" : "#ddd"}`,
                    borderRadius: "8px",
                    padding: "15px",
                    backgroundColor: index === 0 ? "#f0f8f0" : "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 5px 0" }}>
                        {index === 0 && "⭐ "}
                        {rec.lotus.name}
                      </h3>
                      <p
                        style={{
                          margin: "5px 0",
                          fontSize: "14px",
                          color: "#666",
                        }}
                      >
                        {rec.lotus.description}
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#999",
                          margin: "5px 0",
                        }}
                      >
                        Nightmare: {rec.lotus.nightmareOmen}
                      </p>
                    </div>
                    <div
                      style={{
                        backgroundColor: index === 0 ? "#4CAF50" : "#2196F3",
                        color: "white",
                        padding: "5px 15px",
                        borderRadius: "20px",
                        fontWeight: "bold",
                        fontSize: "18px",
                      }}
                    >
                      +{rec.score.toFixed(1)}
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    Result: {rec.simulatedState.bubbles.length} bubbles
                  </div>
                  {rec.lotus.isFundamental && !bubbleState.fundamental && (
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "8px",
                        backgroundColor: "#fff3cd",
                        border: "1px solid #ffc107",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    >
                      ⚠️ This is a <strong>Fundamental</strong> - persistent
                      effect for the whole run!
                    </div>
                  )}
                  <button
                    onClick={() => selectLotus(rec.lotus.id)}
                    style={{
                      marginTop: "10px",
                      padding: "8px 16px",
                      backgroundColor: index === 0 ? "#4CAF50" : "#2196F3",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
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

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <h3>How to Use:</h3>
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
        <p style={{ fontSize: "12px", color: "#999", marginTop: "15px" }}>
          Note: This is an MVP version. More lotus options and advanced features
          coming soon!
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
