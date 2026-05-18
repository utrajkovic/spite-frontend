# Requirements Document

## Introduction

This feature adds pause/resume capability to the active workout session in the Spite fitness app. Currently, `workout.page.ts` runs a rest timer via `setInterval` with no way to pause mid-session. Users can only "Skip Rest" or complete a set. The new feature allows users to freeze the session at any point — during an exercise or during rest — and resume exactly where they left off.

This is a frontend-only change scoped to `workout.page.ts`, `workout.page.html`, and `workout.page.scss`.

## Glossary

- **Workout_Page**: The Angular component (`WorkoutPage`) that manages the active workout session.
- **Rest_Timer**: The countdown timer that runs between sets or exercises, implemented via `setInterval`.
- **Pause_State**: The application state in which the workout session is suspended and no timer is counting down.
- **Active_State**: The application state in which the workout session is running normally (either during exercise or during rest).
- **Session_State**: The combination of `currentIndex`, `currentSet`, `showingSuperset`, `isResting`, and `restLeft` that fully describes the user's position in the workout.

---

## Requirements

### Requirement 1: Pause Button Visibility

**User Story:** As a user, I want to see a Pause button during an active workout, so that I can suspend the session at any time.

#### Acceptance Criteria

1. WHILE the workout is in Active_State and `started` is true, THE Workout_Page SHALL display a Pause button.
2. WHILE the workout is in Pause_State, THE Workout_Page SHALL hide the Pause button.
3. WHILE the workout is in Pause_State, THE Workout_Page SHALL display a Resume button.
4. WHILE the workout is in Active_State, THE Workout_Page SHALL hide the Resume button.

---

### Requirement 2: Pause During Exercise

**User Story:** As a user, I want to pause the workout while I am between sets (not during rest), so that I can take an unplanned break without losing my progress.

#### Acceptance Criteria

1. WHEN the user taps the Pause button while `isResting` is false, THE Workout_Page SHALL set the workout to Pause_State.
2. WHILE the workout is in Pause_State, THE Workout_Page SHALL preserve the current `currentIndex`, `currentSet`, and `showingSuperset` values unchanged.
3. WHILE the workout is in Pause_State and `isResting` is false, THE Workout_Page SHALL keep the "Done" button disabled.

---

### Requirement 3: Pause During Rest

**User Story:** As a user, I want to pause the rest timer mid-countdown, so that the remaining rest time is preserved when I resume.

#### Acceptance Criteria

1. WHEN the user taps the Pause button while `isResting` is true, THE Workout_Page SHALL clear the `setInterval` timer immediately.
2. WHEN the user taps the Pause button while `isResting` is true, THE Workout_Page SHALL preserve the current `restLeft` value at the exact second it was paused.
3. WHILE the workout is in Pause_State and `isResting` is true, THE Workout_Page SHALL display the frozen `restLeft` value in the rest timer UI.
4. WHILE the workout is in Pause_State and `isResting` is true, THE Workout_Page SHALL keep the circle-timer progress indicator frozen at the paused position.

---

### Requirement 4: Resume

**User Story:** As a user, I want to resume the workout from exactly where I paused, so that no session state is lost.

#### Acceptance Criteria

1. WHEN the user taps the Resume button while `isResting` is false, THE Workout_Page SHALL return to Active_State with `currentIndex`, `currentSet`, and `showingSuperset` unchanged.
2. WHEN the user taps the Resume button while `isResting` is true, THE Workout_Page SHALL restart the `setInterval` timer counting down from the preserved `restLeft` value.
3. WHEN the user taps the Resume button while `isResting` is true, THE Workout_Page SHALL continue the countdown until `restLeft` reaches zero, then execute the original `pendingRestCallback`.
4. THE Workout_Page SHALL NOT reset `restLeft` to `totalRest` on resume.

---

### Requirement 5: Interaction Constraints While Paused

**User Story:** As a user, I want the workout controls to be inactive while paused, so that I cannot accidentally advance the session.

#### Acceptance Criteria

1. WHILE the workout is in Pause_State, THE Workout_Page SHALL disable the "Done" button.
2. WHILE the workout is in Pause_State and `isResting` is true, THE Workout_Page SHALL disable the "Skip Rest" button.
3. WHILE the workout is in Pause_State, THE Workout_Page SHALL keep all Session_State values unchanged until the user taps Resume.
