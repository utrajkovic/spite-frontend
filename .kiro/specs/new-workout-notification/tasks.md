# Tasks

## Task List

- [ ] 1. Backend: Notification model and repository
  - [ ] 1.1 Create `Notification` document class in `com.spite.backend.model` with fields: `id`, `recipientUsername`, `message`, `type`, `read`, `timestamp`
  - [ ] 1.2 Create `NotificationRepository` extending `MongoRepository<Notification, String>` with query methods: `findByRecipientUsernameOrderByTimestampDesc`, `findByRecipientUsernameAndReadFalse`

- [ ] 2. Backend: NotificationService
  - [ ] 2.1 Create `NotificationService` Spring `@Service` class
  - [ ] 2.2 Implement `createNotification(trainerUsername, clientUsername, workoutTitle)` — builds message string, sets type to `WORKOUT_ASSIGNED`, `read` to `false`, `timestamp` to `Instant.now()`, saves via repository
  - [ ] 2.3 Implement `getNotificationsForUser(username)` — validates user exists (throws if not), returns all notifications ordered by timestamp desc
  - [ ] 2.4 Implement `markAsRead(notificationId)` — finds notification by id (throws if not found), sets `read = true`, saves and returns updated record

- [ ] 3. Backend: NotificationController
  - [ ] 3.1 Create `NotificationController` at `/api/notifications` with `@RestController`, `@CrossOrigin(origins = "*")`
  - [ ] 3.2 `GET /{username}` — calls `NotificationService.getNotificationsForUser`; returns 200 with list or 404 if user not found
  - [ ] 3.3 `PUT /{id}/read` — calls `NotificationService.markAsRead`; returns 200 or 404 if notification not found

- [ ] 4. Backend: Wire NotificationService into TrainerWorkoutController
  - [ ] 4.1 Inject `NotificationService` into `TrainerWorkoutController` via constructor
  - [ ] 4.2 In `assignWorkout()`, after `linkRepo.save(link)`, look up the workout title from `workoutRepo` and call `notificationService.createNotification(trainer, client, workoutTitle)` wrapped in a try-catch that logs but does not rethrow

- [ ] 5. Frontend: AppNotification model
  - [ ] 5.1 Add `AppNotification` interface to `spite-frontend/src/app/services/models.ts` with fields: `id`, `recipientUsername`, `message`, `type`, `read`, `timestamp`

- [ ] 6. Frontend: NotificationService (Angular)
  - [ ] 6.1 Create `spite-frontend/src/app/services/notification.service.ts` as `@Injectable({ providedIn: 'root' })`
  - [ ] 6.2 Add `notifications$: BehaviorSubject<AppNotification[]>` initialized to `[]`
  - [ ] 6.3 Add `hasUnread$: Observable<boolean>` derived from `notifications$` (true if any item has `read === false`)
  - [ ] 6.4 Implement `startPolling(username: string)` — immediately fetches notifications, then sets a 30-second interval to repeat; stores interval id
  - [ ] 6.5 Implement `stopPolling()` — clears the stored interval id
  - [ ] 6.6 Implement `markAllRead()` — iterates unread notifications from current `notifications$` value, calls `PUT /api/notifications/{id}/read` for each; on success updates local state; on individual failure logs error and continues

- [ ] 7. Frontend: TabsPage — badge on Workout tab
  - [ ] 7.1 Inject `NotificationService` into `TabsPage`
  - [ ] 7.2 Add `hasUnreadNotifications$` property bound to `notificationService.hasUnread$`
  - [ ] 7.3 In `ionViewWillEnter`, call `notificationService.startPolling(username)` after reading user from localStorage
  - [ ] 7.4 In `ionViewWillLeave`, call `notificationService.stopPolling()`
  - [ ] 7.5 Update `tabs.page.html`: add a badge element on the Workout tab button (tab1) that is shown when `hasUnreadNotifications$ | async` is true, mirroring the existing `unread-badge` pattern on the Messages tab

- [ ] 8. Frontend: Tab1Page — notification list and mark-as-read
  - [ ] 8.1 Inject `NotificationService` into `Tab1Page`
  - [ ] 8.2 In `ionViewWillEnter`, call `notificationService.markAllRead()` (remove the `initialized` guard so this runs every entry)
  - [ ] 8.3 Add `notifications$` property bound to `notificationService.notifications$`
  - [ ] 8.4 Update `tab1.page.html`: add a notification list panel that iterates unread notifications from `notifications$`, displaying `message` and `timestamp`; show a loading indicator while fetching; show an empty-state message when no unread notifications exist

- [ ] 9. Backend: Property-based tests
  - [ ] 9.1 Write property test for P1: for any valid trainer-client-workout triple, successful assign creates exactly one unread WORKOUT_ASSIGNED notification (jqwik)
  - [ ] 9.2 Write property test for P2: for any duplicate assignment (400 response), notification count is unchanged
  - [ ] 9.3 Write property test for P3: for any client with N notifications, GET returns N records ordered by timestamp desc
  - [ ] 9.4 Write property test for P4: for any notification, PUT /read called 1+ times always returns 200 and read=true
  - [ ] 9.5 Write property test for P5: for any notification list, badge visible iff unread count > 0 (fast-check, frontend)
  - [ ] 9.6 Write property test for P6: for any client with N unread notifications, Tab1 entry marks all as read and clears badge (fast-check, frontend)
  - [ ] 9.7 Write property test for P7: for any mixed read/unread list, notification panel shows only unread items in timestamp desc order (fast-check, frontend)
