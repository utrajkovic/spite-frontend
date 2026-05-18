# Tasks

## Task List

- [ ] 1. Backend: Program model and repository
  - [ ] 1.1 Create `Program` document class with fields: `id`, `trainerId`, `title`, `description`, `weeklySchedule` (`Map<String, String>` — DayOfWeek name to workoutId)
  - [ ] 1.2 Create `ClientProgramLink` document class with fields: `id`, `clientUsername`, `programId`, `assignedBy`, `assignedAt`
  - [ ] 1.3 Create `ProgramRepository` extending `MongoRepository<Program, String>` with `findByTrainerId(String trainerId)`
  - [ ] 1.4 Create `ClientProgramLinkRepository` extending `MongoRepository<ClientProgramLink, String>` with query methods: `findByClientUsername`, `findByClientUsernameAndProgramId`, `existsByClientUsernameAndProgramId`, `findByProgramId`

- [ ] 2. Backend: DTOs
  - [ ] 2.1 Create `ProgramDto` with fields: `title`, `description`, `weeklySchedule` (`Map<String, String>`)
  - [ ] 2.2 Create `ClientProgramResponse` with fields: `programId`, `programTitle`, `programDescription`, `resolvedSchedule` (`Map<String, String>`)
  - [ ] 2.3 Create `ClientProgramSummary` with fields: `clientUsername`, `programId`, `programTitle`

- [ ] 3. Backend: ProgramService
  - [ ] 3.1 Create `ProgramService` Spring `@Service` class
  - [ ] 3.2 Implement `createProgram(trainerId, dto)` — validates non-blank title, validates all workout IDs in weeklySchedule exist; saves and returns Program
  - [ ] 3.3 Implement `getTrainerPrograms(trainerId)` — returns all Programs for that trainer
  - [ ] 3.4 Implement `updateProgram(programId, trainerId, dto)` — validates ownership (403 if not owner); validates workout IDs; persists updated fields
  - [ ] 3.5 Implement `deleteProgram(programId, trainerId)` — validates ownership (403); deletes Program document and all ClientProgramLink records for that programId
  - [ ] 3.6 Implement `assignProgram(trainerUsername, clientUsername, programId)` — validates program and client exist (404); checks no duplicate ClientProgramLink (400); saves ClientProgramLink; creates ClientWorkoutLink for each workout in schedule not already assigned to client
  - [ ] 3.7 Implement `unassignProgram(clientUsername, programId)` — validates ClientProgramLink exists (404); deletes ClientProgramLink; removes ClientWorkoutLink records for workouts in the program's schedule that are not in any other program assigned to that client
  - [ ] 3.8 Implement `getClientProgram(clientUsername)` — finds ClientProgramLink; returns null/empty if none; resolves each workout ID in weeklySchedule to workout title; returns ClientProgramResponse
  - [ ] 3.9 Implement `getClientsWithPrograms(trainerUsername)` — fetches all clients of the trainer; for each client finds their ClientProgramLink; returns List<ClientProgramSummary> with null programId/title for unassigned clients

- [ ] 4. Backend: ProgramController
  - [ ] 4.1 Create `ProgramController` at `/api/programs` with `@RestController`, `@CrossOrigin(origins = "*")`
  - [ ] 4.2 `POST /` — calls `ProgramService.createProgram`; returns 200 Program or 400 on validation error
  - [ ] 4.3 `GET /trainer/{trainerId}` — returns list of trainer's programs
  - [ ] 4.4 `PUT /{programId}?trainerId=` — calls `ProgramService.updateProgram`; returns 200 or 403/404
  - [ ] 4.5 `DELETE /{programId}?trainerId=` — calls `ProgramService.deleteProgram`; returns 200 or 403/404
  - [ ] 4.6 `POST /assign?trainerUsername=&clientUsername=&programId=` — calls `ProgramService.assignProgram`; returns 200 or 400/404
  - [ ] 4.7 `DELETE /unassign?clientUsername=&programId=` — calls `ProgramService.unassignProgram`; returns 200 or 404
  - [ ] 4.8 `GET /client/{clientUsername}` — calls `ProgramService.getClientProgram`; returns 200 with ClientProgramResponse or empty body
  - [ ] 4.9 `GET /trainer/{trainerUsername}/clients-with-programs` — calls `ProgramService.getClientsWithPrograms`; returns list of ClientProgramSummary

