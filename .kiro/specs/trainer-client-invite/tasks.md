# Tasks

## Task List

- [ ] 1. Backend: TrainerInvite model and repository
  - [ ] 1.1 Create `InviteStatus` enum (`PENDING`, `ACCEPTED`, `DECLINED`) in `com.spite.backend.model`
  - [ ] 1.2 Create `TrainerInvite` document class with fields: `id`, `trainerUsername`, `clientUsername`, `status`, `createdAt`
  - [ ] 1.3 Create `TrainerInviteRepository` extending `MongoRepository<TrainerInvite, String>` with query methods: `findByTrainerUsernameAndStatus`, `findByClientUsernameAndStatus`, `existsByTrainerUsernameAndClientUsernameAndStatus`

- [ ] 2. Backend: InviteService
  - [ ] 2.1 Create `InviteService` Spring `@Service` class
  - [ ] 2.2 Implement `sendInvite(trainerUsername, clientUsername)` — validates role, user existence, duplicate invite, existing link; saves PENDING invite
  - [ ] 2.3 Implement `getSentInvites(trainerUsername)` — returns PENDING invites for trainer
  - [ ] 2.4 Implement `cancelInvite(inviteId, trainerUsername)` — validates ownership and PENDING status; deletes invite
  - [ ] 2.5 Implement `getReceivedInvites(clientUsername)` — returns PENDING invites for client
  - [ ] 2.6 Implement `acceptInvite(inviteId, clientUsername)` — validates ownership and PENDING status; sets ACCEPTED; creates `TrainerClientLink`
  - [ ] 2.7 Implement `declineInvite(inviteId, clientUsername)` — validates ownership and PENDING status; sets DECLINED; does NOT create link

- [ ] 3. Backend: InviteController
  - [ ] 3.1 Create `InviteController` at `/api/trainer/invites` with `@RestController`, `@CrossOrigin(origins = "*")`
  - [ ] 3.2 `POST /send?trainerUsername=&clientUsername=` — calls `InviteService.sendInvite`; returns 200 or appropriate error
  - [ ] 3.3 `GET /sent/{trainerUsername}` — returns list of pending sent invites
  - [ ] 3.4 `DELETE /{id}/cancel?trainerUsername=` — calls `InviteService.cancelInvite`
  - [ ] 3.5 `GET /received/{clientUsername}` — returns list of pending received invites
  - [ ] 3.6 `POST /{id}/accept?clientUsername=` — calls `InviteService.acceptInvite`
  - [ ] 3.7 `POST /{id}/decline?clientUsername=` — calls `InviteService.declineInvite`

- [ ] 4. Backend: Remove add-client endpoint
  - [ ] 4.1 Delete the `POST /api/trainer/add-client` method from `TrainerController`

- [ ] 5. Frontend: TrainerInvite model
  - [ ] 5.1 Add `TrainerInvite` interface to `spite-frontend/src/app/services/models.ts` (fields: `id`, `trainerUsername`, `clientUsername`, `status`, `createdAt`)

- [ ] 6. Frontend: tab-trainer page (trainer invite UI)
  - [ ] 6.1 Remove `addClient()` method and its HTTP call from `tab-trainer.page.ts`
  - [ ] 6.2 Add `pendingInvites: TrainerInvite[]` array and `sendInvite()` method calling `POST /api/trainer/invites/send`
  - [ ] 6.3 Add `loadPendingInvites()` method calling `GET /api/trainer/invites/sent/{trainerUsername}` and populate `pendingInvites`
  - [ ] 6.4 Add `cancelInvite(id: string)` method calling `DELETE /api/trainer/invites/{id}/cancel`
  - [ ] 6.5 Call `loadPendingInvites()` in `ionViewWillEnter`
  - [ ] 6.6 Update `tab-trainer.page.html`: replace "Add Client" button with "Send Invite" button; add pending invites list section with cancel button per row

- [ ] 7. Frontend: tab3 page (user invite notifications)
  - [ ] 7.1 Add `pendingInvites: TrainerInvite[]` array to `tab3.page.ts`
  - [ ] 7.2 Add `loadPendingInvites()` method calling `GET /api/trainer/invites/received/{username}`
  - [ ] 7.3 Add `acceptInvite(id: string)` method calling `POST /api/trainer/invites/{id}/accept`
  - [ ] 7.4 Add `declineInvite(id: string)` method calling `POST /api/trainer/invites/{id}/decline`
  - [ ] 7.5 Call `loadPendingInvites()` inside `loadData()` (alongside existing forkJoin or separately)
  - [ ] 7.6 Update `tab3.page.html`: add "Pending Invites" section showing trainer username with Accept and Decline buttons per invite

- [ ] 8. Backend: Property-based tests
  - [ ] 8.1 Write property test for P1: sent invite has PENDING status (jqwik)
  - [ ] 8.2 Write property test for P2: non-trainer send returns 403
  - [ ] 8.3 Write property test for P3: duplicate invite returns 400 "Invite already sent"
  - [ ] 8.4 Write property test for P4: sending invite does not create TrainerClientLink
  - [ ] 8.5 Write property test for P5: GET /sent returns only PENDING for that trainer
  - [ ] 8.6 Write property test for P6: GET /received returns only PENDING for that user
  - [ ] 8.7 Write property test for P7: cancel removes the invite document
  - [ ] 8.8 Write property test for P8: state-change on non-PENDING returns 400
  - [ ] 8.9 Write property test for P9: accept creates exactly one TrainerClientLink and sets ACCEPTED
  - [ ] 8.10 Write property test for P10: decline creates no TrainerClientLink and sets DECLINED
  - [ ] 8.11 Write property test for P11: removing TrainerClientLink leaves TrainerInvite intact
