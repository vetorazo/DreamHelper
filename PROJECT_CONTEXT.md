# Dream Helper - Project Context

## Project Overview

Web application to help Torchlight Infinite players optimize their Twinightmare Dream Lotus choices.

## Core Mechanics

- **Dream Bubbles**: Rewards with type (7 types: Gear/Blacksail/Cube/Commodity/Netherrealm/Fluorescent/Whim) and quality (White→Blue→Purple→Orange→Red→Rainbow)
- **Sweet Dream Lotuses**: 274 options that modify bubbles (add/remove/upgrade/change type/replicate)
- **Fundamentals**: First lotus choice with persistent "upon entering nightmare" effects (tracked separately, applied automatically)
- **Vision**: Limited slots for bubbles (default 10, can overflow if full)
- **Nightmare**: Risk/reward - lose 1/6 bubbles per death, but rewards become real
- **Lotus Comparison**: Search and add specific lotus choices from in-game to compare them directly

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build**: Vite + tsx for scripts
- **Styling**: Organized CSS with semantic classes (App.css)
- **State**: useState + localStorage for persistence
- **Data Generation**: Programmatic lotus generation using TypeScript scripts

## Project Structure

```
src/
├── types/
│   └── index.ts           # Core type definitions (BubbleState, LotusEffect, UserWeights)
├── engine/
│   └── calculator.ts      # Scoring engine with fundamental effects
├── data/
│   └── lotuses.ts         # AUTO-GENERATED - 274 lotus variants
├── App.tsx                # Main UI with comparison workflow
├── App.css                # Organized styles with semantic classes
└── main.tsx

scripts/
├── parseLotuses.ts        # Parser + lotus variant generator
└── generateLotuses.ts     # Script runner to generate lotuses.ts
```

## Implementation Phases

### Phase 1: MVP ✅ COMPLETE

- [x] Project setup (Vite + React + TypeScript)
- [x] Type definitions (discriminated unions for effects)
- [x] Basic calculation engine (weighted scoring with simulation)
- [x] UI with bubble add/remove, quality editing, drag-and-drop reordering
- [x] Lotus parser and programmatic data generation (274 variants)
- [x] localStorage auto-save persistence with error handling
- [x] Fundamental tracking UI and engine integration
- [x] "New Run" functionality
- [x] User weight customization (sliders for bubble type preferences)
- [x] Lotus choice comparison (search and compare specific in-game choices)
- [x] UI polish with organized CSS and semantic classes
- [x] Fixed "Fuel" bubble type (removed - not in game)
- [x] localStorage validation and fallback clearing

### Phase 2: Enhanced ✅ COMPLETE

- [x] User weight customization (sliders for bubble type preferences)
- [x] Better UI polish with organized CSS
- [x] Lotus comparison workflow (search, add, compare)
- [x] Improved bubble selector visibility
- [x] Dark mode text fixes (all white-on-white issues resolved)
- [x] Nightmare risk visualization with color-coded severity levels
- [x] Authentic game icons with attribution (42 bubble icons downloaded)
- [x] Synergy detection system (combo effects and strategic insights)

### Phase 3: Advanced ✅ PARTIALLY COMPLETE

- [x] Export/import runs for sharing (JSON clipboard copy/paste)
- [x] Monte Carlo simulation for probabilistic effects (100 simulations per lotus)
- [x] Goal-oriented modes (3x weight boost for specific bubble types)
- [x] Lookahead optimization (plan 2-3 moves ahead for better long-term strategy)
- [x] Recommendation explanations (visual badges showing why each lotus is good)
- [x] Undo/Redo system (tracks last 20 actions for mistake recovery)
- [ ] Historical learning from previous runs
- [ ] Statistics tracking across multiple runs

## Current Algorithm

Simulation-based weighted scoring with fundamental effects, synergy detection, optional Monte Carlo, goal-oriented modes, and lookahead optimization:

```
1. applyGoalWeights(weights, goalType) -> modified weights (3x boost if goal selected)
2. simulateLotusEffect(state, lotus) -> new state
3. applyFundamentalEffects(state, useMonteCarlo) -> modified state
4. calculateStateValue(state, weights) -> numeric score
5. detectSynergies(bubbles) -> array of active synergies
6. explainRecommendation(state, lotus, simulatedState, goalType) -> reason badges
7. Score = newValue - currentValue

Monte Carlo (optional): Run 100 simulations for probabilistic effects (45% chances)
Lookahead (optional): Plan 2-3 moves ahead, considering future lotus opportunities (0.7 discount)
Quality multipliers: White=1, Blue=2, Purple=4, Orange=8, Red=16, Rainbow=32
Type weights: All default to 1.0, Whim=1.2 (user customizable)
Goal mode: Boosts selected type weight by 3x for focused strategies
```

**Fundamental Effects**: Persistent bonuses that trigger "upon entering nightmare" - tracked separately and applied automatically in scoring.

**Monte Carlo Simulation**: For probabilistic effects (like "45% chance to upgrade"), runs 100 simulations and averages results for more accurate recommendations. Toggle in UI.

**Goal-Oriented Mode**: Select a specific bubble type (Gear, Blacksail, etc.) to boost its weight by 3x. Helps when pursuing focused strategies like "maximize Commodity for money".

