# Tasks

## Task List

- [ ] 1. Add `isPaused` state and pause/resume methods to `WorkoutPage`
  - [ ] 1.1 Add `isPaused = false` property to `WorkoutPage`
  - [ ] 1.2 Implement `pauseWorkout()`: set `isPaused = true`; if `isResting`, call `clearInterval(this.timer)`
  - [ ] 1.3 Implement `resumeWorkout()`: set `isPaused = false`; if `isResting` and `restLeft > 0`, restart the interval from `restLeft` using `pendingRestCallback`; if `restLeft <= 0`, call `pendingRestCallback` directly
  - [ ] 1.4 Add guards: `pauseWorkout()` returns early if already paused; `resumeWorkout()` returns early if not paused

- [ ] 2. Update `workout.page.html` template
  - [ ] 2.1 Add Pause button inside `.card-actions`, shown when `started && !isPaused`, wired to `pauseWorkout()`
  - [ ] 2.2 Add Resume button inside `.card-actions`, shown when `started && isPaused`, wired to `resumeWorkout()`
  - [ ] 2.3 Update Done button `[disabled]` binding from `isResting` to `isResting || isPaused`
  - [ ] 2.4 Update Skip Rest button `[disabled]` binding to add `isPaused`

- [ ] 3. Add styles to `workout.page.scss`
  - [ ] 3.1 Add `.pause-btn` style (outline, amber/warning color, consistent with neon aesthetic)
  - [ ] 3.2 Add `.resume-btn` style (filled, primary color, matching `.start-btn`)

- [ ] 4. Write unit tests for pause/resume logic
  - [ ] 4.1 Test `pauseWorkout()` sets `isPaused = true` when `isResting = false`
  - [ ] 4.2 Test `pauseWorkout()` sets `isPaused = true` and clears the interval when `isResting = true`
  - [ ] 4.3 Test `pauseWorkout()` does not mutate `currentIndex`, `currentSet`, `showingSuperset`, or `restLeft`
  - [ ] 4.4 Test `resumeWorkout()` sets `isPaused = false` when `isResting = false`
  - [ ] 4.5 Test `resumeWorkout()` restarts interval from preserved `restLeft` (not `totalRest`) when `isResting = true`
  - [ ] 4.6 Test `resumeWorkout()` fires `pendingRestCallback` when the restarted timer reaches zero
  - [ ] 4.7 Test guard: calling `pauseWorkout()` twice does not corrupt state
  - [ ] 4.8 Test guard: `resumeWorkout()` with `restLeft = 0` calls callback directly without starting interval

- [ ] 5. Write property-based tests using fast-check
  - [ ] 5.1 Property 1 — Button visibility toggles with isPaused: for any `isPaused` boolean, assert Pause visible ↔ `!isPaused` and Resume visible ↔ `isPaused`
  - [ ] 5.2 Property 2 — pauseWorkout() transitions to Pause_State: for any started workout state, after `pauseWorkout()`, `isPaused === true`
  - [ ] 5.3 Property 3 — Session state frozen while paused: for any session state, after `pauseWorkout()`, all of `currentIndex`, `currentSet`, `showingSuperset`, `isResting`, `restLeft` are unchanged
  - [ ] 5.4 Property 4 — Controls disabled while paused: for any paused state with random `isResting`, Done is disabled; Skip Rest is disabled when `isResting = true`
  - [ ] 5.5 Property 5 — Timer stops ticking when paused: for any `restLeft > 0`, after `pauseWorkout()`, advancing fake timers does not decrement `restLeft`
  - [ ] 5.6 Property 6 — Resume restarts from preserved restLeft: for any paused rest state with `restLeft > 0`, after `resumeWorkout()`, countdown starts from preserved `restLeft` and callback fires at zero
