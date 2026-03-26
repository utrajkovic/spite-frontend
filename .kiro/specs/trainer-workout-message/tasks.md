# Tasks

## Task List

- [ ] 1. Backend: Add trainerNote to WorkoutFeedback model
  - [ ] 1.1 Add `private String trainerNote` field with getter and setter to `WorkoutFeedback.java`

- [ ] 2. Backend: TrainerNoteRequest DTO
  - [ ] 2.1 Create `TrainerNoteRequest.java` in `com.spite.backend.model` with a single `String trainerNote` field and getter/setter

- [ ] 3. Backend: PUT trainer-note endpoint
  - [ ] 3.1 Add `PUT /api/feedback/{id}/trainer-note` method to `FeedbackController` that accepts `@RequestBody TrainerNoteRequest`, looks up the document by id (returns 404 if not found), sets `trainerNote` to `null` when the value is an empty string, saves and returns the updated document

- [ ] 4. Frontend: Update WorkoutFeedback interface
  - [ ] 4.1 Add `id?: string` and `trainerNote?: string | null` fields to the `WorkoutFeedback` interface in `spite-frontend/src/app/services/models.ts`

- [ ] 5. Frontend: Extend FeedbackViewModal
  - [ ] 5.1 Add `@Input() isTrainer: boolean = false` and `noteText: string = ''` properties; inject `HttpClient` and `ToastController`; add `saveNote()` method that calls `PUT /api/feedback/{id}/trainer-note`, on success updates `feedback.trainerNote` and dismisses with the updated feedback, on error shows a toast and retains textarea content
  - [ ] 5.2 Add `IonTextarea`, `IonToast`, `FormsModule` to the component imports array
  - [ ] 5.3 Update `feedback-view.modal.html`: add trainer-mode block (textarea bound to `noteText` + "Save Note" button, shown only when `isTrainer`) and client-mode block (read-only "Trainer Note" section shown only when `!isTrainer && feedback.trainerNote`)
  - [ ] 5.4 Initialize `noteText` from `feedback.trainerNote` in `ngOnInit`

- [ ] 6. Frontend: tab-trainer-client — pass isTrainer and sync list
  - [ ] 6.1 In `openFeedback()`, add `isTrainer: true` to `componentProps`
  - [ ] 6.2 After `modal.onDidDismiss()`, if `data` is returned, find the matching entry in `feedbackList` by `id` and replace it with the updated feedback object

- [ ] 7. Frontend: tab3 — workout history section
  - [ ] 7.1 Add `feedbackList: WorkoutFeedback[]`, `loadFeedback()` method (calls `GET /api/feedback/user/{username}`), and `openFeedback(fb)` method (opens `FeedbackViewModal` with `isTrainer: false`) to `tab3.page.ts`
  - [ ] 7.2 Import `FeedbackViewModal`, add `ModalController` to providers, and call `loadFeedback()` inside `loadData()`
  - [ ] 7.3 Add a "Workout History" section to `tab3.page.html` listing `feedbackList` entries (workout title + date), each tappable to call `openFeedback(fb)`

- [ ] 8. Backend: Property-based tests
  - [ ] 8.1 Write property test for P1: GET /feedback/user/{id} always includes trainerNote field on every returned object (jqwik)
  - [ ] 8.2 Write property test for P2: PUT with any non-empty note updates only trainerNote, all other fields unchanged
  - [ ] 8.3 Write property test for P3: PUT with empty string stores null

- [ ] 9. Frontend: Property-based tests
  - [ ] 9.1 Write property test for P4: isTrainer flag controls presence of edit controls (fast-check)
  - [ ] 9.2 Write property test for P5: textarea value equals trainerNote (or empty if null) in trainer mode
  - [ ] 9.3 Write property test for P6: clicking Save Note calls PUT with the exact textarea string
  - [ ] 9.4 Write property test for P7: successful PUT response updates displayed note and dismisses with updated feedback
  - [ ] 9.5 Write property test for P8: Trainer Note section shown iff trainerNote is non-null and non-empty in client mode
