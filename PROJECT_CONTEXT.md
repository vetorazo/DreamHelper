# Dream Helper - Project Context

## Project Overview
Web application to help Torchlight Infinite players optimize their Twinightmare Dream Lotus choices.

## Core Mechanics
- **Dream Bubbles**: Rewards with type (7 types + Whim) and quality (White→Blue→Purple→Orange→Red→Rainbow)
- **Sweet Dream Lotuses**: ~287 options that modify bubbles (add/remove/upgrade/change type/replicate)
- **Fundamentals**: First lotus choice with persistent effects
- **Vision**: Limited slots for bubbles (can overflow if full)
- **Nightmare**: Risk/reward - lose 1/6 bubbles per death, but rewards become real

## Tech Stack
- **Frontend**: React 19 + TypeScript
- **Build**: Vite
- **Styling**: TBD (will add Tailwind CSS)
- **State**: Local state initially, may add Zustand later

## Project Structure
```
src/
├── types/          # Type definitions (bubbles, lotuses, state)
├── engine/         # Core calculation logic
├── components/     # React components
├── data/           # Lotus and bubble data
├── utils/          # Helper functions
└── App.tsx         # Main app
```

## Implementation Phases

### Phase 1: MVP (Current)
- [x] Project setup
- [ ] Type definitions
- [ ] Basic calculation engine (weighted scoring)
- [ ] Simple UI (input current state, show 3 lotus recommendations)
- [ ] Initial data entry for lotuses

### Phase 2: Enhanced
- [ ] Synergy detection
- [ ] Fundamental tracking
- [ ] Better UI with visual bubble display
- [ ] Risk assessment

### Phase 3: Advanced
- [ ] Monte Carlo simulation
- [ ] Lookahead optimization
- [ ] Historical learning
- [ ] Goal-oriented modes

## Current Algorithm
Simple weighted scoring:
```
Score = Σ (bubble_quality_multiplier × type_weight)
Quality multipliers: White=1, Blue=2, Purple=4, Orange=8, Red=16, Rainbow=32
```

## Key Files to Remember
- `PROJECT_CONTEXT.md` - This file (read to restore context)
- `src/types/index.ts` - Core type definitions
- `src/engine/calculator.ts` - Main calculation logic
- `src/data/lotuses.ts` - Lotus database

## Development Notes
- Commit regularly with casual messages
- Keep types strict
- Build incrementally, test each piece
- Focus on correctness before optimization

## Last Updated
Phase 1 - Initial setup (2026-01-12)
