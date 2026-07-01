import { Router } from "express";
import { toggleSubscribe, getSubscribedChannel } from "../controllers/subscription.controller";
import { verifyJwt } from "../middlewares/auth.middleware";


const SubscriptionRouter = Router()

SubscriptionRouter.route('/togglesubscribe/:channelId').post(verifyJwt,toggleSubscribe);
SubscriptionRouter.route('/get-subscribed-channel').get(verifyJwt,getSubscribedChannel);