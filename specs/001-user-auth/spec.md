# Feature Specification: User Authentication & Authorization System

**Feature Branch**: `001-user-auth`
**Created**: 2025-11-12
**Status**: Draft
**Input**: User description: "Create a user authentication and authorization system for True Champion that allows users to register, login, and manage multiple fantasy football leagues. Each user should only see and access their own leagues. The system needs to support email/password login and eventually social OAuth. Users should be able to create accounts, verify emails, reset passwords, and maintain secure sessions. The authorization system must ensure complete data isolation between users - no user should ever see another user's league data, teams, or scores."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Account Creation & Email Verification (Priority: P1)

A new user visits True Champion for the first time and wants to track their fantasy football league. They need to create an account to save their league data and access it across devices.

**Why this priority**: This is the foundational entry point for all users. Without account creation, no user can use the multi-league tracking features. This is the MVP - even a single user creating an account and storing their first league represents core value delivery.

**Independent Test**: Can be fully tested by creating a new account through the registration form, receiving a verification email, clicking the verification link, and confirming the account is active and accessible. Delivers value by allowing a single user to securely store their identity.

**Acceptance Scenarios**:

1. **Given** a new visitor on the landing page, **When** they click "Sign Up" and provide valid email, password, and name, **Then** an account is created and a verification email is sent to their address
2. **Given** an unverified account, **When** the user clicks the verification link in their email, **Then** their account is marked as verified and they can log in
3. **Given** a user creating an account, **When** they provide an email that already exists, **Then** they receive a clear error message indicating the email is already registered
4. **Given** a user creating an account, **When** they provide a password shorter than 8 characters, **Then** they receive validation feedback requiring a stronger password
5. **Given** a user who hasn't verified their email, **When** they attempt to log in, **Then** they are prompted to verify their email and can request a new verification link

---

### User Story 2 - User Login & Session Management (Priority: P1)

A returning user wants to access their saved fantasy football leagues. They need to securely log in and remain authenticated while browsing different pages without constant re-authentication.

**Why this priority**: Login is essential for returning users to access their data. Without session management, users would need to re-authenticate on every page, making the application unusable. This can be tested independently by logging in and navigating between pages.

**Independent Test**: Can be fully tested by logging in with valid credentials, navigating across multiple pages (dashboard, team details, weekly analysis), and confirming the session persists. Close the browser and return to verify session persistence. Delivers value by providing seamless access to saved data.

**Acceptance Scenarios**:

1. **Given** a verified user on the login page, **When** they enter correct email and password, **Then** they are logged in and redirected to their dashboard with their leagues displayed
2. **Given** a user enters incorrect password, **When** they attempt to log in, **Then** they receive a generic error message ("Invalid email or password") without revealing which field is incorrect
3. **Given** a logged-in user browsing the app, **When** they navigate between pages, **Then** they remain authenticated without needing to re-enter credentials
4. **Given** a logged-in user closes their browser, **When** they return within 7 days, **Then** they are still logged in (session persists)
5. **Given** a logged-in user, **When** they click "Log Out", **Then** their session is terminated and they are redirected to the login page

---

### User Story 3 - Password Reset & Recovery (Priority: P2)

A user forgot their password and needs to regain access to their account without contacting support. They should be able to reset their password securely using their registered email.

**Why this priority**: Password recovery is critical for user retention but not required for initial MVP. Users can still create accounts and log in without this feature, but it becomes essential for production use to prevent account lockouts.

**Independent Test**: Can be fully tested by requesting a password reset, receiving the reset email, clicking the link, setting a new password, and logging in with the new credentials. Delivers value by preventing permanent account loss.

**Acceptance Scenarios**:

1. **Given** a user on the login page, **When** they click "Forgot Password" and enter their registered email, **Then** they receive a password reset email with a secure, time-limited link
2. **Given** a user clicks the password reset link, **When** they enter a new valid password (confirmed twice), **Then** their password is updated and they can log in with the new password
3. **Given** a password reset link, **When** more than 1 hour has passed since the link was generated, **Then** the link is expired and the user must request a new one
4. **Given** a user requests password reset for a non-existent email, **When** the request is submitted, **Then** no error is shown (to prevent email enumeration) and no email is sent
5. **Given** a user has reset their password, **When** they attempt to use an old reset link, **Then** the link is invalidated and they receive an error message

