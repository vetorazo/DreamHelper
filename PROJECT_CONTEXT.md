# Dream Helper - Project Context

## Project Overview

Web application to help Torchlight Infinite players optimize their Twinightmare Dream Lotus choices.

## Core Mechanics

- **Dream Bubbles**: Rewards with type (7 types: Gear/Blacksail/Cube/Commodity/Netherrealm/Fluorescent/Whim) and quality (White→Blue→Purple→Orange→Red→Rainbow)
- **Sweet Dream Lotuses**: 274 options that modify bubbles (add/remove/upgrade/change type/replicate)
- **Fundamentals**: First lotus choice with persistent "upon entering nightmare" effects (tracked separately, applied automatically)
- **Vision**: Limited slots for bubbles (default 10, can overflow if full)
- **Nightmare**: Risk/reward - lose 1/6 bubbles per death, but rewards become real

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build**: Vite + tsx for scripts
- **Styling**: Basic CSS (Tailwind planned)
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
├── App.tsx                # Main UI (bubble management, drag-drop, recommendations)
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
- [x] localStorage auto-save persistence
- [x] Fundamental tracking UI and engine integration
- [x] "New Run" functionality

### Phase 2: Enhanced (Planned)

- [ ] User weight customization (sliders for bubble type preferences)
- [ ] Better UI polish with Tailwind CSS
- [ ] Synergy detection (combo effects)
- [ ] Risk assessment visualization
- [ ] More accurate simulation (handle conditionals)

### Phase 3: Advanced (Future)

- [ ] Monte Carlo simulation for probabilistic effects
- [ ] Lookahead optimization (multi-step planning)
- [ ] Historical learning from previous runs
- [ ] Goal-oriented modes (maximize specific bubble types)

## Current Algorithm

Simulation-based weighted scoring with fundamental effects:

```
1. simulateLotusEffect(state, lotus) -> new state
2. applyFundamentalEffects(state) -> modified state (if fundamental set)
3. calculateStateValue(state, weights) -> numeric score
4. Score = newValue - currentValue

Quality multipliers: White=1, Blue=2, Purple=4, Orange=8, Red=16, Rainbow=32
Type weights: All default to 1.0 (user customization planned)
```

**Fundamental Effects**: Persistent bonuses that trigger "upon entering nightmare" - tracked separately and applied automatically in scoring.

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
- "expanded lotus database to 274 variants with programmatic generation" - Full data

## Known Issues / Future Improvements

- [ ] Add weight customization UI (currently uses defaults)
- [ ] Handle complex lotus conditions better (currently simplified)
- [ ] Add Tailwind CSS for better styling
- [ ] Probabilistic effects (45% chance) use simplified simulation

## Last Updated

Phase 1 complete - Full MVP with 274 lotuses (2026-01-13)
