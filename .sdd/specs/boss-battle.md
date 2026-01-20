# Requirement Specification: Boss Battle Mode

## 1. Overview
Introduce a "Boss Battle" gamification layer where users defeat monsters by performing squats.
The goal is to increase user retention and workout intensity by providing immediate, fun feedback.

## 2. User Stories
- **As a user**, I want to see a monster that I am fighting against during my workout.
- **As a user**, I want my squats to deal damage to the monster instantly.
- **As a user**, I want to see the monster's health bar decrease as I exercise.
- **As a user**, I want a sense of accomplishment (visual/audio effects) when I defeat a monster.
- **As a user**, I want my battle progress (monster HP) to be saved so I can continue fighting tomorrow.
- **As a user**, I want to track how many monsters I have defeated.

## 3. Functional Requirements

### 3.1 Monster System
- **Generation**: Monsters are generated with random attributes or from a predefined list.
- **Attributes**:
  - `name`: String (e.g., "Slime", "Dragon")
  - `emoji`: String (e.g., 💧, 🐉)
  - `maxHp`: Integer (Range: 10 - 100, scaling with difficulty or random)
  - `currentHp`: Integer
- **Persistence**: The current monster and total kill count must be saved in `localStorage`.

### 3.2 Battle Logic
- **Damage**: 1 Rep (completed squat) = 1 Damage point.
- **Defeat**: When `currentHp` <= 0:
  - Trigger defeat animation.
  - Increment "Total Kills" counter.
  - Spawn a new monster immediately (or after a short delay).
  - Play a specific sound (optional, reuse existing celebration or beep).

### 3.3 UI/UX
- **Placement**: Add a new "Boss Battle" card in the UI, or integrate into the Session/Status area.
  - Ideally, a toggleable card or a prominent section above the controls.
- **Components**:
  - **Avatar**: Large Emoji display.
  - **Health Bar**: Visual progress bar indicating HP.
  - **Info**: Monster Name and HP text (e.g., "30/50").
  - **Kill Count**: Small display showing "Defeated: X".
- **Animations**:
  - **Hit**: The avatar shakes or flashes when damage is taken.
  - **Death**: The avatar fades out, shrinks, or spins away.
  - **Spawn**: The new avatar bounces in.

### 3.4 Integration
- Must work with both **Timer Mode** (Manual counting logic in `app.js`) and **Sensor Mode** (Device orientation logic).
- Must interact with `VoiceCoach` (optional future expansion: Voice comments on battle status).

## 4. Technical Specifications

### 4.1 Data Structure (`localStorage`: `squat-tracker-boss-v1`)
```json
{
  "currentMonster": {
    "name": "Goblin",
    "emoji": "👺",
    "maxHp": 30,
    "currentHp": 15
  },
  "totalKills": 5
}
```

### 4.2 Class Design (`BossBattle` class)
- `init()`: Load state, render UI.
- `damage(amount)`: Update HP, trigger UI update, check death.
- `spawn()`: Create new monster.
- `render()`: Update DOM elements.

## 5. Non-Functional Requirements
- **Performance**: Animations must be CSS-based to avoid main thread blocking.
- **Accessibility**: Use `aria-label` and `aria-live` regions for screen readers to announce monster status and damage.
- **Assets**: No external images; use standard Unicode Emojis.

## 6. Acceptance Criteria
- [ ] A monster appears on the screen with HP.
- [ ] Performing a squat decreases HP by 1.
- [ ] Visual feedback (shake) occurs on damage.
- [ ] Defeating a monster increments the kill counter and spawns a new one.
- [ ] Reloading the page restores the monster's HP and type.
