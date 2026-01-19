# Design Specification: Squat-Tracker

## 1. Architecture Strategy
The application uses a **Singleton-based Modular Architecture** within a single `app.js` file to maintain simplicity while ensuring separation of concerns.

### Core Modules (Singletons)
- **`WorkoutTimer`**: Manages the workout state machine (Countdown -> Down -> Hold -> Up -> Rest).
- **`VoiceCoach`**: Handles text-to-speech synthesis.
- **`SensorManager`**: Manages DeviceOrientation events for squat detection.
- **`BossBattle`**: Manages RPG logic (Monster state, HP, Damage).
- **`AchievementSystem`**: Monitors events and awards badges based on history/stats.
- **`DataManager`**: Handles import/export of `localStorage` data.
- **`PresetManager`**: Manages CRUD operations for workout settings.
- **`HistoryManager` (Implicit)**: Handles loading/saving of workout history and stats calculation.
- **`Heatmap`**: Renders the GitHub-style activity graph.

## 2. Data Persistence Model
All data is persisted in `localStorage` with the prefix `squat-tracker-`.

| Key | Description | Structure |
| :--- | :--- | :--- |
| `squat-tracker-history` | List of completed sessions | Array of `{ date, count, set, reps, ... }` |
| `squat-tracker-achievements` | Unlocked badges | Object `{ unlocked: [badgeId, ...], ... }` |
| `squat-tracker-boss-v1` | Boss battle state | Object `{ currentMonster, totalKills, ... }` |
| `squat-tracker-presets` | User defined settings | Array of `{ id, name, settings: {...} }` |
| `squat-tracker-settings` | Last used settings | Object `{ sets, reps, durations... }` |

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
- **Logic**: 1 Rep = 1 Damage (Normal) / Critical Logic based on stats.
- **Regeneration**: Boss recovers HP based on time elapsed since last workout.
- **Persistence**: State is saved on every damage event to prevent loss.

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
