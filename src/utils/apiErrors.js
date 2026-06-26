class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong...",
        errors=[],
        statck=""
    ){
        super(message) // always overwrite message as default doesn't say anything about errors
        this.statusCode=statusCode
        this.data=null
        this.statck=statck
        this.errors=errors
        
        if (statck) {
            this.stack=stack
        } else {
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}