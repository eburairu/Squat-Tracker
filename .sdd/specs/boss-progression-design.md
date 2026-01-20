# Boss Progression & Regeneration - Design Spec

## Data Structure
The `BossBattle.state` object will be updated to track progression and time-based events.

```javascript
state: {
  monsterIndex: 0,       // integer: Index in MONSTERS array (0-9)
  loopCount: 1,          // integer: Current loop number, starts at 1
  lastInteraction: null, // number: Timestamp (Date.now()) of last update
  totalKills: 0,         // integer: Total monsters defeated
  currentMonster: {      // object: Current active monster details
    name: string,
    emoji: string,
    maxHp: number,
    currentHp: number
  }
}
```

## Logic

### Initialization & Migration
- On `loadState()`, if `monsterIndex` or `loopCount` is missing (migration from old version):
  - Set `monsterIndex = 0`.
  - Set `loopCount = 1`.
  - Set `lastInteraction = Date.now()`.
  - If `currentMonster` exists from old data, keep it until defeated, but sync `monsterIndex` to 0 for next spawn.
- Immediately call `regenerateHp()` to apply offline recovery.

### HP Regeneration (`regenerateHp`)
- Triggered on `init()` and periodically (or on visibility change/interaction).
- Calculate `elapsed = Date.now() - lastInteraction`.
- Calculate `healAmount = maxHp * 0.10 * (elapsed / (24 * 60 * 60 * 1000))`.
- `currentMonster.currentHp = Math.min(currentMonster.maxHp, currentMonster.currentHp + healAmount)`.
- Update `lastInteraction = Date.now()`.
- Save state and render.

### Spawning (`spawnMonster`)
- Logic update:
  - DO NOT pick random monster.
  - Use `MONSTERS[state.monsterIndex]`.
  - Calculate `scalingFactor = 1 + (state.loopCount - 1) * 0.5`.
  - `maxHp = getRandomInt(baseHpMin, baseHpMax) * scalingFactor`.
  - `currentHp = maxHp`.
- Reset `lastInteraction = Date.now()`.

### Defeat & Progression
- When `damage()` reduces `currentHp` to <= 0:
  - Increment `totalKills`.
  - Increment `monsterIndex`.
  - If `monsterIndex >= MONSTERS.length`:
    - `monsterIndex = 0`
    - `loopCount++`
  - Call `spawnMonster()`.

## Integration Points in `app.js`

1. **`BossBattle` Object**:
   - Update `state` schema.
   - Implement `regenerateHp()`.
   - Update `spawnMonster()` to use index and loop.
   - Update `damage()` to update `lastInteraction`.

2. **Workout Logic**:
   - In `nextRepOrSet()`: Call `BossBattle.damage(1)` when a rep completes.
   - In `handleOrientation()` (Sensor Mode): Call `BossBattle.damage(1)` when `lastSensorCounted` becomes true.

3. **Event Listeners**:
   - Add `document.addEventListener('visibilitychange', ...)` to trigger `BossBattle.regenerateHp()` when app comes to foreground.
