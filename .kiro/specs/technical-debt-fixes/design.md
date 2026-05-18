# Design Document: Technical Debt Fixes

## Overview

This document covers the technical design for three targeted technical debt fixes in the Spite Angular/Ionic/Capacitor frontend:

1. **Centralize backend URL** — replace 13+ hardcoded `https://spite-backend-v2.onrender.com` occurrences with a single `environment.backendUrl` value.
2. **Standardize storage on Capacitor Preferences** — eliminate all `localStorage` reads/writes for `user`, `username`, and `role`; route everything through `Preferences`.
3. **Fix Tab1 refresh guard** — remove the `initialized` flag and replace it with a `loading` guard so workouts reload on every navigation.

Each fix is self-contained and can be applied independently, but all three are low-risk, high-value changes that improve correctness and maintainability.

---

## Architecture

The app follows a standard Angular/Ionic standalone-component architecture:

```
src/
  environments/
    environment.ts          ← build-time config (dev)
    environment.prod.ts     ← build-time config (prod)
  app/
    services/
      backend.service.ts    ← all HTTP calls to Spring Boot API
      auth.service.ts       ← login/logout, user persistence
      local-data.service.ts ← Capacitor Preferences + Filesystem wrapper
    pages/login/
      login.page.ts         ← login form, writes user to storage
    tabs/
      tabs.page.ts          ← shell with tab bar, reads role for tab visibility
    tab1/
      tab1.page.ts          ← user's workout list
    tab-trainer/
      tab-trainer.page.ts   ← trainer's client list
    tab-trainer-client/
      tab-trainer-client.page.ts ← assign/unassign workouts to a client
    tab2/, tab3/, tab-edit/, tab-trainings/
      *.page.ts             ← other pages with hardcoded URLs
    exercise-settings-modal/
      exercise-settings-modal.component.ts ← modal with hardcoded URL
    services/
      chat.service.ts       ← Firebase chat + one hardcoded URL
    workout/
      workout.page.ts       ← active workout session, reads username from localStorage
```

The two environment files are the single source of truth for build-time configuration. Angular's build system substitutes `environment.ts` with `environment.prod.ts` for production builds automatically.

---

## Components and Interfaces

### Fix 1: Environment Files

Both environment files already have `backendUrl` defined. No structural change needed — the fix is purely about making all consumers read from it.

```typescript
// environment.ts and environment.prod.ts (already correct)
export const environment = {
  production: false,
  backendUrl: 'https://spite-backend-v2.onrender.com'
};
```

Note: `backendUrl` should be the base host only (no `/api` suffix), so each consumer can append its own path prefix. This matches how components currently use it (e.g., `${backendUrl}/api/trainer/...`).

**Affected files and their change:**

| File | Current | After |
|------|---------|-------|
| `backend.service.ts` | `'https://spite-backend-v2.onrender.com/api'` | `environment.backendUrl + '/api'` |
| `auth.service.ts` | `'https://spite-backend-v2.onrender.com/api/users'` | `environment.backendUrl + '/api/users'` |
| `login.page.ts` | `'https://spite-backend-v2.onrender.com/api/users/login'` | removed (use `AuthService.login()`) |
| `tab1.page.ts` | `readonly backendUrl = 'https://...'` | `environment.backendUrl` |
| `tab2.page.ts` | `readonly backendUrl = 'https://...'` | `environment.backendUrl` |
| `tab3.page.ts` | `readonly backendUrl = 'https://...'` | `environment.backendUrl` |
| `tab-edit.page.ts` | `readonly backendUrl = 'https://...'` | `environment.backendUrl` |
| `tab-trainings.page.ts` | `readonly backendUrl = 'https://...'` | `environment.backendUrl` |
| `tab-trainer.page.ts` | `baseUrl = 'https://.../api/trainer'` | `environment.backendUrl + '/api/trainer'` |
| `tab-trainer-client.page.ts` | `baseUrl = 'https://.../api/trainer'` | `environment.backendUrl + '/api/trainer'` |
| `exercise-settings-modal.component.ts` | `readonly backendUrl = 'https://...'` | `environment.backendUrl` |
| `chat.service.ts` | inline `fetch('https://...')` | `environment.backendUrl + '/api/users/exists/...'` |
| `workout.page.ts` | no URL (uses BackendService) | no change needed |

