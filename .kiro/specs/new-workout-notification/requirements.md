# Requirements Document

## Introduction

When a trainer assigns a workout to a client in the Spite app, the client currently has no awareness of the assignment until they manually open the app and refresh. This feature adds an in-app notification system so clients are immediately informed of new workout assignments via a badge indicator on the tab bar and a readable notification list. Notifications are stored in the backend and marked as read when the client views the Workout tab.

This spec covers in-app notifications only. Push notifications are out of scope.

## Glossary

- **Notification**: A backend record indicating that a client has been assigned a new workout by a trainer.
- **Notification_Service**: The backend service responsible for creating and retrieving notification records.
- **Notification_Controller**: The backend REST controller exposing notification endpoints.
- **Notification_Repository**: The backend data access layer for Notification records.
- **NotificationService**: The Angular frontend service responsible for polling and managing notification state.
- **Tab_Bar**: The bottom navigation bar in the Spite frontend app.
- **Workout_Tab**: The tab1 page in the frontend app, which displays the client's workouts.
- **Notification_Badge**: A visual indicator on the Tab_Bar showing the count of unread notifications.
- **Notification_List**: A UI panel listing all unread notifications for the current user.
- **TrainerWorkoutController**: The existing backend controller that handles workout assignment via `POST /api/trainer/assign`.
- **Client**: A user with the role CLIENT in the Spite app.
- **Trainer**: A user with the role TRAINER in the Spite app.

## Requirements

### Requirement 1: Create Notification on Workout Assignment

**User Story:** As a client, I want to be notified when a trainer assigns me a workout, so that I know to check my new workout without having to manually refresh the app.

#### Acceptance Criteria

1. WHEN a Trainer assigns a workout to a Client via `POST /api/trainer/assign`, THE Notification_Service SHALL create a Notification record with fields: `id` (auto-generated), `recipientUsername` (the client's username), `message` (e.g. "Trainer [trainerUsername] assigned you workout [workoutTitle]"), `type` (WORKOUT_ASSIGNED), `read` (false), and `timestamp` (current server time).
2. WHEN the workout assignment already exists and the `POST /api/trainer/assign` endpoint returns a 400 error, THE Notification_Service SHALL NOT create a duplicate Notification record.
3. THE Notification_Service SHALL persist Notification records in the database via the Notification_Repository.

---

### Requirement 2: Retrieve Notifications for a Client

**User Story:** As a client, I want to fetch my notifications from the backend, so that the frontend can display them.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/notifications/{username}`, THE Notification_Controller SHALL return all Notification records where `recipientUsername` matches the given username, ordered by `timestamp` descending.
2. WHEN no notifications exist for the given username, THE Notification_Controller SHALL return an empty array with HTTP 200.
3. IF the username does not correspond to any user in the system, THEN THE Notification_Controller SHALL return HTTP 404 with a descriptive error message.

---

### Requirement 3: Mark a Notification as Read

**User Story:** As a client, I want notifications to be marked as read when I view my workouts, so that the badge clears after I've seen the notification.

#### Acceptance Criteria

1. WHEN a PUT request is made to `/api/notifications/{id}/read`, THE Notification_Controller SHALL set the `read` field of the matching Notification to `true` and return HTTP 200.
2. IF no Notification with the given `id` exists, THEN THE Notification_Controller SHALL return HTTP 404 with a descriptive error message.
3. WHEN a Notification is already marked as `read`, THE Notification_Controller SHALL still return HTTP 200 without error (idempotent operation).

---

### Requirement 4: Display Notification Badge on Tab Bar

**User Story:** As a client, I want to see a badge on the tab bar when I have unread notifications, so that I know at a glance that something new has been assigned to me.

#### Acceptance Criteria

1. WHEN the client has one or more unread Notification records, THE Notification_Badge SHALL be visible on the Workout_Tab button in the Tab_Bar.
2. WHEN the client has no unread Notification records, THE Notification_Badge SHALL NOT be visible on the Workout_Tab button.
3. THE NotificationService SHALL poll `GET /api/notifications/{username}` at a fixed interval of 30 seconds to check for new notifications.
4. WHEN the user logs in, THE NotificationService SHALL begin polling immediately and update the Notification_Badge state.
5. WHEN the user logs out, THE NotificationService SHALL stop polling.

---

### Requirement 5: Display Notification List

**User Story:** As a client, I want to see a list of my unread notifications, so that I can read what was assigned to me and by whom.

#### Acceptance Criteria

1. THE Notification_List SHALL be accessible from the Workout_Tab (tab1) page.
2. WHEN the Notification_List is opened, THE Notification_List SHALL display each unread Notification's `message` and `timestamp` in descending order.
3. WHEN there are no unread notifications, THE Notification_List SHALL display a message indicating there are no new notifications.
4. WHILE the NotificationService is fetching notifications, THE Notification_List SHALL display a loading indicator.

---

### Requirement 6: Mark Notifications as Read on Workout Tab Entry

**User Story:** As a client, I want my notifications to be automatically marked as read when I open the Workout tab, so that the badge clears after I've acknowledged the new assignment.

#### Acceptance Criteria

1. WHEN the client navigates to the Workout_Tab, THE NotificationService SHALL send a PUT request to `/api/notifications/{id}/read` for each unread Notification belonging to the current user.
2. AFTER all unread notifications are marked as read, THE Notification_Badge SHALL no longer be visible on the Workout_Tab button.
3. WHEN a PUT request to mark a notification as read fails, THE NotificationService SHALL log the error and continue attempting to mark remaining notifications as read.
