# Invoice PT - Backend Server

Backend server for Invoice PT application using Firebase Admin SDK.

## Prerequisites

- Node.js >= 18.0.0
- Firebase project with Admin SDK access

## Setup Instructions

### 1. Get Your Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`pt-lafi`)
3. Click on the gear icon ⚙️ > **Project Settings**
4. Navigate to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the downloaded JSON file as `serviceAccountKey.json` in the `server/` directory

**⚠️ IMPORTANT**: Never commit `serviceAccountKey.json` to version control. It's already added to `.gitignore`.

### 2. Install Dependencies

```bash
cd server
npm install
```

### 3. Configure Environment (Optional)

Copy `.env.example` to `.env` and adjust if needed:

```bash
cp .env.example .env
```

### 4. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

## Available API Endpoints

### Health Check
```bash
GET /health
```

### Verify Firebase ID Token
```bash
POST /api/verify-token
Content-Type: application/json

{
  "idToken": "your-firebase-id-token"
}
```

### Get User Data
```bash
GET /api/user/:uid
```

### Create Custom Token
```bash
POST /api/create-custom-token
Content-Type: application/json

{
  "uid": "user-uid"
}
```

## Project Structure

```
server/
├── index.js              # Main server file with Express routes
├── firebase-admin.js     # Firebase Admin SDK initialization
├── package.json          # Server dependencies
├── .env.example          # Environment variables example
├── serviceAccountKey.json # Firebase service account (DO NOT COMMIT)
└── README.md            # This file
```

## Usage with Frontend

Update your frontend to call these API endpoints. Example:

```typescript
// Verify user token on backend
const verifyToken = async (idToken: string) => {
  const response = await fetch('http://localhost:3001/api/verify-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  return response.json();
};
```

## Common Firebase Admin Operations

The Firebase Admin SDK allows you to:
- Verify ID tokens
- Create custom authentication tokens
- Manage users programmatically
- Access Realtime Database with admin privileges
- Access Firestore with admin privileges
- Send push notifications
- And more...

## Security Notes

1. **Never expose your service account key** in client-side code
2. Always validate requests on the backend
3. Use environment variables for sensitive configuration
4. Implement proper authentication/authorization middleware
5. Use HTTPS in production

## Troubleshooting

### "Cannot find module 'serviceAccountKey.json'"

Make sure you've downloaded and placed the service account key file in the `server/` directory.

### Port already in use

Change the `PORT` in `.env` file or set it when starting:
```bash
PORT=3002 npm start
```
