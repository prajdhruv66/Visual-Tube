# Controller Logic

## Login Flow in this project

1. The client sends `email/username` and `password` to `/api/v1/login`.
2. The server validates the inputs and checks whether the user exists.
3. If credentials are correct, the server calls `generateAccessAndRefreshTokens(userId)`.
4. This helper:
   - creates a new access token,
   - creates a new refresh token,
   - stores the refresh token in the user document,
   - returns both tokens to the controller.
5. The controller sends those tokens to the client, usually as `HttpOnly` cookies.

### Protected route flow

1. When a user visits a protected route, `verifyJwt` runs first.
2. It reads the access token from the cookie or `Authorization` header.
3. If the token is valid, the user is attached to `req.user` and the request proceeds.
4. If the token is missing or invalid, the request is rejected.

### Logout flow

1. The logout route is also protected by `verifyJwt`.
2. After authentication is confirmed, the server removes the refresh token from the database.
3. The browser cookies for access and refresh tokens are cleared.
4. After logout, the user must log in again to receive a fresh token pair.

### When to use `generateAccessAndRefreshTokens()`

Use `generateAccessAndRefreshTokens()` whenever the server needs to issue a new token pair.

Typical cases:
- after a successful login,
- after a successful token refresh,
- whenever you want to rotate tokens for security reasons.

### When to use `regenerateTokens()`

Use `regenerateTokens()` only when the access token has expired but the user still has a valid refresh token.

Typical flow:
1. Client sends the refresh token.
2. Server verifies it.
3. Server checks that the refresh token still matches the value stored in the database.
4. If valid, the server creates a new access token and a new refresh token.
5. The client receives the refreshed token pair and continues using the app.

### Little theory

- Access tokens should be short-lived.
- Refresh tokens should be longer-lived but carefully stored and invalidated when needed.
- Refresh tokens are useful for keeping user sessions smooth without asking the user to log in again repeatedly.
- `HttpOnly` cookies are preferred for token storage because they reduce the risk of token theft through JavaScript.
- The server should always compare the incoming refresh token with the one saved in the database before accepting it.
