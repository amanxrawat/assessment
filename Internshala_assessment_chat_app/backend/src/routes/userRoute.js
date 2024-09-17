import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import { signUpUser, 
    sendFriendRequest,      
    unfriend , 
    acceptFriendRequest , 
    rejectFriendRequest,
    recommendFriends, 
    loginUser,
    getFriends} from "../controllers/user.contollers.js";

const router = Router();

router.route('/signUp').post(signUpUser)
router.route('/login',loginUser)


router.route('/friend-request/:recipientID').post(verifyJWT,sendFriendRequest);
router.route('/accept-friend/:senderId').post(verifyJWT,acceptFriendRequest);
router.route('/reject-friend/:senderId').post(verifyJWT,rejectFriendRequest);
router.route('/unfriend/:friendId').delete( verifyJWT, unfriend);

router.route('/friends').get(verifyJWT,getFriends);

router.route('/recommendations').get(verifyJWT,recommendFriends);

export default router   