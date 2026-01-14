# Dream Helper 🌙

**Dream Helper** is a web-based optimization calculator for Torchlight Infinite's Twinightmare Dream mechanic. It helps players make better Sweet Dream Lotus choices through sophisticated simulation and strategic planning algorithms.

## Features

### Core Functionality
- **274 Lotus Variants** - Complete database of all Sweet Dream Lotus options
- **Bubble Management** - Add, remove, edit quality, and drag-to-reorder bubbles
- **Fundamental Tracking** - Persistent effects automatically applied in scoring
- **Real-time Recommendations** - Instant ranking of best lotus choices
- **Authentic Icons** - All 42 bubble icons directly from the game

### Advanced Planning
- **Goal-Oriented Mode** - Focus on specific bubble types (3x weight boost)
- **Lookahead Optimization** - Plan 2-3 moves ahead for better long-term strategy
- **Monte Carlo Simulation** - 100 iterations for accurate probabilistic effects (45% chances)
- **Synergy Detection** - Identifies powerful bubble combinations
- **Recommendation Explanations** - Visual badges show why each lotus is good

### User Experience
- **Export/Import Runs** - Share builds via JSON clipboard
- **Undo/Redo** - Tracks last 20 actions for easy mistake recovery
- **Custom Weights** - Adjust bubble type priorities with sliders
- **Lotus Comparison** - Search and compare specific in-game choices
- **Nightmare Risk Visualization** - Color-coded risk levels with value-at-risk

## Tech Stack

- **React 19** + **TypeScript** - Type-safe component architecture
- **Vite** - Fast build tool with HMR
- **localStorage** - Automatic state persistence
- **Programmatic Data Generation** - DRY approach to lotus database

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

Visit `http://localhost:5173` to use the app locally.

## How It Works

The app uses simulation-based weighted scoring with:

1. **Goal Weighting** - Optional 3x boost for selected bubble type
2. **Effect Simulation** - All lotus effects simulated on current state
3. **Fundamental Application** - Persistent effects automatically included
4. **Value Calculation** - Weighted scoring with quality multipliers (White=1 → Rainbow=32)
5. **Synergy Detection** - Bonus points for powerful combinations
6. **Lookahead Planning** - Optional 2-3 move planning with future discount (0.7)

## Game Mechanics

- **7 Bubble Types**: Gear, Blacksail, Cube, Commodity, Netherrealm, Fluorescent, Whim
- **6 Quality Tiers**: White → Blue → Purple → Orange → Red → Rainbow
- **Vision Capacity**: Default 10 slots (can overflow)
- **Fundamental Effects**: First lotus choice with persistent bonuses
- **Nightmare Risk**: Lose bubbles on death, but rewards become real

## Credits

- Bubble icons from [tlidb.com](https://tlidb.com)
- Game data from Torchlight Infinite
- Built for the Torchlight Infinite community

## License

MIT
