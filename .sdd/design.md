# Design Specification: Squat-Tracker

## 1. Architecture Strategy
The application uses a **Singleton-based Modular Architecture** within a single `app.js` file to maintain simplicity while ensuring separation of concerns.

### Core Modules (Singletons)
- **`WorkoutTimer`**: Manages the workout state machine (Countdown -> Down -> Hold -> Up -> Rest).
- **`VoiceCoach`**: Handles text-to-speech synthesis.
- **`SensorManager`**: Manages DeviceOrientation events for squat detection.
- **`BossBattle`**: Manages RPG logic (Monster state, HP, Damage).
- **`RpgSystem`**: Handles core RPG calculations (Level, Attack Power, Damage).
- **`InventoryManager`**: Manages weapon collection, upgrades, and equipment.
- **`DailyMissionSystem`**: Manages daily tasks and rewards.
- **`AchievementSystem`**: Monitors events and awards badges based on history/stats.
- **`DataManager`**: Handles import/export of `localStorage` data.
- **`PresetManager`**: Manages CRUD operations for workout settings.
- **`Heatmap`**: Renders the GitHub-style activity graph.

## 2. Data Persistence Model
All data is persisted in `localStorage` with the prefix `squat-tracker-`.

| Key | Description | Structure |
| :--- | :--- | :--- |
| `squat-tracker-history-v1` | List of completed sessions | Array of `{ date, totalReps, durations... }` |
| `squat-tracker-achievements` | Unlocked badges | Object `{ unlocked: [badgeId, ...], ... }` |
| `squat-tracker-boss-v1` | Boss battle state | Object `{ currentMonster, totalKills, ... }` |
| `squat-tracker-inventory` | Weapon inventory | Object `{ equippedId, items: { id: { level } } }` |
| `squat-tracker-missions` | Daily missions state | Object `{ lastUpdated, missions: [...] }` |
| `squat-tracker-presets` | User defined settings | Array of `{ name, settings: {...} }` |
| `squat-tracker-workout-settings` | Last used settings | Object `{ setCount, repCount, ... }` |
| `squat-tracker-theme` | UI theme preference | String `'dark'` or `'light'` |
| `squat-tracker-voice` | Voice coach setting | String `'true'` or `'false'` |

## 3. UI Design Principles
- **Card-based Layout**: Content is organized in cards (`.card`) within a responsive grid.
- **Progressive Disclosure**: Advanced features (Sensor, Data) are in secondary grids or tabs.
- **Visual Feedback**:
  - CSS Animations for Boss damage/spawn.
  - Confetti for achievements/completion.
  - Progress bars for Timer and HP.
- **Dark/Light Theme**: CSS variables (`--bg-color`, etc.) controlled by a toggle.

## 4. Key Feature Designs

### Boss Battle
- **Logic**: Damage = (Base AP + Weapon Bonus) * (Critical ? 2 : 1).
- **Regeneration**: Boss recovers HP based on time elapsed since last workout (10% per 24h).
- **Drops**: 100% weapon drop chance on defeat. Drop logic weighs rarity (Common to Legendary).

### Weapon & Inventory
- **Weapons**: Generated from Base Types × Rarities. Each combination is a unique item ID.
- **Leveling**: Duplicate drops increase weapon level.
- **Stats**: Attack Power = Base + (Level - 1) * Growth Rate.

### Daily Missions
- **Cycle**: Refreshed daily at local midnight.
- **Types**: Login, Finish Workout, Total Reps, Total Sets.
- **Rewards**: Completing a mission grants a guaranteed weapon drop (New or Level Up).

### Calculation Quiz
- **Flow**: Problem displayed during DOWN/HOLD, Answer during UP.
- **Logic**: 4 operations (+, -, ×, ÷). Operands scaled (3-9 normally, chance for 2-digits).
- **Criticals**: Randomly flagged "Critical Quiz" guarantees a critical hit for that rep.

### Achievement System
- **Trigger**: Checked at `finishWorkout`, `BossBattle.damage` (for kills), and initialization.
- **Retroactive**: Checks history on load to award badges for past accomplishments.
- **Notification**: Toast notification (`.achievement-toast`) on unlock.

### Data Management
- **Format**: JSON containing all keys matching `squat-tracker-*`.
- **Validation**: Import validates JSON structure before overwriting `localStorage`.

## 5. Testing Strategy
- **E2E Testing (Playwright)**: Primary verification method.
  - Covers critical paths: Workout flow, Settings, Data persistence.
  - Mocks `localStorage` for testing state-dependent features (Badges, Boss).
  - Uses `clock` manipulation for timer tests.