### Fix 2: Capacitor Preferences Standardization

`LocalDataService.getUser()` and `AuthService.getUser()` already wrap `Preferences.get({ key: 'user' })` correctly. The fix is to make all consumers call these methods instead of `localStorage`.

**`BackendService.adminUsername`** — currently a synchronous getter reading `localStorage.getItem('username')`. It is used in three admin methods: `updateUserRole`, `updateUserPassword`, `deleteUser`. These methods must become `async` and await `LocalDataService.getUser()`.

```typescript
// Before
private get adminUsername(): string {
  return localStorage.getItem('username') || '';
}

// After
private async getAdminUsername(): Promise<string> {
  const user = await this.localData.getUser();
  return user?.username ?? '';
}
```

The three admin methods that call `this.adminUsername` must be updated to `async` and `await this.getAdminUsername()`. `BackendService` will need `LocalDataService` injected.

**`TabsPage.ionViewWillEnter`** — must become `async` and call `LocalDataService.getUser()`.

**`TabTrainerPage.ionViewWillEnter`** — must become `async` and call `LocalDataService.getUser()`.

**`TabTrainerClientPage.ngOnInit`** — must become `async` and call `LocalDataService.getUser()`.

**`LoginPage.login`** — must remove all `localStorage.setItem` calls. The `Preferences.set` call already exists; the duplicate `localStorage.setItem('user', ...)` at the bottom must also be removed.

**`WorkoutPage`** — reads `localStorage.getItem("username")` to get `userId` for feedback. Must use `LocalDataService.getUser()` instead.

### Fix 3: Tab1 Refresh Guard

```typescript
// Before
private initialized = false;

ionViewWillEnter() {
  if (!this.initialized) {
    this.loadUserWorkouts();
    this.initialized = true;
  }
}

// After
ionViewWillEnter() {
  if (!this.loading) {
    this.loadUserWorkouts();
  }
}
```

`loading` is already declared on the class and set to `true` at the start of `loadUserWorkouts()` and `false` in both the success and error paths. No other changes are needed.

---

## Data Models

No data model changes. The `user` object shape stored in Preferences is unchanged:

```typescript
{
  id: string;
  username: string;
  role: 'USER' | 'TRAINER' | 'ADMIN';
  // ...other fields
}
```

The environment interface is implicitly typed by the object literal. No explicit interface is required, but for clarity:

