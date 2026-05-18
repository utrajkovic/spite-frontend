# Tasks

## Task List

- [ ] 1. Backend: Extend User model with profile fields
  - [ ] 1.1 Add `displayName` (String), `weightKg` (Double), `heightCm` (Double), `profilePictureUrl` (String) fields to `User.java` with getters and setters; all default to null

- [ ] 2. Backend: ProfileData DTO
  - [ ] 2.1 Create `ProfileData.java` in `com.spite.backend.dto` with the four profile fields and getters/setters

- [ ] 3. Backend: Profile endpoints in UserController
  - [ ] 3.1 Add `GET /api/users/{username}/profile` — find user by username, return `ProfileData` mapped from user fields; return 404 if not found
  - [ ] 3.2 Add `PUT /api/users/{username}/profile` — read `X-Username` header, return 403 if it doesn't match `{username}`; find user, update all four profile fields from request body (null for omitted), save, return updated `ProfileData`; return 404 if user not found

- [ ] 4. Frontend: UserProfile interface and User model extension
  - [ ] 4.1 Add `UserProfile` interface to `spite-frontend/src/app/services/models.ts` with fields: `displayName: string | null`, `weightKg: number | null`, `heightCm: number | null`, `profilePictureUrl: string | null`
  - [ ] 4.2 Add optional `profile?: UserProfile` field to the existing `User` interface in `models.ts`

- [ ] 5. Frontend: ProfileService
  - [ ] 5.1 Create `spite-frontend/src/app/services/profile.service.ts` as `@Injectable({ providedIn: 'root' })`
  - [ ] 5.2 Implement `getProfile(username: string): Observable<UserProfile>` calling `GET /api/users/{username}/profile`
  - [ ] 5.3 Implement `updateProfile(username: string, profile: UserProfile): Observable<UserProfile>` calling `PUT /api/users/{username}/profile` with `X-Username` header set to the current user's username

- [ ] 6. Frontend: Tab3 profile section (user view and edit)
  - [ ] 6.1 Add `userProfile: UserProfile | null` and `isProfileLoading: boolean` fields to `tab3.page.ts`
  - [ ] 6.2 Add `loadProfile()` method calling `ProfileService.getProfile(currentUser.username)` and assign result to `userProfile`; call it inside `loadData()`
  - [ ] 6.3 Add `isEditingProfile: boolean` field and `editForm` object pre-populated from `userProfile` when edit is triggered
  - [ ] 6.4 Add `saveProfile()` method calling `ProfileService.updateProfile()`, updating `userProfile` on success, showing error alert on failure
  - [ ] 6.5 Add `ProfileService` to `tab3.page.ts` imports and constructor
  - [ ] 6.6 Update `tab3.page.html`: add profile section above exercises showing display name, weight, height, and profile picture (or placeholders); add edit button that toggles inline edit form with Save/Cancel; show loading spinner while `isProfileLoading` is true

- [ ] 7. Frontend: TrainerClientPage read-only client profile
  - [ ] 7.1 Add `clientProfile: UserProfile | null` and `isProfileLoading: boolean` fields to `tab-trainer-client.page.ts`
  - [ ] 7.2 Add `loadClientProfile()` method calling `ProfileService.getProfile(this.clientUsername)` and assign result to `clientProfile`; call it inside `loadData()`
  - [ ] 7.3 Add `ProfileService` to `tab-trainer-client.page.ts` imports and constructor
  - [ ] 7.4 Update `tab-trainer-client.page.html`: add read-only client profile section showing display name, weight, height, and profile picture (or "Not set" placeholder for null fields); no edit controls; show loading spinner while `isProfileLoading` is true

- [ ] 8. Backend: Property-based tests
  - [ ] 8.1 Write property test for P1: for any username and ProfileData, PUT then GET returns equal ProfileData (jqwik)
  - [ ] 8.2 Write property test for P2: for any GET /profile response, body contains no `password` or `id` field
  - [ ] 8.3 Write property test for P3: for any PUT where X-Username ≠ path username, response is 403
  - [ ] 8.4 Write property test for P4: for any non-existent username, GET and PUT return 404
  - [ ] 8.5 Write property test for P5: for any PUT omitting fields, subsequent GET returns null for those fields
  - [ ] 8.6 Write property test for P6: for any newly registered user, GET /profile returns all four fields as null

- [ ] 9. Frontend: Property-based tests
  - [ ] 9.1 Write property test for P7: for any UserProfile, rendered profile section contains all four field values or placeholder text for null fields (fast-check)
