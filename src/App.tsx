import { useState } from "react";
import type {
  BubbleState,
  Bubble,
  BubbleType,
  BubbleQuality,
  UserWeights,
} from "./types";
import { DEFAULT_QUALITY_MULTIPLIERS, DEFAULT_TYPE_WEIGHTS } from "./types";
import { rankLotusChoices } from "./engine/calculator";
import { SAMPLE_LOTUSES } from "./data/lotuses";

function App() {
  const [bubbleState, setBubbleState] = useState<BubbleState>({
    bubbles: [],
    visionCapacity: 10,
  });

  const [userWeights] = useState<UserWeights>({
    qualityMultipliers: DEFAULT_QUALITY_MULTIPLIERS,
    typeWeights: DEFAULT_TYPE_WEIGHTS,
    riskTolerance: 0.5,
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingBubbleId, setEditingBubbleId] = useState<string | null>(null);

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
    SAMPLE_LOTUSES,
    userWeights,
    3
  );

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif" }}>
      <h1>🌙 Dream Helper - Twinightmare Calculator</h1>
      <p style={{ color: "#666" }}>
        Optimize your Dream Lotus choices in Torchlight Infinite
      </p>

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
                  "Fuel",
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
