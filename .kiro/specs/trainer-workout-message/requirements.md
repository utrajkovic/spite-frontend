# Requirements Document

## Introduction

This feature allows trainers to leave a targeted note on a specific client workout feedback entry. Unlike the general chat, a trainer note is attached directly to a `WorkoutFeedback` document and is visible to the client when they review their own history. Trainers can add or update the note at any time from the client's feedback view in `tab-trainer-client`.

## Glossary

- **Trainer_Note**: An optional free-text string stored on a `WorkoutFeedback` document as the `trainerNote` field, written by the trainer and visible to the client.
- **WorkoutFeedback**: The MongoDB document (and corresponding TypeScript interface) that stores all feedback for a single completed workout session.
- **FeedbackViewModal**: The existing modal component used to display the full details of a `WorkoutFeedback` entry.
- **Trainer_Note_API**: The new backend endpoint `PUT /api/feedback/{id}/trainer-note` that persists a `trainerNote` value on an existing `WorkoutFeedback` document.
- **Trainer**: A logged-in user with the trainer role, viewing a client's feedback in `tab-trainer-client`.
- **Client**: A logged-in regular user who can view their own workout history in `tab3`.
- **History_Section**: The existing UI section in `tab3` that lists the client's past completed workout sessions.

---

## Requirements

### Requirement 1: `trainerNote` Field on WorkoutFeedback Model

**User Story:** As a backend developer, I want the `WorkoutFeedback` model to include an optional `trainerNote` field, so that trainer notes can be persisted alongside existing feedback data.

#### Acceptance Criteria

1. THE `WorkoutFeedback` document SHALL include a `trainerNote` field of type `String`.
2. THE `trainerNote` field SHALL be nullable, allowing existing `WorkoutFeedback` documents to remain valid without a note.
3. WHEN a `GET /api/feedback/user/{userId}` response is returned, THE Feedback_API SHALL include the `trainerNote` field in each `WorkoutFeedback` object (null if not set).

---

### Requirement 2: Trainer Note API Endpoint

**User Story:** As a backend developer, I want a dedicated endpoint to update the trainer note on a feedback entry, so that the frontend can persist note changes without replacing the entire document.

#### Acceptance Criteria

1. THE Trainer_Note_API SHALL expose a `PUT /api/feedback/{id}/trainer-note` endpoint that accepts a JSON body with a single `trainerNote` string field.
2. WHEN a valid `PUT /api/feedback/{id}/trainer-note` request is received, THE Trainer_Note_API SHALL update only the `trainerNote` field on the matching `WorkoutFeedback` document and return the updated document.
3. IF no `WorkoutFeedback` document exists for the given `id`, THEN THE Trainer_Note_API SHALL return a 404 response.
4. WHEN the request body contains an empty string for `trainerNote`, THE Trainer_Note_API SHALL store `null` on the document.

---

### Requirement 3: Trainer Can Add or Edit a Note in FeedbackViewModal

**User Story:** As a Trainer, I want to add or edit a note on a client's workout feedback entry directly from the feedback view, so that I can give targeted feedback on a specific session.

#### Acceptance Criteria

1. WHEN the `FeedbackViewModal` is opened by a Trainer (indicated by an `isTrainer` input flag), THE `FeedbackViewModal` SHALL display an editable text area for the `trainerNote` field below the exercise rows.
2. WHEN the `WorkoutFeedback` object passed to `FeedbackViewModal` contains a non-null `trainerNote`, THE text area SHALL be pre-populated with that value.
3. WHEN the `WorkoutFeedback` object has a null `trainerNote`, THE text area SHALL be empty and display a placeholder such as "Add a note for this session…".
4. WHEN the Trainer submits the note by clicking a "Save Note" button, THE `FeedbackViewModal` SHALL call `PUT /api/feedback/{id}/trainer-note` with the current text area value.
5. WHEN the Trainer_Note_API returns a successful response, THE `FeedbackViewModal` SHALL update the displayed note and show a brief confirmation to the Trainer.
6. IF the Trainer_Note_API call fails, THEN THE `FeedbackViewModal` SHALL display an error message and retain the unsaved text in the text area.
7. WHEN the Trainer clears the text area and saves, THE `FeedbackViewModal` SHALL send an empty string, resulting in the `trainerNote` being set to `null` on the document.

---

### Requirement 4: Trainer Note Display in tab-trainer-client

**User Story:** As a Trainer, I want to see and manage trainer notes when browsing a client's feedback logs, so that I can review and update notes without leaving the client page.

#### Acceptance Criteria

1. WHEN the Trainer opens a feedback entry from the "Info" segment in `tab-trainer-client`, THE `FeedbackViewModal` SHALL be opened with `isTrainer` set to `true`.
2. WHEN the Trainer saves a note in `FeedbackViewModal` and dismisses the modal, THE `feedbackList` in `tab-trainer-client` SHALL reflect the updated `trainerNote` value for that entry without requiring a full page reload.

---

### Requirement 5: Client Can See Trainer Note in Workout History

**User Story:** As a Client, I want to see my trainer's note when I review a past workout session, so that I can read targeted feedback on my performance.

#### Acceptance Criteria

1. WHEN the Client opens a `Feedback_Entry` from the `History_Section` in `tab3`, THE `FeedbackViewModal` SHALL be opened with `isTrainer` set to `false`.
2. WHEN the `WorkoutFeedback` object contains a non-null `trainerNote`, THE `FeedbackViewModal` SHALL display the note in a read-only section labelled "Trainer Note" below the exercise rows.
3. WHEN the `WorkoutFeedback` object has a null or empty `trainerNote`, THE `FeedbackViewModal` SHALL not render the trainer note section.
4. THE `FeedbackViewModal` SHALL not display the note edit controls when `isTrainer` is `false`.
