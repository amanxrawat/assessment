import { Router } from "express";
import { signUpUser, 
    generateAccessToken ,
    sendFriendRequest,      
    unfriend , 
    acceptFriendRequest , 
    rejectFriendRequest,
    recommendFriends } from "../controllers/user.contollers.js";

const router = Router();

router.route('/signUp').post(signUpUser)

export default router