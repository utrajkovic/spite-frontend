# Requirements Document

## Introduction

This feature allows trainers to create reusable weekly training programs — structured plans that map workouts to specific days of the week. A trainer can assign an entire program to a client in one action, automatically linking all workouts in the schedule. Clients can then view their weekly program schedule. Trainers can also see which clients have which programs assigned.

The feature extends the existing trainer/client workout assignment system (Spring Boot + MongoDB backend, Angular/Ionic frontend) with two new domain entities: `Program` and `ClientProgramLink`.

---

## Glossary

- **Trainer**: An authenticated user with the TRAINER role who creates and manages programs.
- **Client**: An authenticated user who receives assigned programs and views their schedule.
- **Program**: A named, reusable weekly training plan owned by a Trainer, containing a weekly schedule that maps days of the week to Workout IDs.
- **WeeklySchedule**: A map from DayOfWeek (MONDAY–SUNDAY) to a Workout ID, stored inside a Program.
- **ClientProgramLink**: A record that associates a Client with a Program, including who assigned it and when.
- **Program_API**: The backend REST API that handles CRUD operations for Programs and program assignment.
- **Program_Manager**: The trainer-facing UI section in tab-trainer for creating and managing Programs.
- **Program_Assigner**: The trainer-facing UI section in tab-trainer-client for assigning Programs to a specific Client.
- **Weekly_Schedule_View**: The client-facing UI section in tab1 that displays the Client's weekly program schedule.

---

## Requirements

### Requirement 1: Create a Program

**User Story:** As a trainer, I want to create a program with a name, description, and weekly schedule, so that I can reuse structured training plans across multiple clients.

#### Acceptance Criteria

1. WHEN a trainer submits a valid program creation request with a title, description, and at least one WeeklySchedule entry, THE Program_API SHALL persist a new Program document in MongoDB with the trainer's ID, title, description, and WeeklySchedule.
2. IF a trainer submits a program creation request with a missing title, THEN THE Program_API SHALL return a 400 Bad Request response with a descriptive error message.
3. IF a trainer submits a program creation request with a WeeklySchedule entry referencing a Workout ID that does not exist, THEN THE Program_API SHALL return a 400 Bad Request response.
4. THE Program_API SHALL associate each created Program with the authenticated trainer's user ID as the `trainerId` field.

---

### Requirement 2: Read, Update, and Delete Programs

**User Story:** As a trainer, I want to view, edit, and delete my programs, so that I can keep my training plans up to date.

#### Acceptance Criteria

1. WHEN a trainer requests their program list, THE Program_API SHALL return all Programs where `trainerId` matches the requesting trainer's user ID.
2. WHEN a trainer submits a valid update request for a Program they own, THE Program_API SHALL persist the updated title, description, and WeeklySchedule.
3. IF a trainer submits an update or delete request for a Program they do not own, THEN THE Program_API SHALL return a 403 Forbidden response.
4. WHEN a trainer deletes a Program, THE Program_API SHALL remove the Program document and all associated ClientProgramLink records for that Program.

---

### Requirement 3: Assign a Program to a Client

**User Story:** As a trainer, I want to assign a program to a client, so that all workouts in the program are automatically linked to the client.

#### Acceptance Criteria

1. WHEN a trainer assigns a Program to a Client, THE Program_API SHALL create a ClientProgramLink record storing the clientUsername, programId, assignedBy (trainer username), and assignedAt (timestamp).
2. WHEN a trainer assigns a Program to a Client, THE Program_API SHALL also create a ClientWorkoutLink record for each Workout ID in the Program's WeeklySchedule that is not already assigned to that Client.
3. IF a trainer attempts to assign a Program that is already assigned to the same Client, THEN THE Program_API SHALL return a 400 Bad Request response with the message "Program already assigned to this client".
4. IF the specified Program or Client does not exist, THEN THE Program_API SHALL return a 404 Not Found response.

---

### Requirement 4: Unassign a Program from a Client

**User Story:** As a trainer, I want to unassign a program from a client, so that I can update their training plan.

