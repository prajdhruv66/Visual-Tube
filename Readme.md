# Capstone Project

## Initial Folder Structure

- `package.json`
- `Readme.md`
- `public/`
  - `temp/`
- `src/`
  - `app.js`
  - `constants.js`
  - `index.js`
  - `controllers/`
  - `db/`
  - `middlewares/`
  - `models/`
  - `utils/`

## Why use Prettier?

Prettier is a code formatter that enforces a consistent style across the project.
Using Prettier helps avoid small formatting conflicts during merges, so team members can focus on actual code changes instead of whitespace, indentation, or line-break differences.

> Benefits:
> - keeps formatting consistent across files
> - reduces merge conflicts caused by formatting
> - saves time on code review for style issues
> - improves readability and maintainability

## Middleware used

- `cors` — allows requests from allowed origins, using `process.env.CORS_ORIGIN`
- `express.static` — serves public assets from the `public/` folder
- `express.json()` — parses JSON request bodies
- `express.urlencoded({ extended: true })` — parses URL-encoded form data from forms

## Async handler utility

- `src/utils/asyncHandler.js` wraps async route handlers so errors are passed to Express with `next(err)` instead of repeating `try/catch` in every handler.

## API error and response classes

Using custom classes like `ApiError` and `ApiResponse` keeps responses consistent and easy to handle across the app.

- `ApiError` centralizes error status codes and messages in one format.
- `ApiResponse` standardizes successful responses with a code, payload, and message.

Example:

```js
// error case
if (!user) {
    throw new ApiError(404, "User not found")
}

// success case
return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "User fetched successfully"
        )
    )
```

This makes error handling and client responses predictable, easier to test, and simpler to extend later.

## Mongoose pipeline operation

- A Mongoose pipeline uses MongoDB aggregation stages to transform and filter documents in a sequence.
- This is useful for complex queries like grouping, projecting, sorting, or joining data.
- In this project, `src/models/video.model.js` installs `mongoose-aggregate-paginate-v2`, which can build aggregation stages before paging results.

## Mongoose pagination

- Pagination splits large result sets into pages so the app only fetches a limited number of documents at once.
- It improves performance and reduces memory use for list endpoints.
- Here the project uses `mongoose-aggregate-paginate-v2` with the video model to return paged aggregation results.

## Mongoose middleware hooks

- Mongoose hooks are functions that run before or after model operations like `save`, `validate`, or `remove`.
- They let you add pre-processing or validation logic directly on the schema.
- Smallest syntax example:

```js
UserSchema.pre("save", async function (next) {
  // runs before saving a user document
  next()
})
```

- This project uses a pre-save hook in `src/models/user.model.js` to run logic before a user is saved.

## Custom instance methods in Mongoose documents

- Custom instance methods are functions defined on `schema.methods` and available on each document.
- They keep model behavior close to the data, so you can call `user.isPasswordCorrect(...)` or `user.generateAccessToken()`.
- Smallest syntax example:

```js
UserSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`
}
```

- In the project, `src/models/user.model.js` defines methods like `isPasswordCorrect` and `generateAccessToken`.

## Access token and refresh token

- Access token: a short-lived JWT used to authenticate API requests and protect routes.
- Refresh token: a longer-lived JWT used to request a new access token after the old one expires.
- Keeping them separate improves security by limiting how long a leaked access token remains valid and allowing refreshes without forcing the user to log in again.
- In this project, both tokens are generated in `src/controllers/user.controllers.js` and verified in `src/middlewares/auth.middleware.js`.

### Why use both tokens?

- An access token is used frequently for normal API requests and should expire quickly.
- A refresh token is used less often and can live longer so the user does not need to log in again every time the access token expires.
- If an access token is stolen, it becomes useless after a short period.
- If a user logs out, the refresh token can be removed from the database so future refresh attempts are rejected.

### Login flow in this project

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

## File Upload Flow

This project uses **Multer** for handling file uploads and **Cloudinary** for cloud storage.

### Upload Flow

```
Client
  |
  | multipart/form-data
  ↓
Multer Middleware (diskStorage)
  |
  | Temporary local storage
  ↓
Cloudinary Upload Utility
  |
  ↓
Cloudinary Cloud Storage
  |
  ↓
Store Cloudinary URL in Database
```

### Why use Multer `diskStorage`?

Files are first stored temporarily on the server using Multer's `diskStorage` before uploading to Cloudinary.

Reasons:
- Provides a temporary file path that can be passed to Cloudinary.
- Prevents keeping large files in server memory (unlike `memoryStorage`).
- Allows file processing or validation before cloud upload.
- Makes upload handling more reliable for larger files.

After successful upload, the temporary local file should be removed to avoid unnecessary disk usage.

### Cloudinary Upload Utility

The utility handles:
- Uploading files from local temporary storage to Cloudinary.
- Supporting different file types using `resource_type: "auto"`.
- Cleaning up local files if the upload fails.

Flow:

```
Local File
    |
    ↓
cloudinary.uploader.upload()
    |
    ↓
Cloudinary URL
    |
    ↓
Database Storage
```

<div style="overflow-x:auto">

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
