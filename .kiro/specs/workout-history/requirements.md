# Requirements Document

## Introduction

This feature adds a Workout History and Progress Tracking section for regular users in the Spite app. Currently, workout feedback data is stored in MongoDB (`workout_feedback` collection) and is only visible to trainers via the trainer-client panel. Users have no way to review their own past sessions or track how their performance evolves over time.

The feature adds a "History" section to `tab3` where users can browse their completed workouts, view full feedback details for each session, and see per-exercise progression (max kg and reps over time) across multiple sessions.

## Glossary

- **History_Section**: The UI section in tab3 that lists the user's past completed workout sessions.
- **Feedback_Entry**: A single completed workout session record stored in `workout_feedback`, containing a timestamp, workout title, and a list of exercise feedback items.
- **Exercise_Progress**: An aggregated view of a single exercise across multiple Feedback_Entries, showing how max kg or reps changed over time.
- **FeedbackViewModal**: The existing modal component (`feedback-view.modal`) used to display the full details of a Feedback_Entry.
- **ProgressView**: A new UI component or modal that displays the Exercise_Progress chart/list for a single exercise.
- **History_API**: The existing backend endpoint `GET /api/feedback/user/{userId}` that returns all Feedback_Entries for a user.
- **Progress_API**: A new or derived backend endpoint that returns per-exercise progression data for a user.
- **User**: A logged-in regular user (non-trainer) of the Spite app.

---

## Requirements

### Requirement 1: Display Workout History List

**User Story:** As a User, I want to see a list of my past completed workouts in tab3, so that I can review what I have done in previous sessions.

#### Acceptance Criteria

1. THE History_Section SHALL be displayed in tab3 below the existing "Assigned by Trainer" section.
2. WHEN the User navigates to tab3, THE History_Section SHALL load and display all Feedback_Entries for the current User by calling the History_API with the User's id.
3. WHEN the History_API returns Feedback_Entries, THE History_Section SHALL display each entry as a list item showing the workout name (`workoutTitle`) and the formatted date derived from the `timestamp` field.
4. WHEN the History_API returns an empty list, THE History_Section SHALL display an "No history yet" placeholder message.
5. IF the History_API call fails, THEN THE History_Section SHALL display an error message and not crash the page.
6. THE History_Section SHALL display Feedback_Entries sorted by `timestamp` in descending order (most recent first).

---

### Requirement 2: View Full Feedback Details

**User Story:** As a User, I want to tap a history entry and see the full exercise details for that session, so that I can review exactly what I did.

#### Acceptance Criteria

1. WHEN the User taps a Feedback_Entry in the History_Section, THE History_Section SHALL open the FeedbackViewModal with that entry's data.
2. THE FeedbackViewModal SHALL display the workout title and formatted date at the top of the modal.
3. THE FeedbackViewModal SHALL display a row for each exercise in the Feedback_Entry showing: exercise name, planned sets × reps, completed sets × reps, max kg (if present), and intensity level.
4. WHEN the User dismisses the FeedbackViewModal, THE History_Section SHALL remain visible and unchanged.

---

### Requirement 3: Per-Exercise Progress Tracking

**User Story:** As a User, I want to see how my performance for a specific exercise has changed over time, so that I can track my progress.

#### Acceptance Criteria

1. THE History_Section SHALL include a "Progress" button or entry point that allows the User to browse per-exercise progression.
2. WHEN the User selects an exercise from the progress view, THE ProgressView SHALL display a chronological list of sessions in which that exercise appeared, showing the date, max kg, and done reps for each session.
3. THE ProgressView SHALL derive its data from the already-loaded Feedback_Entries on the frontend, grouping entries by `exerciseId` and sorting by `timestamp` ascending.
4. WHEN an exercise appears in only one Feedback_Entry, THE ProgressView SHALL still display that single data point.
5. WHEN `maxKg` is null for a session entry, THE ProgressView SHALL display "—" in place of the kg value.
6. THE ProgressView SHALL display the list of exercises that have at least one Feedback_Entry, so the User can select which exercise to inspect.

---

### Requirement 4: Data Loading and State Management

**User Story:** As a User, I want the history data to load reliably alongside the rest of tab3, so that I do not experience inconsistent or stale data.

#### Acceptance Criteria

1. WHEN tab3 loads data via `loadData()`, THE History_Section SHALL fetch Feedback_Entries in the same loading cycle using `forkJoin` alongside existing requests.
2. WHILE data is loading, THE History_Section SHALL show the existing page-level loading overlay so the User is aware that content is being fetched.
3. IF the User's session is not found in Preferences, THEN THE History_Section SHALL not attempt to call the History_API and SHALL remain empty.
4. WHEN the User returns to tab3 after completing a workout, THE History_Section SHALL reflect the latest Feedback_Entries by reloading on `ionViewWillEnter`.