---

### User Story 4 - Multi-League Management & Authorization (Priority: P1)

A user tracks multiple fantasy football leagues (e.g., work league, friends league, family league). They need to add multiple leagues to their account and switch between them, with complete assurance that other users cannot see their league data.

**Why this priority**: Multi-league support is the core differentiator mentioned in the feature request. Complete data isolation is a security requirement, not a nice-to-have. This can be tested independently by adding multiple leagues and verifying data separation.

**Independent Test**: Can be fully tested by creating two user accounts, each adding different ESPN league IDs, and verifying that User A cannot access any data from User B's leagues through any page or API endpoint. Delivers value by enabling users to track all their leagues in one place securely.

**Acceptance Scenarios**:

1. **Given** a logged-in user on their dashboard, **When** they click "Add League" and provide a valid ESPN league ID, **Then** the league is added to their account and appears in their league list
2. **Given** a user with multiple leagues, **When** they select a different league from the league selector, **Then** all displayed data (standings, teams, scores) updates to reflect the selected league
3. **Given** two different users (User A and User B), **When** User A attempts to access a URL containing User B's league ID, **Then** User A receives an authorization error and cannot view any data
4. **Given** a user viewing their league list, **When** they click "Remove League", **Then** the league is removed from their account (but league data is retained for potential re-adding)
5. **Given** a user adds a league already tracked by another user, **When** both users view the same league, **Then** each user sees their own isolated copy of the data with no cross-contamination

---

### User Story 5 - Social Login (OAuth) (Priority: P3)

A user prefers to sign up and log in using their existing Google, Facebook, or Apple account instead of creating another password. This provides convenience and faster onboarding.

**Why this priority**: OAuth is listed as "eventual" functionality and provides convenience but is not required for core functionality. Email/password authentication (P1) must work first. This is an enhancement for user experience.

**Independent Test**: Can be fully tested by clicking "Sign in with Google", authorizing the app, and confirming the user is created and logged in without needing to provide a password. Delivers value by reducing friction for users who prefer OAuth.

**Acceptance Scenarios**:

1. **Given** a new user on the signup page, **When** they click "Sign in with Google" and authorize the app, **Then** an account is created using their Google email and they are logged in
2. **Given** a user who previously signed up with email/password, **When** they link their Google account from settings, **Then** they can subsequently log in using either method
3. **Given** a user who signed up via Google, **When** they attempt to log in with email/password using the same email, **Then** they are prompted to use Google login or set a password for direct login
4. **Given** an OAuth login attempt fails, **When** the provider returns an error, **Then** the user receives a user-friendly error message and can try again or use email/password login

---

### Edge Cases

- What happens when a user tries to add the same ESPN league ID twice to their account?
  - System should prevent duplicate league additions and notify the user the league is already tracked

- How does the system handle expired verification emails?
  - Verification links should expire after 24 hours; users can request a new verification email

- What happens when multiple users try to add the same ESPN league ID?
  - Each user gets their own isolated copy of league data - no shared state between users

- How does the system handle a user trying to access data while their session is expired?
  - User is redirected to login page with a message indicating their session expired; after login, they return to the page they were attempting to access

- What happens when a user changes their email address?
  - Email change requires verification of the new email address; old email remains active until new email is verified

- How does the system handle concurrent login sessions (e.g., user logs in on phone and laptop)?
  - Multiple active sessions are allowed; logging out from one device does not terminate other sessions

- What happens when a user enters an invalid ESPN league ID?
  - System validates the league ID by attempting to fetch data from ESPN API; if invalid, user receives clear error message