#### Acceptance Criteria

1. WHEN a trainer unassigns a Program from a Client, THE Program_API SHALL delete the corresponding ClientProgramLink record.
2. WHEN a trainer unassigns a Program from a Client, THE Program_API SHALL also remove the ClientWorkoutLink records for Workouts that were part of that Program's WeeklySchedule and are not part of any other Program assigned to that Client.
3. IF the ClientProgramLink record does not exist, THEN THE Program_API SHALL return a 404 Not Found response.

---

### Requirement 5: Get a Client's Assigned Program

**User Story:** As a client, I want to retrieve my assigned program with the full weekly schedule, so that I can see which workout is planned for each day.

#### Acceptance Criteria

1. WHEN a client requests their assigned program, THE Program_API SHALL return the ClientProgramLink along with the full Program object including the WeeklySchedule.
2. WHEN a client requests their assigned program and no program is assigned, THE Program_API SHALL return an empty response (HTTP 200 with null or empty body).
3. THE Program_API SHALL resolve each Workout ID in the WeeklySchedule to the corresponding Workout title so the client can display a human-readable schedule.

---

### Requirement 6: Trainer Views Clients with Assigned Programs

**User Story:** As a trainer, I want to see which clients have which programs assigned, so that I can manage my clients' training plans.

#### Acceptance Criteria

1. WHEN a trainer requests the list of their clients with program assignments, THE Program_API SHALL return each client's username paired with the assigned Program's title and ID.
2. WHILE a client has no program assigned, THE Program_API SHALL include that client in the response with a null program field.

---

### Requirement 7: Program Manager UI (Trainer — tab-trainer)

**User Story:** As a trainer, I want a UI section to create and manage my programs, so that I can build and maintain weekly training plans without leaving the app.

#### Acceptance Criteria

1. THE Program_Manager SHALL display a list of all programs owned by the logged-in trainer.
2. WHEN a trainer taps "Create Program", THE Program_Manager SHALL present a form with fields for title, description, and a day-by-day workout selector (Monday through Sunday, each day optionally mapped to one of the trainer's workouts).
3. WHEN a trainer submits the create form with valid data, THE Program_Manager SHALL call the Program_API create endpoint and refresh the program list on success.
4. IF the Program_API returns an error on create, THEN THE Program_Manager SHALL display the error message to the trainer.
5. WHEN a trainer taps "Delete" on a program, THE Program_Manager SHALL prompt for confirmation before calling the Program_API delete endpoint.

---

### Requirement 8: Program Assigner UI (Trainer — tab-trainer-client)

**User Story:** As a trainer, I want to assign or unassign a program to a specific client from the client detail page, so that I can manage each client's plan individually.

#### Acceptance Criteria

1. THE Program_Assigner SHALL display the currently assigned program for the viewed client, or indicate "No program assigned" if none exists.
2. WHEN a trainer selects a program from their program list and taps "Assign Program", THE Program_Assigner SHALL call the Program_API assign endpoint and refresh the displayed assignment.
3. WHEN a trainer taps "Unassign Program", THE Program_Assigner SHALL prompt for confirmation, then call the Program_API unassign endpoint and refresh the displayed assignment.
4. IF the Program_API returns an error, THEN THE Program_Assigner SHALL display the error message to the trainer.

---

### Requirement 9: Weekly Schedule View (Client — tab1)

**User Story:** As a client, I want to see my weekly program schedule in my workout tab, so that I know which workout is planned for each day of the week.

#### Acceptance Criteria

1. WHEN a client opens tab1 and a program is assigned to them, THE Weekly_Schedule_View SHALL display a weekly schedule section showing each day of the week alongside the title of the assigned workout (or "Rest" if no workout is scheduled for that day).
2. WHILE no program is assigned to the client, THE Weekly_Schedule_View SHALL not display the weekly schedule section.
3. WHEN a client taps a workout in the weekly schedule, THE Weekly_Schedule_View SHALL navigate to that workout's detail view.
