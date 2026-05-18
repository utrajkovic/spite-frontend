# Requirements Document

## Introduction

This document covers three high-priority technical debt fixes for the Spite fitness app (Angular + Ionic + Capacitor frontend, Spring Boot + MongoDB backend).

1. **Centralize the backend URL** — `https://spite-backend-v2.onrender.com` is hardcoded in 13+ locations across the frontend. It must be defined once in Angular environment files and consumed from there everywhere.
2. **Standardize storage on Capacitor Preferences** — the app inconsistently uses both `localStorage` and `Capacitor Preferences` to store and read the `user` object (and derived fields `username`, `role`). All reads and writes must go through `Preferences` so the app works correctly on both web and native platforms.
3. **Fix the `ionViewWillEnter` refresh guard in Tab1** — an `initialized` flag prevents workouts from reloading when the user navigates back to Tab1, so newly assigned workouts are invisible until the app restarts. The flag must be removed and replaced with a loading guard that prevents duplicate simultaneous requests.

## Glossary

- **App**: The Spite Angular/Ionic/Capacitor frontend application.
- **BackendService**: The Angular service (`backend.service.ts`) that wraps all HTTP calls to the Spring Boot API.
- **AuthService**: The Angular service (`auth.service.ts`) responsible for login, logout, and local user persistence.
- **LocalDataService**: The Angular service (`local-data.service.ts`) that manages local file storage and Capacitor Preferences for the user object.
- **Environment**: Angular environment files (`environment.ts` / `environment.prod.ts`) that hold build-time configuration values.
- **Preferences**: The `@capacitor/preferences` plugin — the single approved storage mechanism for the `user` object and derived fields.
- **localStorage**: The browser Web Storage API — must not be used for `user`, `username`, or `role` after this fix.
- **Tab1Page**: The component (`tab1.page.ts`) that displays the current user's workouts on the first tab.
- **initialized flag**: A boolean field on `Tab1Page` that currently prevents `loadUserWorkouts()` from running more than once per app session.
- **Loading guard**: A boolean flag (`loading`) that is `true` while a request is in flight, used to prevent duplicate simultaneous HTTP calls.

---

## Requirements

### Requirement 1: Centralize Backend URL in Environment Files

**User Story:** As a developer, I want the backend URL defined in one place, so that changing the deployment target requires editing a single file instead of hunting through the codebase.

#### Acceptance Criteria

1. THE Environment SHALL define the backend base URL as `backendUrl` in both `environment.ts` and `environment.prod.ts`.
2. THE BackendService SHALL read its `API_URL` from `environment.backendUrl` instead of a hardcoded string literal.
3. THE AuthService SHALL read its backend URL from `environment.backendUrl` instead of a hardcoded string literal.
4. WHEN any component or service constructs an HTTP request URL, THE App SHALL derive that URL from `environment.backendUrl` or from `BackendService` / `AuthService`, not from a locally declared hardcoded string.
5. THE App SHALL contain zero occurrences of the literal string `https://spite-backend-v2.onrender.com` outside of the two environment files after the fix is applied.
6. IF the `backendUrl` value in the environment files is changed, THEN THE App SHALL use the new value for all HTTP requests without any other code changes.

---

### Requirement 2: Standardize User Storage on Capacitor Preferences

**User Story:** As a developer, I want all user-object reads and writes to go through Capacitor Preferences, so that the app behaves consistently on both web browsers and native iOS/Android.

#### Acceptance Criteria

1. WHEN a user successfully logs in, THE LoginPage SHALL persist the user object exclusively via `Preferences.set({ key: 'user', ... })` and SHALL NOT call `localStorage.setItem` for `user`, `username`, or `role`.
2. WHEN any component or service needs the current user object, THE App SHALL retrieve it via `Preferences.get({ key: 'user' })` or via `AuthService.getUser()` / `LocalDataService.getUser()`.
3. THE App SHALL contain zero calls to `localStorage.getItem('user')`, `localStorage.getItem('username')`, or `localStorage.getItem('role')` after the fix is applied.
4. THE BackendService SHALL obtain the `adminUsername` value by calling `LocalDataService.getUser()` (or `AuthService.getUser()`) asynchronously, rather than reading from `localStorage`.
5. THE TabsPage SHALL obtain the current user's `role` and `username` by reading from `Preferences` rather than from `localStorage`.
6. THE TabTrainerPage SHALL obtain the current user's `username` by reading from `Preferences` rather than from `localStorage`.
7. THE TabTrainerClientPage SHALL obtain the trainer's `username` by reading from `Preferences` rather than from `localStorage`.
8. IF `Preferences.get({ key: 'user' })` returns a null value, THEN THE App SHALL treat the session as unauthenticated and redirect to the login page.

---

### Requirement 3: Fix ionViewWillEnter Refresh Guard in Tab1

**User Story:** As a user, I want my workout list to refresh every time I navigate to Tab1, so that workouts assigned by my trainer appear without requiring an app restart.

#### Acceptance Criteria

1. WHEN the user navigates to Tab1, THE Tab1Page SHALL call `loadUserWorkouts()` on every `ionViewWillEnter` event.
2. THE Tab1Page SHALL NOT contain an `initialized` flag or any equivalent mechanism that skips `loadUserWorkouts()` on subsequent visits.
3. WHILE a workout-load request is already in flight (`loading === true`), THE Tab1Page SHALL NOT initiate a second simultaneous `loadUserWorkouts()` call.
4. WHEN `loadUserWorkouts()` completes (successfully or with an error), THE Tab1Page SHALL set `loading` to `false` so that subsequent `ionViewWillEnter` events can trigger a new load.
5. WHEN a trainer assigns a new workout to the user and the user navigates to Tab1, THE Tab1Page SHALL display the newly assigned workout without requiring an app restart.
