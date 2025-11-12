# True Champion Constitution

<!--
SYNC IMPACT REPORT
==================
Version Change: 0.0.0 → 1.0.0
Ratification: Initial constitution creation for multi-platform SaaS evolution

Principles Added:
  I. Data Security & Privacy - User data isolation and credential protection
  II. Platform Reliability - External API dependency management
  III. Multi-Tenant Architecture - Scalable data scoping and isolation
  IV. Testing Standards - Comprehensive testing for platform integrations
  V. Simplicity in Complexity - Component-focused design
  VI. Incremental Delivery - Phased migration support
  VII. Performance Requirements - Response time and user experience standards

Governance Sections Added:
  - Change Management Protocol for platform-specific decisions
  - API Contract Management for external dependencies
  - Backwards Compatibility Policy

Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check section aligned with new principles
  ✅ spec-template.md - Security and platform requirements added to functional requirements
  ✅ tasks-template.md - Testing phases aligned with new testing standards

Follow-up TODOs: None
-->

## Core Principles

### I. Data Security & Privacy

**User Data Isolation**: All user data MUST be scoped by user ID and league ID at the database level. No query may return data across user boundaries without explicit cross-user authorization.

**Credential Storage**: Platform authentication tokens (ESPN swid/s2, Sleeper tokens, Yahoo OAuth) MUST be encrypted at rest using industry-standard encryption (AES-256 or equivalent). Credentials MUST be decrypted only in memory during API calls and MUST NOT be logged or exposed in error messages.

**Privacy Protection**: User league data MUST NOT be shared, cached globally, or made accessible to other users. Each user's fantasy league data is private by default. Any sharing features require explicit opt-in consent.

**Security Auditing**: All access to user credentials and sensitive data MUST be logged with user ID, timestamp, and operation type for security audit trails.

**Rationale**: Fantasy league data and platform credentials are highly sensitive. A breach exposing league credentials or private roster data would destroy user trust and violate privacy expectations. Database-level isolation prevents accidental cross-user data leaks.

### II. Platform Reliability

**Rate Limiting**: Each platform integration MUST implement configurable rate limiting that respects platform API limits with a safety margin (e.g., 80% of documented limit). Rate limiters MUST be per-user to prevent one user's activity from affecting others.

**Graceful Degradation**: When an external platform API is unavailable, the system MUST return cached data with staleness indicators rather than complete failure. Users MUST see "Last updated: X hours ago" timestamps on all platform-sourced data.

**Retry Logic**: All external API calls MUST implement exponential backoff with jitter. Max retry attempts: 3. Base delay: 1 second. Failures after retries MUST be logged with platform name, error type, and user ID for monitoring.

**Circuit Breakers**: If a platform API fails consistently (>50% error rate over 5 minutes), the system MUST open a circuit breaker for that platform for 5 minutes, serving cached data only and alerting operators.

**Fallback Behaviors**: Calculation features (true champion algorithm) MUST work with incomplete data. Missing week data MUST be handled gracefully with clear indicators to users ("Week 7 data unavailable").

**Rationale**: We depend entirely on third-party APIs we don't control. ESPN, Sleeper, and Yahoo APIs can and will fail. Users should always see their data, even if slightly stale, rather than error screens. Aggressive retries without backoff can worsen API issues and get our IP banned.

### III. Multi-Tenant Architecture

**Data Scoping**: Every database table MUST include `user_id` as part of the primary key or with a unique constraint ensuring data isolation. Every query MUST filter by `user_id` from the authenticated session.

**Resource Isolation**: Redis keys MUST follow the pattern `{user_id}:{league_id}:{resource_type}:{identifier}` to prevent key collisions across users. Background jobs MUST be scoped per user/league.

**Scalable Patterns**: All services MUST be stateless. Session state MUST be stored in Redis or database, never in application memory. This enables horizontal scaling as user base grows.

**Tenant Limits**: Implement per-user rate limits (API calls, data refreshes) to prevent individual users from degrading performance for others. Start with generous limits (e.g., 100 refreshes/hour) and adjust based on usage patterns.

**Configuration**: Platform-specific settings (refresh frequency, notification preferences) MUST be stored per-user, not globally. One user's settings MUST NOT affect another user's experience.

**Rationale**: The current single-tenant architecture hardcodes one league ID. Multi-tenancy requires fundamental changes to data access patterns. Without proper scoping, bugs could leak user data across accounts. The architecture must scale efficiently from 10 to 10,000 users without major rewrites.

### IV. Testing Standards

**Contract Tests**: Each platform integration (ESPN, Sleeper, Yahoo) MUST have contract tests that validate API response schemas. Contract tests MUST run on every deployment and fail the build if platform APIs have changed unexpectedly.

**Integration Tests**: Each platform adapter MUST have integration tests using real platform test accounts. Integration tests MUST validate the full data flow: API fetch → parsing → storage → retrieval.

