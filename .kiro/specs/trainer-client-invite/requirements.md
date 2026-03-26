# Requirements Document

## Introduction

This feature replaces the current trainer-client system where a trainer can directly add any user as a client without consent. The new system introduces an invite/request flow: a trainer sends an invite to a user by username, the user receives a pending invite notification and can accept or decline it, and only upon acceptance is the `TrainerClientLink` created. Trainers can view and cancel their pending sent invites; users can view all pending invites they have received.

Both the Spring Boot backend (new `TrainerInvite` model, new endpoints) and the Angular/Ionic frontend (trainer invite UI, user notification/response UI) require changes.

---

## Glossary

- **Trainer**: A user with `Role.TRAINER` in the system.
- **Client**: A user with `Role.USER` who has accepted a trainer's invite.
- **Invite**: A `TrainerInvite` document in MongoDB representing a pending, accepted, or declined invite from a Trainer to a User.
- **Invite_Service**: The backend Spring Boot service responsible for invite lifecycle management.
- **Trainer_Controller**: The existing Spring Boot REST controller at `/api/trainer`.
- **Invite_Controller**: The new Spring Boot REST controller at `/api/trainer/invites`.
- **TrainerClientLink**: The existing MongoDB document that represents an active trainer-client relationship.
- **Trainer_Page**: The Angular/Ionic page used by trainers to manage clients and invites (`tab-trainer`).
- **Notifications_Page**: The Angular/Ionic page or section where a user sees and responds to pending invites.
- **Pending**: An invite whose status is `PENDING` — sent but not yet acted upon.
- **Accepted**: An invite whose status is `ACCEPTED` — the user agreed to the relationship.
- **Declined**: An invite whose status is `DECLINED` — the user rejected the invite.

---

## Requirements

### Requirement 1: Send Trainer Invite

**User Story:** As a trainer, I want to send an invite to a user by username, so that the user can consent before becoming my client.

#### Acceptance Criteria

1. WHEN a trainer submits an invite for a target username, THE Invite_Controller SHALL create a `TrainerInvite` document with status `PENDING` and return HTTP 200.
2. IF the trainer's username does not have `Role.TRAINER`, THEN THE Invite_Controller SHALL return HTTP 403.
3. IF the target username does not exist in the system, THEN THE Invite_Controller SHALL return HTTP 400 with a descriptive error message.
4. IF a `PENDING` invite already exists between the same trainer and target user, THEN THE Invite_Controller SHALL return HTTP 400 with the message "Invite already sent".
5. IF an active `TrainerClientLink` already exists between the trainer and the target user, THEN THE Invite_Controller SHALL return HTTP 400 with the message "User is already your client".
6. THE Invite_Controller SHALL NOT create a `TrainerClientLink` at invite-send time.

---

### Requirement 2: View Sent Invites (Trainer)

**User Story:** As a trainer, I want to see all pending invites I have sent, so that I can track who has not yet responded.

#### Acceptance Criteria

1. WHEN a trainer requests their sent invites, THE Invite_Controller SHALL return all `TrainerInvite` documents where `trainerUsername` matches and status is `PENDING`.
2. THE Trainer_Page SHALL display the list of pending sent invites with the target username visible.

---

### Requirement 3: Cancel a Sent Invite (Trainer)

**User Story:** As a trainer, I want to cancel a pending invite I sent, so that I can retract an invite before the user responds.

#### Acceptance Criteria

1. WHEN a trainer cancels a pending invite by invite ID, THE Invite_Controller SHALL delete the `TrainerInvite` document and return HTTP 200.
2. IF the invite does not exist or does not belong to the requesting trainer, THEN THE Invite_Controller SHALL return HTTP 404.
3. IF the invite status is not `PENDING`, THEN THE Invite_Controller SHALL return HTTP 400 with the message "Only pending invites can be cancelled".

---

### Requirement 4: View Received Invites (User)

**User Story:** As a user, I want to see all pending invites I have received from trainers, so that I can decide whether to accept or decline them.

#### Acceptance Criteria

1. WHEN a user requests their received invites, THE Invite_Controller SHALL return all `TrainerInvite` documents where `clientUsername` matches and status is `PENDING`.
2. THE Notifications_Page SHALL display each pending invite with the trainer's username visible.

---

### Requirement 5: Accept an Invite (User)

**User Story:** As a user, I want to accept a trainer's invite, so that the trainer-client relationship is established.

#### Acceptance Criteria

1. WHEN a user accepts an invite by invite ID, THE Invite_Service SHALL update the `TrainerInvite` status to `ACCEPTED`.
2. WHEN a user accepts an invite, THE Invite_Service SHALL create a `TrainerClientLink` between the trainer and the user.
3. IF the invite does not exist or the `clientUsername` on the invite does not match the requesting user, THEN THE Invite_Controller SHALL return HTTP 404.
4. IF the invite status is not `PENDING`, THEN THE Invite_Controller SHALL return HTTP 400 with the message "Invite is no longer pending".
5. WHEN an invite is accepted, THE Invite_Controller SHALL return HTTP 200.

---

### Requirement 6: Decline an Invite (User)

**User Story:** As a user, I want to decline a trainer's invite, so that no trainer-client relationship is created.

#### Acceptance Criteria

1. WHEN a user declines an invite by invite ID, THE Invite_Service SHALL update the `TrainerInvite` status to `DECLINED`.
2. THE Invite_Service SHALL NOT create a `TrainerClientLink` when an invite is declined.
3. IF the invite does not exist or the `clientUsername` on the invite does not match the requesting user, THEN THE Invite_Controller SHALL return HTTP 404.
4. IF the invite status is not `PENDING`, THEN THE Invite_Controller SHALL return HTTP 400 with the message "Invite is no longer pending".
5. WHEN an invite is declined, THE Invite_Controller SHALL return HTTP 200.

---

### Requirement 7: Remove Direct Add-Client Capability

**User Story:** As a system owner, I want to remove the ability for trainers to directly add clients without consent, so that users are always in control of their trainer relationships.

#### Acceptance Criteria

1. THE Trainer_Controller SHALL no longer expose the `POST /api/trainer/add-client` endpoint.
2. THE Trainer_Page SHALL replace the "Add Client" direct-add button with a "Send Invite" button that triggers the invite flow.
3. WHEN the "Send Invite" button is clicked with a valid username, THE Trainer_Page SHALL call the invite endpoint and display a confirmation message.

---

### Requirement 8: Invite Data Integrity

**User Story:** As a system owner, I want invite data to be consistent, so that the system never ends up in an invalid state.

#### Acceptance Criteria

1. THE Invite_Service SHALL ensure that accepting an invite is idempotent: accepting the same invite a second time SHALL return HTTP 400 with "Invite is no longer pending".
2. THE Invite_Service SHALL ensure that for any accepted invite, exactly one `TrainerClientLink` exists between the trainer and client.
3. WHEN a `TrainerClientLink` is removed (client removed by trainer), THE Invite_Service SHALL NOT automatically delete the corresponding `TrainerInvite` record.
