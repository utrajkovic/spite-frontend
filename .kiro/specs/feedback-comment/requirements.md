# Requirements Document

## Introduction

Add an optional free-text comment field to the workout feedback flow. After completing a workout, the user can write a general note about the session in `WorkoutFeedbackModal`. The comment is stored alongside the existing feedback data and displayed to the trainer in `FeedbackViewModal`.

## Glossary

- **WorkoutFeedbackModal**: The frontend modal shown to the user after completing a workout, where per-exercise feedback is entered.
- **FeedbackViewModal**: The frontend modal used by trainers to review a client's submitted workout feedback.
- **WorkoutFeedback**: The MongoDB document (and corresponding TypeScript interface) that stores all feedback for a single completed workout session.
- **Comment**: An optional, free-text string field on `WorkoutFeedback` representing the user's general note about the whole workout.
- **Feedback API**: The backend REST endpoint at `POST /api/feedback` that persists `WorkoutFeedback` documents.

## Requirements

### Requirement 1: Comment Field on WorkoutFeedback Model

**User Story:** As a backend developer, I want the `WorkoutFeedback` model to include an optional comment field, so that user notes can be persisted alongside exercise feedback.

#### Acceptance Criteria

1. THE `WorkoutFeedback` document SHALL include a `comment` field of type `String`.
2. THE `comment` field SHALL be nullable, allowing `WorkoutFeedback` documents to be saved without a comment.
3. WHEN a `POST /api/feedback` request body includes a `comment` value, THE Feedback API SHALL persist that value in the `WorkoutFeedback` document.
4. WHEN a `POST /api/feedback` request body omits the `comment` field, THE Feedback API SHALL store `null` for the `comment` field without returning an error.

---

### Requirement 2: Comment Input in WorkoutFeedbackModal

**User Story:** As a user, I want to write an optional comment about my workout session, so that I can share general notes with my trainer.

#### Acceptance Criteria

1. THE `WorkoutFeedbackModal` SHALL display a textarea input below the per-exercise feedback rows.
2. THE textarea SHALL have a visible label or placeholder indicating it is for a general workout comment.
3. THE `comment` field in the submitted feedback payload SHALL be bound to the textarea value.
4. WHEN the user leaves the textarea empty and submits, THE `WorkoutFeedbackModal` SHALL dismiss and send the feedback with `comment` set to `null` or an empty string.
5. THE `WorkoutFeedback` TypeScript interface SHALL include an optional `comment` field of type `string | null`.

---

### Requirement 3: Comment Display in FeedbackViewModal

**User Story:** As a trainer, I want to see the client's comment when reviewing workout feedback, so that I can understand their general experience of the session.

#### Acceptance Criteria

1. WHEN the `WorkoutFeedback` object passed to `FeedbackViewModal` contains a non-empty `comment`, THE `FeedbackViewModal` SHALL display the comment text below the exercise rows.
2. WHEN the `WorkoutFeedback` object has a `null` or empty `comment`, THE `FeedbackViewModal` SHALL not render the comment section.
