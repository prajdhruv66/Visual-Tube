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

This makes error handling and client responses predictable, easier to test, and simpler to extend later.}
