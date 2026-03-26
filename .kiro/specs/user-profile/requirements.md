# Requirements Document

## Introduction

The User Profile feature extends the existing Spite fitness app user model with optional personal information fields: display name, weight, height, and profile picture. Users can view and edit their own profile from the Manage tab (tab3). Trainers can view a client's profile in read-only mode from the trainer-client page. Profile data is persisted on the User document in MongoDB and exposed via dedicated REST endpoints.

## Glossary

- **System**: The Spite fitness application (frontend + backend combined)
- **Backend**: The Spring Boot REST API service
- **Frontend**: The Ionic/Angular mobile application
- **User**: An authenticated app user with role USER
- **Trainer**: An authenticated app user with role TRAINER
- **Profile**: The optional personal information associated with a User document
- **ProfileData**: The set of optional fields — `displayName`, `weightKg`, `heightCm`, `profilePictureUrl`
- **Tab3**: The Manage/Settings tab in the frontend, accessible to all authenticated users
- **TrainerClientPage**: The frontend page a Trainer uses to manage a specific client
- **ProfileEndpoint**: The backend REST endpoints under `/api/users/{username}/profile`

---

## Requirements

### Requirement 1: Profile Fields on User Model

**User Story:** As a developer, I want the User document to store optional profile fields, so that personal information can be persisted alongside authentication data.

#### Acceptance Criteria

1. THE Backend SHALL store the following optional fields on the User document: `displayName` (string), `weightKg` (decimal), `heightCm` (decimal), and `profilePictureUrl` (string).
2. THE Backend SHALL treat all four profile fields as optional, allowing null values without validation errors.
3. WHEN a User document is created via the existing registration endpoint, THE Backend SHALL initialize all profile fields as null.

---

### Requirement 2: Get Profile Endpoint

**User Story:** As a client or trainer, I want to retrieve a user's profile data via the API, so that the frontend can display profile information.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/users/{username}/profile`, THE ProfileEndpoint SHALL return the ProfileData fields for the specified user.
2. IF the specified username does not exist, THEN THE ProfileEndpoint SHALL return HTTP 404.
3. THE ProfileEndpoint SHALL return only the ProfileData fields (`displayName`, `weightKg`, `heightCm`, `profilePictureUrl`) and not expose the user's password or internal id.

---

### Requirement 3: Update Profile Endpoint

**User Story:** As a user, I want to update my own profile data via the API, so that my personal information is saved to the server.

#### Acceptance Criteria

1. WHEN a PUT request is made to `/api/users/{username}/profile` with a valid ProfileData body, THE ProfileEndpoint SHALL update and persist the profile fields for that user.
2. WHEN a PUT request is made to `/api/users/{username}/profile`, THE ProfileEndpoint SHALL require the `X-Username` header to match the `{username}` path variable.
3. IF the `X-Username` header does not match the `{username}` path variable, THEN THE ProfileEndpoint SHALL return HTTP 403.
4. IF the specified username does not exist, THEN THE ProfileEndpoint SHALL return HTTP 404.
5. WHEN a PUT request omits a profile field, THE ProfileEndpoint SHALL treat the omitted field as null and overwrite the stored value with null.

---

### Requirement 4: User Views and Edits Own Profile in Tab3

**User Story:** As a user, I want to view and edit my profile from the Manage tab, so that I can keep my personal information up to date.

#### Acceptance Criteria

1. WHEN Tab3 loads, THE Frontend SHALL fetch and display the current user's ProfileData from the ProfileEndpoint.
2. THE Frontend SHALL display the profile section in Tab3 showing `displayName`, `weightKg`, `heightCm`, and a profile picture (rendered from `profilePictureUrl`).
3. WHEN a user taps the edit action in the profile section, THE Frontend SHALL present an editable form pre-populated with the current ProfileData values.
4. WHEN a user submits the edit form, THE Frontend SHALL send a PUT request to `/api/users/{username}/profile` with the updated ProfileData.
5. WHEN the PUT request succeeds, THE Frontend SHALL update the displayed profile values without requiring a full page reload.
6. IF the PUT request fails, THEN THE Frontend SHALL display an error message to the user.
7. WHILE the profile data is loading, THE Frontend SHALL display a loading indicator.

---

### Requirement 5: Trainer Views Client Profile (Read-Only)

**User Story:** As a trainer, I want to view a client's profile from the trainer-client page, so that I can understand their physical stats when planning workouts.

#### Acceptance Criteria

1. WHEN the TrainerClientPage loads for a given client, THE Frontend SHALL fetch and display the client's ProfileData from the ProfileEndpoint.
2. THE Frontend SHALL display the client's `displayName`, `weightKg`, `heightCm`, and profile picture in the TrainerClientPage.
3. THE Frontend SHALL render the client profile section in read-only mode with no edit controls.
4. IF the client has no profile data set, THEN THE Frontend SHALL display placeholder text indicating the fields are not set.
5. WHILE the client profile data is loading, THE Frontend SHALL display a loading indicator.

---

### Requirement 6: Frontend Profile Data Model

**User Story:** As a developer, I want a typed model for profile data in the frontend, so that profile fields are consistently handled across components.

#### Acceptance Criteria

1. THE Frontend SHALL define a `UserProfile` interface containing `displayName` (string or null), `weightKg` (number or null), `heightCm` (number or null), and `profilePictureUrl` (string or null).
2. THE Frontend SHALL extend the existing `User` interface to include an optional `profile` field of type `UserProfile`.
3. THE Frontend SHALL expose a `getProfile(username: string)` method and an `updateProfile(username: string, profile: UserProfile)` method in a service accessible to Tab3 and TrainerClientPage.
