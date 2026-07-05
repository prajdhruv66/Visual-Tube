import { Router } from "express";
import { toggleSubscribe, getSubscribedChannel } from "../controllers/subscription.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";


const SubscriptionRouter = Router()

SubscriptionRouter.route('/:channelId').post(verifyJwt,toggleSubscribe);
SubscriptionRouter.route('/subscription').get(verifyJwt,getSubscribedChannel);

export default SubscriptionRouter