- How does the system prevent brute force password attacks?
  - After 5 failed login attempts from the same IP address within 15 minutes, that IP is temporarily locked out for 30 minutes

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create accounts using email address, password, and display name
- **FR-002**: System MUST send verification emails to newly registered users with a time-limited verification link (24-hour expiration)
- **FR-003**: System MUST validate email addresses for proper format before account creation
- **FR-004**: System MUST enforce password complexity requirements (minimum 8 characters, containing at least one letter and one number)
- **FR-005**: System MUST allow verified users to log in using their email and password
- **FR-006**: System MUST maintain user sessions for 7 days unless explicitly logged out
- **FR-007**: System MUST allow users to log out, terminating their current session
- **FR-008**: System MUST provide password reset functionality via email-based reset links (1-hour expiration)
- **FR-009**: System MUST allow users to add multiple ESPN fantasy football leagues to their account
- **FR-010**: System MUST associate each league with exactly one user (the user who added it)
- **FR-011**: System MUST prevent users from accessing any data (leagues, teams, scores, standings) belonging to other users
- **FR-012**: System MUST allow users to switch between their own leagues using a league selector interface
- **FR-013**: System MUST allow users to remove leagues from their account
- **FR-014**: System MUST validate ESPN league IDs by attempting to fetch data before adding to user account
- **FR-015**: System MUST support OAuth authentication for Google, Facebook, and Apple (future phase)
- **FR-016**: System MUST allow users to link multiple authentication methods (email + OAuth providers) to the same account
- **FR-017**: System MUST prevent account enumeration by showing generic error messages for login failures
- **FR-018**: System MUST implement rate limiting on login attempts (5 attempts per 15 minutes per IP address)
- **FR-019**: System MUST log all authentication events (login, logout, password reset, failed attempts) with timestamps and IP addresses
- **FR-020**: System MUST allow users to request new verification emails if the original expires

### Security & Privacy Requirements

- **SEC-001**: User passwords MUST be hashed using bcrypt or Argon2 with appropriate salt rounds (minimum 12 rounds for bcrypt)
- **SEC-002**: Session tokens MUST be cryptographically secure random values (minimum 256 bits of entropy)
- **SEC-003**: All database queries for league data, team data, and scores MUST include user_id in the WHERE clause to enforce data isolation
- **SEC-004**: Password reset tokens MUST be single-use and invalidated after successful password change
- **SEC-005**: Verification tokens MUST be single-use and invalidated after successful email verification
- **SEC-006**: User sessions MUST be stored server-side (not in JWT tokens alone) to enable forced logout capability
- **SEC-007**: All authentication-related API endpoints MUST use HTTPS in production
- **SEC-008**: User email addresses MUST be stored in lowercase to prevent case-sensitivity bypass issues
- **SEC-009**: OAuth tokens from providers MUST be stored encrypted at rest
- **SEC-010**: All user data queries MUST be parameterized to prevent SQL injection
- **SEC-011**: Rate limiting MUST apply at IP address level for unauthenticated requests and user level for authenticated requests
- **SEC-012**: Failed login attempts MUST NOT reveal whether the email exists in the system
- **SEC-013**: Password reset requests MUST NOT reveal whether the email exists in the system
- **SEC-014**: User sessions MUST be invalidated when password is changed
- **SEC-015**: All authorization checks MUST happen server-side; client-side checks are only for UX enhancement

### Platform Integration Requirements

- **API-001**: ESPN Fantasy API calls MUST include user-specific ESPN authentication cookies (swid, espn_s2) stored per user
- **API-002**: Failed ESPN API calls MUST implement exponential backoff (3 retries, 1s base delay, 2x multiplier)
- **API-003**: ESPN API rate limiting MUST respect platform limits with 80% safety margin (cached data used when limit approached)
- **API-004**: Invalid ESPN league IDs MUST be detected during league addition and user notified with clear error message
- **API-005**: OAuth provider unavailability MUST fallback gracefully with option to use email/password login

### Performance Requirements