- [ ] 5. Frontend: models
  - [ ] 5.1 Add `Program` interface to `spite-frontend/src/app/services/models.ts` with fields: `id`, `trainerId`, `title`, `description`, `weeklySchedule` (`{ [day: string]: string }`)
  - [ ] 5.2 Add `ClientProgramResponse` interface with fields: `programId`, `programTitle`, `programDescription`, `resolvedSchedule` (`{ [day: string]: string | null }`)

- [ ] 6. Frontend: tab-trainer — Program Manager UI
  - [ ] 6.1 Add `programs: Program[]` array to `tab-trainer.page.ts`
  - [ ] 6.2 Add `loadPrograms()` method calling `GET /api/programs/trainer/{trainerId}` and populate `programs`
  - [ ] 6.3 Call `loadPrograms()` in `ionViewWillEnter`
  - [ ] 6.4 Add `createProgram()` method that presents an alert/modal form with title, description, and a day-by-day workout selector (Monday–Sunday, each optionally mapped to one of the trainer's workouts); on submit calls `POST /api/programs` and refreshes the list
  - [ ] 6.5 Add `confirmDeleteProgram(programId)` method that prompts for confirmation then calls `DELETE /api/programs/{programId}?trainerId=` and refreshes the list
  - [ ] 6.6 Update `tab-trainer.page.html`: add a "Programs" section with a "Create Program" button, a list of programs with title and delete button per row

- [ ] 7. Frontend: tab-trainer-client — Program Assigner UI
  - [ ] 7.1 Add `clientProgram: ClientProgramResponse | null` and `trainerPrograms: Program[]` to `tab-trainer-client.page.ts`
  - [ ] 7.2 Add `loadClientProgram()` method calling `GET /api/programs/client/{clientUsername}`
  - [ ] 7.3 Add `assignProgram(programId: string)` method calling `POST /api/programs/assign` and refreshing `clientProgram`
  - [ ] 7.4 Add `confirmUnassignProgram()` method that prompts for confirmation then calls `DELETE /api/programs/unassign` and refreshes `clientProgram`
  - [ ] 7.5 Call `loadClientProgram()` and populate `trainerPrograms` (reuse trainer programs from existing load or add separate call) in `ngOnInit`/`loadData`
  - [ ] 7.6 Update `tab-trainer-client.page.html`: add a "Programs" segment tab showing the currently assigned program (or "No program assigned"), a dropdown/select of trainer programs, an "Assign Program" button, and an "Unassign Program" button

- [ ] 8. Frontend: tab1 — Weekly Schedule View
  - [ ] 8.1 Add `clientProgram: ClientProgramResponse | null` to `tab1.page.ts`
  - [ ] 8.2 Add `loadClientProgram()` method calling `GET /api/programs/client/{username}` and set `clientProgram`
  - [ ] 8.3 Call `loadClientProgram()` in `ionViewWillEnter` alongside existing workout loading
  - [ ] 8.4 Update `tab1.page.html`: add a weekly schedule section (shown only when `clientProgram` is non-null) that iterates over the days of the week, displaying each day name and the resolved workout title (or "Rest" if null); tapping a workout navigates to its detail view

- [ ] 9. Backend: Property-based tests
  - [ ] 9.1 Write property test for P1: for any valid trainer + program request, created program has correct trainerId (jqwik)
  - [ ] 9.2 Write property test for P2: for any program request with blank/null title, API returns 400
  - [ ] 9.3 Write property test for P3: for any program request with non-existent workout ID, API returns 400
  - [ ] 9.4 Write property test for P4: for any trainer, GET /trainer/{id} returns only that trainer's programs
  - [ ] 9.5 Write property test for P5: for any program, update/delete by non-owner returns 403
  - [ ] 9.6 Write property test for P6: for any deleted program, no ClientProgramLinks for that programId remain
  - [ ] 9.7 Write property test for P7: for any valid assignment, exactly one ClientProgramLink exists
  - [ ] 9.8 Write property test for P8: for any assignment, new ClientWorkoutLinks count equals unassigned workouts in schedule
  - [ ] 9.9 Write property test for P9: for any duplicate assignment, API returns 400 "Program already assigned to this client"
  - [ ] 9.10 Write property test for P10: for any unassignment, only non-shared workout links are removed
  - [ ] 9.11 Write property test for P11: for any client with assigned program, resolvedSchedule maps all workout IDs to correct titles
