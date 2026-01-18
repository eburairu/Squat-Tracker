# Design Specification: Boss Battle Mode

## 1. Architecture
The Boss Battle feature will be encapsulated in a `BossBattle` class within `app.js` (or a separate module if we were using modules, but adhering to the single-file `app.js` structure for now).

### Class Structure: `BossBattle`
- **Properties**:
  - `state`: Object `{ currentMonster: { name, emoji, maxHp, currentHp }, totalKills: 0 }`
  - `elements`: Object storing references to DOM nodes (`container`, `avatar`, `hpFill`, `hpText`, `killCount`).
  - `monsters`: Array of monster definitions.

- **Methods**:
  - `init()`: Initialize DOM elements, load state from `localStorage`, render initial state.
  - `loadState()`: Helper to parse local storage.
  - `saveState()`: Helper to persist state.
  - `spawnMonster()`: Select a new monster (randomly) and reset HP.
  - `takeDamage(amount)`: Reduce HP, trigger animations, check for defeat.
  - `handleDefeat()`: Process monster death, increment kills, delay spawn.
  - `render()`: Update the UI based on current state.
  - `triggerDamageAnimation()`: Apply CSS class temporarily.

## 2. Data Model
### Monster Definition
```javascript
const MONSTERS = [
  { name: 'スライム', emoji: '💧', hpRange: [10, 20] },
  { name: 'コウモリ', emoji: '🦇', hpRange: [15, 25] },
  { name: 'ゴブリン', emoji: '👺', hpRange: [30, 50] },
  { name: 'ドラゴン', emoji: '🐉', hpRange: [80, 120] },
  // ...
];
```

## 3. UI Design
### HTML
Added to `.primary-grid`:
```html
<div class="card boss-card reveal delay-2">
  <div class="card-head">
    <div>
      <p class="card-eyebrow">Battle</p>
      <h2>ボスバトル</h2>
    </div>
    <div class="boss-kills">
      <span class="label">討伐数</span>
      <span id="boss-kill-count">0</span>
    </div>
  </div>
  <div class="boss-display">
    <div id="boss-avatar" class="boss-avatar">👾</div>
    <div class="boss-info">
      <div class="boss-name-row">
        <span id="boss-name">Unknown</span>
        <span id="boss-hp-text">0 / 0</span>
      </div>
      <div class="progress boss-progress">
        <div id="boss-hp-bar" class="progress-bar" style="width: 100%"></div>
      </div>
    </div>
  </div>
</div>
```

### CSS
- **.boss-avatar**: Large font size (e.g., 4rem), centered.
- **.boss-shake**: Keyframe animation for translating X/Y randomly for 0.5s.
- **.boss-defeat**: Keyframe animation for scaling down and fading out.
- **.boss-spawn**: Keyframe animation for popping in (scale 0->1).

## 4. Integration
- **Initialization**: Call `BossBattle.init()` in `window.onload` or at the end of `app.js`.
- **Trigger**:
  - Inside `nextRepOrSet()` (Timer logic): `BossBattle.damage(1)`
  - Inside `handleOrientation()` (Sensor logic): `BossBattle.damage(1)`

## 5. Test Plan
- **Unit Tests**:
  - Verify state loading/saving.
  - Verify HP reduction.
  - Verify kill count increment.
  - Verify new monster generation.
- **E2E Tests (Playwright)**:
  - Check if Boss Card is visible.
  - Check if HP bar decreases after a squat.
  - Check persistence after reload.