**Algorithm Verification**: The true champion calculation algorithm MUST have unit tests with known scenarios covering:
- All teams play all teams (standard scenario)
- Unequal number of games (bye weeks)
- Tied scores (tiebreaker rules)
- Edge cases (division by zero, missing data)

**Multi-Tenant Testing**: Data isolation MUST be verified with integration tests that create multiple users, perform operations, and assert that no data leaks across user boundaries.

**Performance Testing**: Load tests MUST validate performance requirements (see Principle VII) before major releases. Test scenarios MUST include concurrent users, platform API slowdowns, and cache failures.

**Test Data**: Avoid using production credentials in tests. Use platform sandbox/test accounts. If unavailable, use mock responses captured from real API calls (sanitized).

**Rationale**: External APIs change without notice. Contract tests detect breaking changes early. The true champion algorithm is the core value proposition—bugs here directly impact user trust. Multi-tenant bugs can expose private data, making isolation testing non-negotiable.

### V. Simplicity in Complexity

**Single Responsibility**: Each service MUST have one clear purpose: `ESPNAdapter` fetches ESPN data, `TrueChampionCalculator` performs calculations, `LeagueDataService` orchestrates. No god objects.

**Platform Abstraction**: Create a common `PlatformAdapter` interface that all platform integrations implement (ESPN, Sleeper, Yahoo). However, do NOT over-abstract. Platform-specific logic stays in platform-specific adapters—don't force-fit incompatible APIs into premature generalizations.

**Avoid Premature Optimization**: Start with simple implementations. Use database queries before introducing caching layers. Use synchronous processing before queues. Add complexity only when performance requirements demand it, with clear justification.

**Clear Boundaries**: Separate concerns into layers: API routes → Service layer → Data access layer. Each layer has a defined contract. UI components MUST NOT directly access databases or external APIs.

**Configuration Over Code**: Platform differences should be configuration-driven where possible. Example: API endpoints, rate limits, retry policies should be in config files, not hardcoded in adapters.

**Rationale**: Multi-platform support is inherently complex. If individual components are also complex, the system becomes unmaintainable. Simple, focused components are easier to test, debug, and replace. Over-abstraction leads to rigid designs that break when platforms don't fit the abstraction model.

### VI. Incremental Delivery

**Backwards Compatibility**: The existing ESPN-only functionality MUST continue working throughout the migration. Users with ESPN leagues MUST experience no disruption.

**Feature Flags**: New platform support (Sleeper, Yahoo) MUST be behind feature flags that enable per-user or globally. This allows gradual rollout and quick rollback if issues arise.

**Phased Migration**:
- **Phase 1**: Refactor existing ESPN code into the new multi-tenant architecture without breaking functionality
- **Phase 2**: Add Sleeper support alongside ESPN
- **Phase 3**: Add Yahoo support
- **Phase 4**: Multi-league dashboard for users with leagues across platforms

Each phase MUST be deployable and usable independently.

**Data Migration**: Existing ESPN data MUST be migrated to the new multi-tenant schema with a migration script. The script MUST be idempotent and reversible. Test migrations on production database copy before running.

**No Breaking Changes**: API endpoints used by existing UI MUST maintain backwards compatibility. Add new endpoints for new features rather than changing existing ones (unless major version bump is acceptable).

**User Communication**: Notify users of upcoming changes via in-app messaging and email. Provide clear migration guides if user action is required (e.g., re-authenticating with ESPN).

**Rationale**: A full rewrite with downtime would lose users. Incremental delivery maintains user trust and allows learning from each platform integration before tackling the next. Feature flags enable A/B testing and safe rollouts.

### VII. Performance Requirements

**Response Times**:
- Dashboard load (standings table): < 2 seconds (p95)
- Team detail page: < 1 second (p95)
- Weekly analysis page: < 1.5 seconds (p95)
- Manual data refresh trigger: Acknowledges request < 500ms, completes in background

**Data Freshness**:
- Automated platform data sync: Tuesday mornings (post-Monday Night Football)
- User-triggered manual refresh: Once per hour per league (rate limited)
- Cache TTL: 1 hour for weekly scores, 5 minutes for standings, 24 hours for team metadata

**User Experience**:
- Loading states MUST appear within 100ms of user action
- Skeleton screens for data-heavy pages (avoid blank white screens)
- Optimistic UI updates where safe (e.g., mark data refresh as "refreshing" immediately)
- Error messages MUST be user-friendly, avoid technical jargon, provide actionable next steps

**Real-Time Features**:
- Live score updates during games: NOT required for MVP. Stick with post-game batch updates.
- If added later: WebSocket or SSE with < 10 second latency for active users

**Scalability Targets**:
- Support 1,000 concurrent users without degradation
- Handle 100 leagues per user (edge case, most users have 1-3)
- Database queries MUST use appropriate indexes (EXPLAIN ANALYZE for slow queries)

**Rationale**: Slow apps frustrate users. Fantasy football users check standings frequently—page loads > 3 seconds will drive users away. Caching is essential given external API rate limits, but staleness must be managed. Real-time updates are nice-to-have but add significant complexity—defer until user demand is clear.

