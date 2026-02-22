# Weekly Workout Scheduler Specification

## 1. Overview
The Weekly Workout Scheduler allows users to create a recurring weekly training plan. By setting a goal and selecting workout days, the system automatically generates a schedule. On scheduled days, the app prompts the user with the day's workout, reducing decision fatigue and promoting consistency.

## 2. Goals
- **Reduce Decision Fatigue**: Eliminate the daily question of "What should I do today?"
- **Promote Consistency**: Encourage habit formation by having a pre-defined schedule.
- **Personalization**: Adapt the intensity based on user goals (Maintain, Improve, Challenge).

## 3. Functional Requirements

### 3.1 Plan Creation Wizard (`#scheduler-modal`)
- Users can access the scheduler via a new button in the UI (e.g., near the "Smart Plan" or "Preset" area).
- **Step 1: Goal Selection**
  - **Maintain**: Standard intensity (e.g., 3 sets x 10 reps). Good for keeping current fitness.
  - **Improve**: Slightly higher intensity (e.g., 3 sets x 15 reps). Aimed at steady growth.
  - **Challenge**: High intensity (e.g., 4 sets x 15 reps). For pushing limits.
- **Step 2: Day Selection**
  - Users select which days of the week they want to train (Mon-Sun).
  - At least one day must be selected.
- **Step 3: Confirmation**
  - The system generates a preview of the schedule.
  - Upon saving, the schedule is persisted to `localStorage`.

### 3.2 Daily Schedule Display (`#daily-schedule-card`)
- On app launch, the system checks if today (based on local device time) is a scheduled training day.
- If a session is scheduled and not yet completed (optional complexity, for MVP just show schedule):
  - A card is displayed on the main screen (e.g., above the phase display or as a prominent alert).
  - The card shows: "Today's Mission: [Goal Name]" and the details (Sets x Reps).
  - **Action Button**: "Start Workout" (or "Load Settings").
    - Clicking this applies the scheduled settings to the workout inputs (`#set-count`, `#rep-count`, etc.).
    - Optionally auto-scrolls to the start button or highlights it.

### 3.3 Data Persistence
- **Storage Key**: `squat-tracker-weekly-schedule`
- **Data Format**:
  ```json
  {
    "updatedAt": "2023-10-27T10:00:00.000Z",
    "planType": "improve",
    "selectedDays": [1, 3, 5], // 0=Sun, 1=Mon, ...
    "schedule": {
      "1": { "setCount": 3, "repCount": 15, "downDuration": 2, "holdDuration": 1, "upDuration": 1, "restDuration": 30 },
      "3": { "setCount": 3, "repCount": 15, "downDuration": 2, "holdDuration": 1, "upDuration": 1, "restDuration": 30 },
      "5": { "setCount": 3, "repCount": 15, "downDuration": 2, "holdDuration": 1, "upDuration": 1, "restDuration": 30 }
    }
  }
  ```

## 4. UI/UX Design

### 4.1 Entry Point
- Add a calendar icon button (`#open-scheduler`) in the header or tools section.

### 4.2 Modal
- Title: "週間スケジュール設定"
- Content:
  - Radio buttons for Plan Type.
  - Checkboxes for Days of Week (Sun-Sat).
  - "保存して作成" (Save & Create) button.

### 4.3 Today's Card
- Style: distinct from regular UI, perhaps using the accent color.
- Content:
  - Header: "📅 本日の予定"
  - Body: "維持コース: 3セット × 10回"
  - Button: "設定を反映して開始"

## 5. Logic & Constraints
- **Conflict with Presets**: The scheduler overwrites current inputs when "Load" is clicked. It acts like a dynamic preset.
- **Smart Planner Integration**: The logic for "Maintain", "Improve", "Challenge" can reuse constants or logic similar to `SmartPlanner`, but fixed for the week.
- **Timezone**: Uses the device's local time to determine "Today".

## 6. Edge Cases
- **No days selected**: Disable save button.
- **Corrupted Data**: Fallback to no schedule if JSON parse fails.
- **Mid-week creation**: If created on Wednesday for Mon/Wed/Fri, it should immediately recognize Wednesday as a scheduled day.
