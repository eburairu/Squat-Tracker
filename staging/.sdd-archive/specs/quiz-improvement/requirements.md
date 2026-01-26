# Quiz Improvement Requirements

## Overview
Enhance the Quiz feature by separating its UI into a dedicated card, improving feedback visibility, and adjusting game mechanics for the cooperative mode bonus.

## Goals
1.  **UI Separation**: Move the quiz interface out of the "Session Guide" (Workout Card) into a dedicated "Quiz Card" placed above the Boss Battle card.
2.  **Persistent Feedback**: Display the session-wide correct answer count (Correct / Total) near the problem text.
3.  **Mechanic Adjustment**: In Cooperative Mode, the attack power bonus should accumulate throughout the session instead of resetting after each attack.
4.  **UI Cleanup**: Ensure the answer display from the previous question is cleared immediately when the next question phase (DOWN) begins.

## Detailed Requirements

### 1. Quiz Card UI
-   **Location**: Insert a new card container (`.card.quiz-card`) in `index.html`.
-   **Position**: Between the "Mission Card" and the "Boss Card".
-   **Content**:
    -   Existing quiz elements (`#quiz-problem`, `#quiz-options-container`, `#quiz-answer`).
    -   New stats element (`#quiz-stats`).
-   **Styling**: Must match the existing card design language (shadows, rounded corners, padding).

### 2. Quiz Statistics
-   **Metric**: Track "Number of Correct Answers" and "Total Questions Presented" for the current workout session.
-   **Reset Condition**: Reset to 0/0 when the workout starts or is reset.
-   **Display**: Update the display (e.g., "正解数: 3/5") whenever a question is answered or a new question is presented.

### 3. Cooperative Bonus Mechanics
-   **Current Behavior**: Bonus resets to 0 after every `performAttack()`.
-   **New Behavior**: Bonus persists and accumulates after attacks.
-   **Reset Condition**: Bonus resets only when the workout ends (`finishWorkout`) or is manually reset (`resetWorkout`).
-   **Feedback**:
    -   Toast notification on correct answer should say "Bonus!" or similar simple text.
    -   Do NOT display the numeric total in the toast if it's redundant/cluttered (user requested simplicity).

### 4. Answer Display Logic
-   **Behavior**: When the phase transitions to `DOWN` (Start of new rep):
    -   Clear `#quiz-answer` text (set to `--` or empty).
    -   Clear/Reset option button states (colors, disabled status).
-   **Timing**: Must happen immediately at the start of the phase.

## Non-Functional Requirements
-   Existing tests related to Quiz functionality must pass (selectors may need updating).
-   Voice coach behavior for quiz correctness remains unchanged (or silenced as requested? User said "No need to read out current bonus count via voice", implied voice for correctness is fine, or just silence bonus part). *Clarification: "音声で読み上げる必要はない" referred to the bonus count.*