## Change Management Protocol

**Platform-Specific Technical Decisions**: When choosing implementation approaches that differ per platform (e.g., ESPN uses cookies, Sleeper uses bearer tokens, Yahoo uses OAuth):
1. Document the decision in `docs/architecture/platform-decisions.md`
2. Explain why a unified approach is not feasible
3. Ensure the difference is abstracted behind the `PlatformAdapter` interface
4. Add integration tests for the platform-specific flow

**Breaking Changes from External APIs**: When ESPN, Sleeper, or Yahoo change their APIs:
1. Contract tests will detect the change (see Principle IV)
2. Update the platform adapter to handle both old and new response formats (if possible) for graceful migration
3. Log warnings when old format is detected, with deprecation timeline
4. Update tests to cover new format
5. Remove old format handling after 1 release cycle (to allow rollback if needed)

**Decision Authority**:
- **Database schema changes**: Require review by lead engineer, must include migration script
- **New platform integrations**: Require proof-of-concept demonstrating data fetch and calculation
- **Performance optimizations**: Must include benchmarks showing improvement and no correctness regressions
- **Security changes**: Require security review (external if handling credential storage changes)

## API Contract Management

**Platform Adapter Interface**: All platform integrations MUST implement the `PlatformAdapter` interface:

```typescript
interface PlatformAdapter {
  // Authenticate and validate credentials
  authenticate(credentials: PlatformCredentials): Promise<AuthResult>;

  // Fetch league metadata (team names, owners)
  fetchLeagueInfo(leagueId: string): Promise<LeagueInfo>;

  // Fetch weekly scores for a specific week
  fetchWeeklyScores(leagueId: string, week: number): Promise<WeeklyScores>;

  // Fetch current standings (actual W-L records)
  fetchStandings(leagueId: string): Promise<Standings>;

  // Check if data is available for a given week (handle bye weeks)
  isWeekAvailable(leagueId: string, week: number): Promise<boolean>;
}
```

**Contract Versioning**: If the `PlatformAdapter` interface must change:
1. Add new methods as optional first (backward compatible)
2. Implement new methods in all existing adapters
3. Make methods required in next major version
4. Remove deprecated methods only after 2 major versions (allow ample migration time)

**Error Handling Contract**: All platform adapters MUST throw standardized errors:
- `PlatformAuthError`: Invalid credentials, re-authentication needed
- `PlatformRateLimitError`: Rate limit hit, retry after X seconds
- `PlatformUnavailableError`: API is down, use cached data
- `PlatformDataNotFoundError`: League ID invalid or data not available

## Backwards Compatibility Policy

**API Versioning**: Use URL versioning for breaking changes (`/api/v1/...`, `/api/v2/...`). Maintain v1 endpoints for at least 6 months after v2 launch with deprecation warnings in response headers.

**Database Migrations**: All migrations MUST be backward compatible with the previous application version (blue-green deployment safe). Breaking schema changes require multi-step migrations:
1. Add new column/table (app still uses old)
2. Deploy app version that writes to both old and new
3. Backfill data
4. Deploy app version that reads from new
5. Remove old column/table in next release

**Feature Deprecation Timeline**:
1. **Announce** (Release N): Mark feature as deprecated in docs, add UI warnings
2. **Disable by default** (Release N+1): Feature off by default, can be enabled via flag
3. **Remove** (Release N+2): Feature code removed

**Minimum Supported Versions**: Support the current and previous major version. Example: When 2.0.0 launches, support 1.x.x for 6 months with critical bug fixes only.

## Governance

**Constitution Authority**: This constitution supersedes all other development practices, coding conventions, and legacy patterns. When in conflict, constitution principles take precedence.

**Amendment Process**: Constitution amendments require:
1. Proposal with rationale and impact analysis (which principles affected, which templates need updates)
2. Review by project lead
3. Update to this document with version bump per semantic versioning
4. Update all dependent templates (plan, spec, tasks)
5. Communication to all contributors

**Compliance Verification**: All pull requests MUST include a constitution compliance check:
- Data security: Does this PR handle credentials or user data? If yes, verify encryption and scoping.
- Platform reliability: Does this PR call external APIs? If yes, verify rate limiting, retries, error handling.
- Multi-tenancy: Does this PR access the database? If yes, verify user_id scoping.
- Testing: Does this PR add new platform integration or calculation logic? If yes, verify tests exist.

**Complexity Justification**: Any violation of principles (especially Simplicity in Complexity) MUST be justified in PR description:
- What requirement necessitates the complexity?
- What simpler alternatives were considered and why rejected?
- What is the plan to simplify if requirements change?

**Review Process**:
- All database schema changes: Lead engineer approval required
- New platform integrations: Proof-of-concept review + contract test verification
- Security-related changes: Security review checklist completion
- Performance changes: Benchmark results in PR

**Version**: 1.0.0 | **Ratified**: 2025-11-12 | **Last Amended**: 2025-11-12
