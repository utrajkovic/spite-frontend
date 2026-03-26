# Implementation Plan: Technical Debt Fixes

## Overview

Three self-contained fixes applied to the Angular/Ionic/Capacitor frontend:
1. Centralize the backend URL in environment files
2. Standardize all user-object storage on Capacitor Preferences
3. Replace the `initialized` flag in Tab1 with a `loading` guard

## Tasks

- [ ] 1. Centralize backend URL in environment files
  - [ ] 1.1 Update `BackendService` to read `API_URL` from `environment.backendUrl`
    - Replace the hardcoded string literal with `environment.backendUrl + '/api'`
    - _Requirements: 1.2_

  - [ ]* 1.2 Write property test for BackendService URL derivation
    - **Property 1: Services derive their base URL from the environment**
    - **Validates: Requirements 1.2, 1.3**

  - [ ] 1.3 Update `AuthService` to read its backend URL from `environment.backendUrl`
    - Replace the hardcoded string literal with `environment.backendUrl + '/api/users'`
    - _Requirements: 1.3_

  - [ ] 1.4 Update all page components and services that declare a local hardcoded URL field
    - Replace `readonly backendUrl = 'https://...'` in `tab1.page.ts`, `tab2.page.ts`, `tab3.page.ts`, `tab-edit.page.ts`, `tab-trainings.page.ts`, `exercise-settings-modal.component.ts` with `environment.backendUrl`
    - Replace `baseUrl = 'https://.../api/trainer'` in `tab-trainer.page.ts` and `tab-trainer-client.page.ts` with `environment.backendUrl + '/api/trainer'`
    - Update the inline `fetch` call in `chat.service.ts` to use `environment.backendUrl + '/api/users/exists/...'`
    - _Requirements: 1.4_

  - [ ]* 1.5 Write unit tests asserting zero hardcoded URL occurrences
    - Assert `BackendService.getAllWorkouts()` makes a request to a URL starting with `environment.backendUrl`
    - Assert `AuthService.login()` and `register()` make requests to URLs starting with `environment.backendUrl`
    - _Requirements: 1.2, 1.3, 1.5_

- [ ] 2. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Standardize user storage on Capacitor Preferences
  - [ ] 3.1 Update `LoginPage` to remove all `localStorage.setItem` calls for `user`, `username`, and `role`
    - Keep the existing `Preferences.set({ key: 'user', ... })` call; delete any duplicate `localStorage.setItem` lines
    - _Requirements: 2.1_

  - [ ]* 3.2 Write unit test asserting `LoginPage.login()` never calls `localStorage.setItem`
    - Mock `Preferences` and `localStorage`; call `login()`; assert `localStorage.setItem` was never called with keys `'user'`, `'username'`, or `'role'`
    - _Requirements: 2.1_

  - [ ] 3.3 Refactor `BackendService` to replace the synchronous `adminUsername` getter with an async `getAdminUsername()` method using `LocalDataService`
    - Inject `LocalDataService` into `BackendService`
    - Replace `private get adminUsername()` with `private async getAdminUsername(): Promise<string>`
    - Update `updateUserRole`, `updateUserPassword`, and `deleteUser` to be `async` and `await this.getAdminUsername()`
    - _Requirements: 2.4_

  - [ ]* 3.4 Write unit test for `BackendService.getAdminUsername()` via Preferences
    - Mock `LocalDataService.getUser()` to return `{ username: 'admin' }`; call `deleteUser('x')`; assert the request URL contains `adminUsername=admin`
    - _Requirements: 2.4_

  - [ ] 3.5 Update `TabsPage.ionViewWillEnter` to read `role` and `username` from `LocalDataService.getUser()` instead of `localStorage`
    - Make `ionViewWillEnter` async; replace `localStorage.getItem` calls with `await this.localData.getUser()`
    - Guard against null user and redirect to login if unauthenticated
    - _Requirements: 2.5, 2.8_

  - [ ]* 3.6 Write unit tests for `TabsPage` Preferences usage
    - Assert `Preferences.get` is called and `localStorage.getItem` is not called
    - Assert router navigates to `/login` when `Preferences.get` returns null
    - _Requirements: 2.5, 2.8_

  - [ ] 3.7 Update `TabTrainerPage.ionViewWillEnter` to read `username` from `LocalDataService.getUser()` instead of `localStorage`
    - Make `ionViewWillEnter` async; replace `localStorage.getItem` with `await this.localData.getUser()`
    - _Requirements: 2.6_

  - [ ]* 3.8 Write unit test for `TabTrainerPage` Preferences usage
    - Assert `Preferences.get` is called and `localStorage.getItem` is not called
    - _Requirements: 2.6_

  - [ ] 3.9 Update `TabTrainerClientPage.ngOnInit` to read `username` from `LocalDataService.getUser()` instead of `localStorage`
    - Make `ngOnInit` async; replace `localStorage.getItem` with `await this.localData.getUser()`
    - _Requirements: 2.7_

  - [ ]* 3.10 Write unit test for `TabTrainerClientPage` Preferences usage
    - Assert `Preferences.get` is called and `localStorage.getItem` is not called
    - _Requirements: 2.7_

  - [ ] 3.11 Update `WorkoutPage` to read `username` from `LocalDataService.getUser()` instead of `localStorage`
    - Replace `localStorage.getItem("username")` with `await this.localData.getUser()` for the `userId` used in feedback submission
    - Skip the feedback call if user is null
    - _Requirements: 2.2, 2.3_

- [ ] 4. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Fix ionViewWillEnter refresh guard in Tab1
  - [ ] 5.1 Remove the `initialized` flag from `Tab1Page` and replace the guard with a `loading` check
    - Delete the `private initialized = false` field
    - Replace the `if (!this.initialized)` block in `ionViewWillEnter` with `if (!this.loading) { this.loadUserWorkouts(); }`
    - Verify `loadUserWorkouts()` already sets `loading = true` at start and `loading = false` in both success and error paths
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 5.2 Write property test for ionViewWillEnter always triggering a load when not loading
    - **Property 2: ionViewWillEnter always triggers a load when not already loading**
    - **Validates: Requirements 3.1**

  - [ ]* 5.3 Write property test for loading guard preventing duplicate requests
    - **Property 3: Loading guard prevents duplicate in-flight requests**
    - **Validates: Requirements 3.3**

  - [ ]* 5.4 Write property test for loading flag resetting after completion
    - **Property 4: Loading flag resets after completion**
    - **Validates: Requirements 3.4**

  - [ ]* 5.5 Write unit tests for Tab1 refresh behavior
    - Assert `loadUserWorkouts` is called on first `ionViewWillEnter`
    - Assert `loadUserWorkouts` is called on second `ionViewWillEnter` (with `loading` reset between calls)
    - Assert no HTTP request is made when `loading === true` during `ionViewWillEnter`
    - Assert `loading === false` after successful resolution
    - Assert `loading === false` after error rejection
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 6. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) and run a minimum of 100 iterations
- The three fixes are independent and can be applied in any order