**Lookahead Optimization**: Plans 2-3 moves ahead by simulating each choice and evaluating the next best moves that would follow. Finds better long-term strategies by avoiding "greedy" choices that limit future options. Future value discounted by 0.7.

**Recommendation Explanations**: Each lotus shows visual badges explaining strategic value:
- ✨ Synergy Boost (creates/strengthens type combos)
- ⬆️ Major Upgrade (upgrades 3+ bubbles)
- 🎯 Goal Progress (adds bubbles matching goal type)
- 💎 High Value (adds Orange+ bubbles)
- 📈 Big Gain (adds 3+ bubbles)

**Undo/Redo**: Tracks last 20 state changes (add, remove, quality change, move, etc.) for easy mistake recovery.

**Export/Import**: Copy entire run state (bubbles + weights) to clipboard as JSON. Share builds or save multiple strategies.

**Synergy Detection**: Identifies powerful bubble combinations:

- Type synergies (3+ of same type)
- Quality synergies (multiple high-quality bubbles)
- Type combos (Gear + Blacksail)
- Critical mass thresholds (6+ for Rainbow gains)
- Upgrade potential (low-quality clusters)
- Diversity bonuses (Whim value with many types)

**Goal-Oriented Mode**: Select bubble type (None, Gear, Blacksail, Cube, Commodity, Netherrealm, Fluorescent, Whim) to boost recommendations toward that type (3x weight multiplier).

**Lookahead Optimization**: Toggle to plan 2-3 moves ahead instead of just immediate value. Considers what good moves become available after each choice. Slower but finds better long-term strategies.

**Recommendation Explanations**: Visual badges on each recommendation:
- ✨ Synergy Boost! (purple) - Creates/strengthens bubble type combos
- ⬆️ Major Upgrade! (blue) - Upgrades 3+ bubbles at once
- 🎯 Goal Progress! (yellow) - Adds bubbles matching your goal type
- 💎 High Value! (pink) - Adds Orange+ quality bubbles
- 📈 Big Gain! (teal) - Adds 3+ bubbles

**Undo/Redo**: ↶ Undo and ↷ Redo buttons track last 20 actions. Recover from mistakes easily (wrong quality, accidental deletion, etc.).

## Key Files to Remember

- `PROJECT_CONTEXT.md` - This file (read to restore context)
- `src/types/index.ts` - Core type definitions (BubbleState, LotusEffect with discriminated unions, UserWeights)
- `src/engine/calculator.ts` - Scoring engine (simulateLotusEffect, applyFundamentalEffects, scoreLotusChoice, rankLotusChoices)
- `src/data/lotuses.ts` - AUTO-GENERATED lotus database (274 variants)
- `src/App.tsx` - Main UI with localStorage persistence, drag-drop, fundamental display
- `scripts/parseLotuses.ts` - Lotus parser and programmatic variant generator
- `scripts/generateLotuses.ts` - Script runner

## Development Notes

- Commit regularly with casual messages ("added drag and drop", "localStorage auto-save", etc.)
- Keep types strict (TypeScript discriminated unions for effect types)
- Build incrementally, test each piece in browser (localhost:5173)
- Educational focus: TypeScript concepts explained via Rails/Ruby comparisons
- Use programmatic generation for DRY data entry (forEach loops over manual arrays)

## Recent Commits

- "initial setup" - Vite + React + TypeScript project
- "added drag and drop" - Bubble reordering, click-to-edit quality
- "added lotus parser" - Programmatic lotus data generation
- "localStorage auto-save" - Persistence across page reloads
- "fundamental tracking UI" - Blue banner, selection button
- "calculator applies fundamentals" - Engine integration
- "expanded lotus database to 274 variants" - Full data with programmatic generation
- "added user weight customization" - Sliders for bubble type priorities
- "removed Fuel bubble type" - Not in game, added validation
- "localStorage validation" - Error handling for security restrictions
- "added lotus choice comparison" - Search and compare specific lotuses from game
- "improved UI styling" - Replaced inline styles with organized CSS
- "improved bubble selector dropdowns" - Larger, more visible with better contrast
- "fixed dropdown/search/card text colors" - Resolved all white-on-white visibility issues
- "added nightmare risk visualization" - Color-coded risk levels with value-at-risk display
- "added authentic bubble icons" - Downloaded all 42 game icons with proper attribution
- "added synergy detection" - Identifies powerful bubble combos and strategic opportunities
- "fixed commodity icons" - Replaced with correct Fuel icons using proper URL abbreviations
- "added export/import runs" - Copy builds to clipboard and share with others
- "added Monte Carlo simulation" - Runs 100 simulations for probabilistic effects (45% chances)
- "added goal-oriented mode and lookahead optimization" - Focus on specific bubble types and plan multiple moves ahead
- "added recommendation explanations and undo/redo" - Visual badges show why lotuses are good, players can undo mistakes

## Known Issues / Future Improvements
Statistics dashboard (track performance across multiple runs)
- [ ] Historical learning from previous runs
- [ ] Keyboard shortcuts (Space to add, Delete to remove, arrows to navigate)
- [ ] Save multiple builds (compare different strategies)
- [ ] Better mobile layout

## Last Updated

Phase 3 (nearly complete) - Added goal-oriented mode, lookahead optimization, recommendation explanations, and undo/redo system

Phase 3 (partial) - Added export/import and Monte Carlo simulation for better accuracy (2026-01-14)
