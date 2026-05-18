# Tasks

## Task List

- [ ] 1. Add `comment` field to backend `WorkoutFeedback` model
  - [ ] 1.1 Add `private String comment;` field with getter and setter to `WorkoutFeedback.java`

- [ ] 2. Add `comment` field to frontend `WorkoutFeedback` TypeScript interface
  - [ ] 2.1 Add `comment?: string | null;` to the `WorkoutFeedback` interface in `models.ts`

- [ ] 3. Add comment textarea to `WorkoutFeedbackModal`
  - [ ] 3.1 Add `comment: string | null = null;` property to `WorkoutFeedbackModal` component class
  - [ ] 3.2 Include `comment` in the object passed to `modalCtrl.dismiss()` inside `finish()`
  - [ ] 3.3 Add a `<textarea>` with `[(ngModel)]="comment"` and a placeholder below the exercise rows in `workout-feedback.modal.html`

- [ ] 4. Display comment in `FeedbackViewModal`
  - [ ] 4.1 Add a conditional `*ngIf="feedback.comment"` comment block below the exercise rows in `feedback-view.modal.html`

- [ ] 5. Write tests
  - [ ] 5.1 Write unit tests for `WorkoutFeedbackModal`: verify `finish()` includes `comment` in dismissed payload and that empty textarea yields null/empty comment
  - [ ] 5.2 Write unit tests for `FeedbackViewModal`: verify comment block renders for non-empty comment and is absent for null/empty comment
  - [ ] 5.3 Write property test for Property 1 (comment persistence round-trip) in Java using jqwik
  - [ ] 5.4 Write property test for Property 2 (comment textarea binding) in TypeScript using fast-check
  - [ ] 5.5 Write property test for Property 3 (conditional comment rendering) in TypeScript using fast-check
