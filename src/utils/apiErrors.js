class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong...",
        errors=[],
        stack=""
    ){
        super(message) // always overwrite message as default doesn't say anything about errors
        this.statusCode=statusCode
        this.data=null
        this.stack=stack
        this.errors=errors
        
        if (stack) {
            this.stack=stack
        } else {
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}