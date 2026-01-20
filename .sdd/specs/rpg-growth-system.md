# RPG Growth System Specification

## Overview
This feature introduces a Leveling System and Critical Hit mechanics to replace the static "Rank" system, aiming to gamify the workout experience and provide continuous progression feedback.

## Requirements

### 1. Player Level System
- **Concept**: Convert total lifetime squats into Experience Points (XP).
- **Formula**: `Level = floor(1 + sqrt(TotalReps) * 0.5)`
  - Examples:
    - 0 reps -> Lv 1
    - 4 reps -> Lv 2
    - 16 reps -> Lv 3
    - 100 reps -> Lv 6
    - 1000 reps -> Lv 16
    - 10000 reps -> Lv 51
- **UI**: Replace the "Rank" (Beginner-Diamond) display with "Lv. X".

### 2. Attack Power (AP)
- **Concept**: Higher levels deal more damage to the boss.
- **Formula**: `AP = 1 + floor((Level - 1) * 0.5)`
  - Examples:
    - Lv 1 -> Damage 1
    - Lv 3 -> Damage 2
    - Lv 5 -> Damage 3
    - Lv 11 -> Damage 6
- **UI**: Display "Attack Power: X" alongside the Level.

### 3. Critical Hit System
- **Concept**: Random chance to deal double damage with enhanced visual feedback.
- **Probability**: 10% chance per rep.
- **Multiplier**: 2.0x Damage.
- **Visuals**:
  - "Critical!" text animation.
  - More intense screen shake or avatar effect.

## Data Migration
- No database migration needed. Level is derived dynamically from `historyEntries` (total reps) at runtime.
- Existing "Rank" logic will be removed.

## Failure Behavior
- If history is empty, default to Level 1, AP 1.
- If calculation fails (NaN), fallback to Level 1, AP 1.
