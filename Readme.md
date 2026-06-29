# Access Token and Refresh Token

## Access Token

An **Access Token** is a short-lived token used to authenticate users and access protected resources.

After successful login, the server generates an access token containing user information (payload) and sends it to the client.

The client sends this token with every protected API request.

### Flow

```
Client
   |
   | Request + Access Token
   ↓
Server
   |
   | Verify Token
   ↓
Access Granted
```

### Purpose

- Authenticates the user
- Provides access to protected routes
- Avoids sending username/password repeatedly

### Characteristics

- Short expiration time (example: 15 minutes)
- Used frequently with API requests
- If compromised, the impact is limited because it expires quickly


---

# Refresh Token

A **Refresh Token** is a long-lived token used to generate a new access token when the current access token expires.

Instead of forcing the user to login again, the client sends the refresh token to the server and receives a new access token.

### Flow

```
Access Token Expired
          |
          ↓
Client Sends Refresh Token
          |
          ↓
Server Verifies Refresh Token
          |
          ↓
New Access Token Generated
```

### Purpose

- Maintains user session
- Allows users to stay logged in
- Generates new access tokens without requiring login again

### Characteristics

- Long expiration time (example: 7 days / 30 days)
- Stored more securely
- Usually stored in HTTP-only cookies or database
- Can be revoked by removing it from storage


---

# Why Use Both Access Token and Refresh Token?

Using only an Access Token:

```
Login
  |
  ↓
Access Token
  |
  ↓
Token Expires
  |
  ↓
User Logs In Again
```

Using Access Token + Refresh Token:

```
Login
  |
  ↓
Access Token + Refresh Token
  |
  ↓
Access Token Expires
  |
  ↓
Refresh Token Generates New Access Token
  |
  ↓
User Continues Using Application
```

---

# Authentication Flow

1. User logs in using credentials:

```
Email + Password
        |
        ↓
Server verifies user
```

2. Server generates:

```
Access Token  → Short lived
Refresh Token → Long lived
```

3. Client stores both tokens.

4. Client accesses protected routes using:

```
Authorization: Bearer <access_token>
```

5. When the access token expires:

```
Refresh Token
      |
      ↓
New Access Token
```

---

# Difference Between Access Token and Refresh Token

| Access Token | Refresh Token |
|-------------|---------------|
| Short-lived | Long-lived |
| Used to access APIs | Used to generate new access tokens |
| Sent with every protected request | Sent only during token refresh |
| Higher exposure risk | Stored more securely |
| Example expiry: 15 minutes | Example expiry: 7 days |
