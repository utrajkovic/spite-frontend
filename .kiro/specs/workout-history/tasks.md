# Tasks

## Task List

- [ ] 1. Frontend: Extend tab3 data loading
  - [ ] 1.1 Add `feedbackEntries: WorkoutFeedback[]` and `historyError: boolean` fields to `tab3.page.ts`
  - [ ] 1.2 Add `WorkoutFeedback` to the imports from `models.ts` in `tab3.page.ts`
  - [ ] 1.3 Extend the `forkJoin` in `loadData()` to include `GET /api/feedback/user/{userId}`, populate `feedbackEntries` sorted descending by `timestamp`, and set `historyError = true` on failure without breaking other sections

- [ ] 2. Frontend: History section in tab3 template
  - [ ] 2.1 Add a History section to `tab3.page.html` below the "Assigned by Trainer" section, listing each entry with `workoutTitle` and formatted date
  - [ ] 2.2 Add "No history yet" empty-state item when `feedbackEntries` is empty
  - [ ] 2.3 Add error message item when `historyError` is true
  - [ ] 2.4 Add a "Progress" button in the History section header that calls `openProgressView()`

- [ ] 3. Frontend: Wire FeedbackViewModal to history entries
  - [ ] 3.1 Add `openFeedbackDetail(entry: WorkoutFeedback)` method to `tab3.page.ts` that opens `FeedbackViewModal` via `ModalController`, passing the entry and a formatted date string
  - [ ] 3.2 Update `FeedbackViewModal` to accept an optional `@Input() date: string` and display `feedback.workoutTitle` and `date` at the top of the modal template

- [ ] 4. Frontend: ProgressViewModal component
  - [ ] 4.1 Create `spite-frontend/src/app/modals/progress-view.modal.ts` as a standalone Angular component with `@Input() feedbackEntries: WorkoutFeedback[]`
  - [ ] 4.2 Implement `ngOnInit` to derive `exerciseList` (unique `{ exerciseId, exerciseName }` pairs from all entries)
  - [ ] 4.3 Implement `selectExercise(exerciseId: string)` to filter entries containing that exercise, map to `ProgressSession[]`, and sort ascending by `timestamp`; display "—" when `maxKg` is null
  - [ ] 4.4 Create `spite-frontend/src/app/modals/progress-view.modal.html` with an exercise picker list and a session detail list
  - [ ] 4.5 Add `openProgressView()` method to `tab3.page.ts` that opens `ProgressViewModal` via `ModalController`, passing `feedbackEntries`

- [ ] 5. Frontend: Property-based tests
  - [ ] 5.1 Write property test for P1: for any WorkoutFeedback array, every rendered history item contains workoutTitle and a non-empty date string (fast-check)
  - [ ] 5.2 Write property test for P2: for any WorkoutFeedback array with varying timestamps, displayed order is descending by timestamp
  - [ ] 5.3 Write property test for P3: for any WorkoutFeedback entry, tapping it passes that exact entry to FeedbackViewModal
  - [ ] 5.4 Write property test for P4: for any WorkoutFeedback with N exercises, the modal renders exactly N rows with all required fields
  - [ ] 5.5 Write property test for P5: for any WorkoutFeedback array, grouping by exerciseId and sorting ascending produces correct per-exercise session lists
  - [ ] 5.6 Write property test for P6: for any ProgressSession where maxKg is null, the rendered value is "—"
  - [ ] 5.7 Write property test for P7: for any WorkoutFeedback array, the exercise picker contains exactly the unique exercises present in the entries
