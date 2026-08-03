# Mukurtham Matrimony — Enterprise DevOps & CI/CD Architecture

This guide details the continuous integration, continuous delivery, containerization, and disaster recovery processes implemented for Mukurtham Matrimony.

---

## 1. CI/CD Pipeline Architecture

We use GitHub Actions to orchestrate quality control, security analysis, testing, image publication, and multi-service deployment.

```mermaid
graph TD
    PR[Pull Request to main/develop] --> Gate[PR Gate Workflow]
    Gate --> Lint[ESLint & Prettier Checks]
    Gate --> TypeCheck[TypeScript Typechecking]
    Gate --> SecAudit[Security & Secret Scan]
    Gate --> Test[Backend & Frontend Tests]
    
    Push[Merge / Push to main] --> ProdPipeline[Production CD Pipeline]
    ProdPipeline --> BuildTest[Build & Verification]
    BuildTest --> DockerPublish[Docker Build & Tag]
    DockerPublish --> Deploy[SSH Target Deployment]
    
    Deploy --> PreBackup[Database Auto-Backup]
    PreBackup --> ComposeUp[Compose Pull & Relaunch]
    ComposeUp --> Migrate[DB Migrations Push]
    Migrate --> Smoke[Smoke Test Health Checks]
    
    Smoke -- Success --> NotifySuccess[Notify Slack/Discord]
    Smoke -- Failure --> Rollback[Automatic Rollback & Restore]
    Rollback --> NotifyFailure[Notify Alert Channels]
```

---

## 2. GitHub Secrets Setup

The pipeline requires specific repository secrets. Navigate to your repository settings (`Settings -> Secrets and variables -> Actions`) and add the following keys:

| Secret Key | Description | Example / Format |
|---|---|---|
| `DOCKER_USERNAME` | Docker Registry (Docker Hub) username | `mukurthamdev` |
| `DOCKER_TOKEN` | Docker Registry access token or password | `dckr_pat_...` |
| `PROD_SERVER_HOST` | IPv4 Address of the deployment server | `192.0.2.1` |
| `PROD_SERVER_USER` | Deployment SSH user name | `ubuntu` |
| `PROD_SSH_KEY` | Private SSH Key to connect to target VM | `-----BEGIN RSA PRIVATE KEY-----...` |
| `SLACK_WEBHOOK` | Incoming Webhook URL for status notifications | `https://hooks.slack.com/services/...` |

---

## 3. Docker Configurations & Environments

All components are containerized utilizing multi-stage, minimized alpine Linux bases.

### Multi-Environment Launch via Compose
The infrastructure includes environments for development, staging, and production:

- **Local Development**: Launches local live reloading mounts.
  ```bash
  docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.override.yml up --build
  ```
- **Staging / Production**: Launches isolated container runtimes with resource limits and health checks.
  ```bash
  docker compose -f infrastructure/docker-compose.yml up -d --build
  ```

---

## 4. Database Operations

### Automated Backups
Automated database backups are run before any deployment migration. Backups are saved in `infrastructure/backups/` as timestamped SQL dumps.

To manually perform a database backup:
```bash
docker compose exec backend node infrastructure/scripts/backup-restore.js backup
```

### Automated Migrations
Migrations are pushed to the database dynamically via Prisma:
```bash
docker compose exec backend npx prisma db push --schema=dist/prisma/schema.prisma
```

### Manual Database Restores
To restore from a specific SQL backup:
```bash
docker compose exec backend node infrastructure/scripts/backup-restore.js restore [backup-filename.sql]
```

---

## 5. Recovery & Rollbacks

If post-deployment smoke tests fail, the CD pipeline automatically triggers a rolling rollback:

1. **Reverts Images**: Relaunches target stable docker images.
2. **Restores DB**: Finds the latest timestamped SQL dump in the backups directory and automatically imports it.
3. **Alerts SREs**: Sends failure details to configured communication hooks.

### Triggering Manual Rollbacks
To manually roll back to a specific version or tag, trigger the **Mukurtham Manual Rollback Trigger** workflow in the Actions tab:
1. Provide the target Docker image tag (e.g. `latest`, `v1.2.0`, or a commit SHA).
2. Set the `restore_db` flag to `true` if you wish to restore the latest database state before that deployment.