- **PERF-001**: Login process MUST complete in under 2 seconds (p95) for valid credentials
- **PERF-002**: Account creation MUST complete in under 3 seconds (p95) including verification email sending
- **PERF-003**: League selector switching MUST update dashboard data in under 1 second (p95)
- **PERF-004**: Password reset email MUST be sent within 5 seconds of request
- **PERF-005**: Session validation MUST occur in under 100ms to avoid page load delays
- **PERF-006**: Authorization checks (user owns league) MUST complete in under 50ms
- **PERF-007**: Database queries for user-scoped data MUST use indexes on user_id for efficient filtering

### Key Entities

- **User**: Represents an individual account holder
  - Attributes: email (unique), password hash, display name, verification status, created date, last login date
  - Relationships: owns multiple Leagues, has multiple Sessions, has multiple AuthMethods

- **League**: Represents a fantasy football league tracked by a user
  - Attributes: ESPN league ID, league name, season year, added date, last updated date
  - Relationships: belongs to exactly one User, contains Teams, contains Scores

- **Session**: Represents an active user authentication session
  - Attributes: session token (unique), user ID, creation date, expiration date, IP address, user agent
  - Relationships: belongs to exactly one User

- **AuthMethod**: Represents an authentication method linked to a user account
  - Attributes: provider type (email, google, facebook, apple), provider user ID, linked date
  - Relationships: belongs to exactly one User

- **VerificationToken**: Represents an email verification or password reset token
  - Attributes: token value (unique), token type (email verification, password reset), user ID, expiration date, used status
  - Relationships: belongs to exactly one User

- **AuthLog**: Represents a logged authentication event
  - Attributes: user ID (nullable for failed attempts), event type (login, logout, failed login, password reset), timestamp, IP address, user agent
  - Relationships: may reference a User

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete account creation from landing page to verified account in under 3 minutes (including email verification)
- **SC-002**: Users can log in and access their dashboard in under 5 seconds from clicking "Log In"
- **SC-003**: 95% of users successfully complete account creation on first attempt without errors
- **SC-004**: Zero instances of users accessing another user's league data in security testing
- **SC-005**: Users can manage up to 10 leagues per account without performance degradation
- **SC-006**: Password reset process completes successfully for 95% of users within 5 minutes
- **SC-007**: System prevents 100% of brute force attacks through rate limiting (verified through security testing)
- **SC-008**: Users can switch between leagues and see updated data in under 2 seconds (total time from selection to data display)
- **SC-009**: OAuth login (when implemented) completes in under 10 seconds from clicking provider button to dashboard access
- **SC-010**: 90% of users remain logged in across browser sessions (session persistence working as expected)

## Assumptions

- Users have access to the email address they register with and can receive verification emails
- ESPN Fantasy Football API remains accessible and maintains current authentication method (cookies)
- Email delivery service (SMTP or service like SendGrid) is available for sending verification and reset emails
- Users are tracking ESPN Fantasy Football leagues (not Yahoo, Sleeper, or other platforms) in this phase
- A single user adding the same ESPN league as another user is acceptable (each gets isolated data)
- Users prefer session persistence (remember me) by default rather than requiring re-login each visit
- Standard web application security practices (HTTPS, secure headers) are implemented at infrastructure level
- Email verification is required before users can add leagues and access full functionality
- User display names are not required to be unique (email is the unique identifier)
- Users may want to track leagues across multiple seasons (current assumption: one season at a time per league)

## Out of Scope

- Support for fantasy football platforms other than ESPN (Yahoo, Sleeper, etc.)
- User profile management (avatar upload, bio, preferences beyond email/password)
- Social features (friend connections, league invitations to other users)
- Role-based access control (admin users, moderators)
- Two-factor authentication (2FA)
- Account deletion and data export (GDPR compliance features)
- Email notification preferences management
- Audit trail UI for viewing authentication logs (logs exist but no user-facing UI)
- Password strength meter UI (validation exists but no visual strength indicator)
- Account recovery without email access (security questions, SMS)
- League sharing or collaboration features (multiple users managing one league)
- Historical season data migration (importing past seasons retroactively)
