// asyncHandler is used to wrap each async function into try/catch block or promise block so that it doesn't look messy

const asyncHandler = (requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler())
        .catch((err)=>{next(err)})
    }
}

export {asyncHandler}

// const asyncHandler = (fn) => async (req,res,next) => {
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//      res.status(error.code||500)
//      .json({
//         success:false,
//         message: error.message
//      })   
//     }
// }