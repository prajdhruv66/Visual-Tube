import { Router } from "express";
import { toggleSubscribe, getSubscribedChannel } from "../controllers/subscription.controller";
import { verifyJwt } from "../middlewares/auth.middleware";


const SubscriptionRouter = Router()

SubscriptionRouter.route('/subscriptions/:channelId').post(verifyJwt,toggleSubscribe);
SubscriptionRouter.route('/subscription').get(verifyJwt,getSubscribedChannel);

export default SubscriptionRouter