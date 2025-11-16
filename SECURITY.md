# Security Guidelines

## Firebase Credentials

### CRITICAL: Never Commit Credentials to Git

This project uses Firebase Admin SDK which requires a service account key file. **This file contains sensitive credentials and must NEVER be committed to version control.**

### Proper Credential Management

#### 1. Service Account Key Setup

The Firebase service account key should be stored as `server/serviceAccountKey.json`. This file is already ignored by `.gitignore`.

**To set up your credentials:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the downloaded JSON file as `server/serviceAccountKey.json`

#### 2. Example File

A template file `server/serviceAccountKey.example.json` is provided to show the expected structure. Copy your actual credentials to `server/serviceAccountKey.json` (which is gitignored).

```bash
# DO NOT DO THIS - Example only showing structure
cp server/serviceAccountKey.example.json server/serviceAccountKey.json
# Then edit serviceAccountKey.json with your actual credentials
```

### What's Protected in .gitignore

The following patterns ensure credentials are never committed:

```
server/serviceAccountKey.json
serviceAccountKey.json
**/serviceAccountKey*.json
.env
server/.env
```

### Client-Side vs Server-Side Credentials

- **Client-side** (`services/firebase.ts`): Contains public Firebase config (API keys, project IDs). These are safe to commit.
- **Server-side** (`server/serviceAccountKey.json`): Contains private keys with admin privileges. **NEVER commit these.**

### If Credentials Are Accidentally Committed

If you accidentally commit credentials:

1. **Immediately rotate the credentials** in Firebase Console
2. Generate a new service account key
3. Remove the credentials from git history (contact your team lead)
4. Update your local `serviceAccountKey.json` with the new credentials

### Production Deployment

For production environments:

1. **Never deploy with committed credentials**
2. Use environment variables or secure secret management services:
   - Cloud providers: AWS Secrets Manager, Google Secret Manager, Azure Key Vault
   - CI/CD: GitHub Secrets, GitLab CI/CD variables
   - Containers: Kubernetes Secrets, Docker secrets

3. **Example: Using environment variable for credentials**
   ```javascript
   // Alternative approach - store credentials as env variable
   const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
   ```

### Security Checklist

- [ ] `serviceAccountKey.json` is in `.gitignore`
- [ ] No credentials are committed in git history
- [ ] Service account has minimum required permissions
- [ ] Credentials are rotated regularly (recommended: every 90 days)
- [ ] Production uses secure secret management
- [ ] `.env` files are in `.gitignore`

### Additional Security Best Practices

1. **Use HTTPS** in production
2. **Implement rate limiting** on API endpoints
3. **Validate and sanitize** all user inputs
4. **Use Firebase Security Rules** for database access
5. **Monitor for suspicious activity** in Firebase Console
6. **Keep dependencies updated** (`npm audit` regularly)

## Reporting Security Issues

If you discover a security vulnerability, please email [security contact] instead of using the issue tracker.