```typescript
// Implicit shape of environment object
{
  production: boolean;
  backendUrl: string;  // base URL, no trailing slash, no /api suffix
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Services derive their base URL from the environment

*For any* value of `environment.backendUrl`, every HTTP request made by `BackendService` and `AuthService` should have a URL that starts with that value.

**Validates: Requirements 1.2, 1.3**

### Property 2: ionViewWillEnter always triggers a load when not already loading

*For any* number of `ionViewWillEnter` calls on `Tab1Page` where `loading` is `false` at the time of the call, `loadUserWorkouts()` should be invoked each time.

**Validates: Requirements 3.1**

### Property 3: Loading guard prevents duplicate in-flight requests

*For any* `ionViewWillEnter` call on `Tab1Page` that occurs while `loading === true`, no new HTTP request should be initiated.

**Validates: Requirements 3.3**

### Property 4: Loading flag resets after completion

*For any* invocation of `loadUserWorkouts()`, whether it resolves successfully or rejects with an error, `loading` should be `false` after the promise settles.

**Validates: Requirements 3.4**

---

## Error Handling

**Fix 1 (URL centralization):** No new error paths. If `environment.backendUrl` is misconfigured, HTTP requests will fail with network errors — the same behavior as today with a wrong hardcoded URL.

**Fix 2 (Preferences standardization):**
- If `Preferences.get({ key: 'user' })` returns `null`, components must treat the session as unauthenticated. `BackendService.getAdminUsername()` returns `''` (empty string) in this case, which will cause the backend to reject the request with a 403 — acceptable behavior.
- `TabsPage`, `TabTrainerPage`, and `TabTrainerClientPage` should guard against a null user and either show nothing or redirect to login, consistent with existing behavior.
- `WorkoutPage` feedback submission: if user is null, skip the feedback call rather than sending an empty `userId`.

**Fix 3 (Tab1 guard):**
- The existing `catch` block in `loadUserWorkouts()` already sets `loading = false` on error. No change needed.
- If `Preferences.get` returns null inside `loadUserWorkouts()`, the method already returns early and sets `loading = false`.

---

## Testing Strategy

### Unit Tests

Unit tests cover specific examples and edge cases:

- **Environment files**: assert both `environment.ts` and `environment.prod.ts` export a non-empty `backendUrl` string.
- **BackendService URL**: instantiate `BackendService` with a mock `HttpClient` and `LocalDataService`; assert that `getAllWorkouts()` makes a request to a URL starting with `environment.backendUrl`.
- **AuthService URL**: assert that `login()` and `register()` make requests to URLs starting with `environment.backendUrl`.
- **LoginPage — no localStorage writes**: mock `Preferences` and `localStorage`; call `login()`; assert `localStorage.setItem` was never called with keys `'user'`, `'username'`, or `'role'`.
- **BackendService adminUsername via Preferences**: mock `LocalDataService.getUser()` to return `{ username: 'admin' }`; call `deleteUser('x')`; assert the request URL contains `adminUsername=admin`.
- **TabsPage — Preferences not localStorage**: mock both; call `ionViewWillEnter()`; assert `Preferences.get` was called and `localStorage.getItem` was not.
- **TabTrainerPage — Preferences not localStorage**: same pattern.
- **TabTrainerClientPage — Preferences not localStorage**: same pattern.
- **Null user redirects to login**: mock `Preferences.get` to return `{ value: null }`; call `ionViewWillEnter()` on `TabsPage`; assert router navigates to `/login`.
- **Tab1 — first navigation triggers load**: call `ionViewWillEnter()` once; assert `loadUserWorkouts` was called.
- **Tab1 — second navigation triggers load**: call `ionViewWillEnter()` twice (with `loading` reset between calls); assert `loadUserWorkouts` was called twice.
- **Tab1 — loading guard blocks duplicate**: set `loading = true`; call `ionViewWillEnter()`; assert no HTTP request was made.
- **Tab1 — loading resets on success**: mock HTTP to resolve; call `loadUserWorkouts()`; assert `loading === false` after resolution.
- **Tab1 — loading resets on error**: mock HTTP to reject; call `loadUserWorkouts()`; assert `loading === false` after rejection.

### Property-Based Tests

Property tests use [fast-check](https://github.com/dubzzz/fast-check) (TypeScript-native PBT library). Each test runs a minimum of 100 iterations.

**Property 1 — Services derive URL from environment**
```
// Feature: technical-debt-fixes, Property 1: Services derive their base URL from the environment
fc.assert(fc.property(
  fc.webUrl(),  // arbitrary base URL
  (baseUrl) => {
    environment.backendUrl = baseUrl;
    // verify BackendService and AuthService construct URLs starting with baseUrl
  }
), { numRuns: 100 });
```

**Property 2 — ionViewWillEnter always triggers load when not loading**
```
// Feature: technical-debt-fixes, Property 2: ionViewWillEnter always triggers a load when not already loading
fc.assert(fc.property(
  fc.integer({ min: 1, max: 20 }),  // arbitrary number of navigation events
  (n) => {
    // call ionViewWillEnter n times, resetting loading=false between each
    // assert loadUserWorkouts was called n times
  }
), { numRuns: 100 });
```

**Property 3 — Loading guard prevents duplicate requests**
```
// Feature: technical-debt-fixes, Property 3: Loading guard prevents duplicate in-flight requests
fc.assert(fc.property(
  fc.integer({ min: 1, max: 10 }),  // arbitrary number of concurrent calls
  (n) => {
    // set loading=true, call ionViewWillEnter n times
    // assert HTTP was called 0 additional times
  }
), { numRuns: 100 });
```

**Property 4 — Loading flag resets after completion**
```
// Feature: technical-debt-fixes, Property 4: Loading flag resets after completion
fc.assert(fc.property(
  fc.boolean(),  // true = success, false = error
  (succeeds) => {
    // mock HTTP to resolve or reject based on succeeds
    // call loadUserWorkouts(), await completion
    // assert loading === false
  }
), { numRuns: 100 });
```
