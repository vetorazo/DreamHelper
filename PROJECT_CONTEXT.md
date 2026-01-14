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

### Phase 3: Advanced (Future)

- [ ] Monte Carlo simulation for probabilistic effects
- [ ] Lookahead optimization (multi-step planning)
- [ ] Historical learning from previous runs
- [ ] Goal-oriented modes (maximize specific bubble types)
- [ ] Export/import runs for sharing
- [ ] Statistics tracking across multiple runs

## Current Algorithm

Simulation-based weighted scoring with fundamental effects and synergy detection:

```
1. simulateLotusEffect(state, lotus) -> new state
2. applyFundamentalEffects(state) -> modified state (if fundamental set)
3. calculateStateValue(state, weights) -> numeric score
4. detectSynergies(bubbles) -> array of active synergies
5. Score = newValue - currentValue

Quality multipliers: White=1, Blue=2, Purple=4, Orange=8, Red=16, Rainbow=32
Type weights: All default to 1.0, Whim=1.2 (user customizable)
```

**Fundamental Effects**: Persistent bonuses that trigger "upon entering nightmare" - tracked separately and applied automatically in scoring.

**Synergy Detection**: Identifies powerful bubble combinations:

- Type synergies (3+ of same type)
- Quality synergies (multiple high-quality bubbles)
- Type combos (Gear + Blacksail)
- Critical mass thresholds (6+ for Rainbow gains)
- Upgrade potential (low-quality clusters)
- Diversity bonuses (Whim value with many types)

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

## Known Issues / Future Improvements

- [ ] Handle complex lotus conditions better (currently simplified)
- [ ] Probabilistic effects (45% chance) use simplified simulation
- [ ] Monte Carlo for better accuracy with random effects
- [ ] Lookahead planning (multi-step optimization)
- [ ] Export/import runs for sharing
- [ ] Statistics tracking across multiple runs
- [ ] Goal-oriented modes (maximize specific bubble types)

## Last Updated

Phase 2 complete - Enhanced UI with synergy detection, risk visualization, and authentic game icons (2026-01-14)
