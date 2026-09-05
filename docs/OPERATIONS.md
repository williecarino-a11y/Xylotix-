# Miimiid Production Operations Runbook

## Health checks

- Liveness: `GET /api/health/live`
- Readiness: `GET /api/health/ready`
- Combined health: `GET /api/health`

Use the liveness endpoint for process monitoring and the readiness endpoint for traffic/deployment gates. Readiness returns `503` while MongoDB is unavailable.

## MongoDB backup

Run backups from a trusted environment with `mongodump` installed. Never commit backup files or connection strings.

```bash
mongodump --uri="$MONGO_URI" --archive="miimiid-$(date +%Y%m%d-%H%M%S).archive.gz" --gzip
```

Store the resulting archive in encrypted, access-controlled storage outside the application host. Keep more than one recent restore point and apply the retention policy required by the hosting environment.

## MongoDB restore drill

Restore into a separate database or isolated MongoDB environment before using a backup for production recovery.

```bash
mongorestore --uri="$RESTORE_MONGO_URI" --archive="BACKUP.archive.gz" --gzip --drop
```

After restore:

1. Check `/api/health/ready`.
2. Run the authentication and learning integration tests against the restored database.
3. Verify expected user, lesson, progress, and Fun Center records.
4. Record the restore timestamp and result.

## Deployment verification

Every production deployment should verify:

1. `GET /api/health/live` returns `200`.
2. `GET /api/health/ready` returns `200`.
3. The landing page returns `200` and contains the Miimiid title.
4. Authentication smoke tests pass.
5. No new 5xx errors appear in the application logs.

Do not declare a deployment healthy solely because the build succeeded.

## Rollback

Keep the previous known-good application version available until the new deployment passes its health and smoke checks. If a deployment fails verification:

1. Stop or isolate the failing release.
2. Roll back to the previous known-good version using the hosting provider's deployment mechanism.
3. Re-run live/readiness checks.
4. Verify authentication and core learning flows.
5. Investigate the failed release before attempting another deployment.

Database migrations must be backward-compatible with the previous application version before deployment.

## Incident evidence

For production incidents capture:

- Deployment/release identifier
- Start and recovery timestamps
- Affected endpoint or feature
- Health-check results
- Relevant structured error events
- Rollback or recovery action
- Root cause and follow-up task
