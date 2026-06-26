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

## Mongoose pipeline and pagination

- `src/models/video.model.js` (lines 2 and 43) uses `mongoose-aggregate-paginate-v2`.
- This plugin relies on MongoDB aggregation pipeline operations to build query stages and return paged results.
- Pagination avoids loading all documents at once and returns a subset of results with page metadata.

## Mongoose middleware hooks

- `src/models/user.model.js` (line 59) uses a Mongoose pre-save hook:

```js
UserSchema.pre("save", async function (next) {
  // run before saving the document
  next()
})
```

- Hooks let Mongoose run logic before/after actions like `save`, `remove`, `validate`, and more.

## Custom instance methods in Mongoose documents

- `src/models/user.model.js` defines document methods on `UserSchema.methods`.
- Example syntax from the file:

```js
UserSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password)
}

UserSchema.methods.generateAccessToken = function () {
  return jwt.sign(...)
}
```

- Instance methods keep model-specific behavior close to the document data.

## Access token and refresh token

- `src/models/user.model.js` (lines 72-88) defines both tokens with `jsonwebtoken`.
- Access token: short-lived JWT used for authenticated requests.
- Refresh token: longer-lived JWT used to issue a new access token when the old one expires.
- Storing these separately helps improve security and session management.}
