import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";


const generateAccessToken = asyncHandler(async(user_id)=>{
    try {
      const user = User.findById(user_id);
      const accessToken = user.generateAccessToken();
      
      return {accessToken}
 
    } catch (error) {
     throw new ApiError(500,"something went wrong while creating  access token  for the user .")
    }
 
 })

const signUpUser = asyncHandler(async(req,res)=>{
    try {
        const {userName , email , password, interests } = req.body
    
        if(
            [userName,email,password].some((field)=>field?.trim ==='')
        ){
            throw new ApiError(400,"all fiels are required")
        };
    
        const existingUser = await User.findOne(
            {email}
        )
    
        if(existingUser){
            throw new ApiError(409,"user with email or user name alread exits")
        }
    
        const user = User.create({
            fullName,
            email,
            password,
            interests,
        })
    
        const createdUser = await User.findById(user._id).select(
            "-password "
        )
    
        if(!createdUser){
            throw ApiError(500,'something went wrong while registering the user')
        }
    
        return res.status(201).json(
            new ApiResponse(200,createdUser,"user registerd Successfully")
        )
    
    } catch (error) {
        console.log(error)
        throw new ApiError(400,"|| something went wrong while registering  the user ||")
   
    }
})

const loginUser = asyncHandler(async(req, res)=>{
  const {userName , password} = req.body

  if([email,password].some((field)=>field==="" )){
      throw new ApiError(400 , 
          "email,userName and password is needed to login pls enter email and password"
      )
  }

  const user = await User.findOne({ userName })
  const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
      throw new ApiError(401, "invalid user credentials ");
  }

  const {accessToken} = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password");
  const options ={
      httpOnly:true,
      secure:true
  }

  return res.status(200).cookie("accessToken",accessToken,options)
  .json(
      new ApiResponse(200,
          {
              user:loggedInUser,accessToken
          },
          "user logged in successfully"
      )
  )


})


const logoutUser = asyncHandler(async(req,res)=>{
    
  const options ={
      httpOnly:true,
      secure:true
  }

  return res.status(200)
  .clearCookie("accessToken",options)
  .json(new ApiResponse(200,{},"user logged out successfully"))
  
})

const getUser = asyncHandler(async(req,res)=>{
  const user = User.findById(req.user._id).select("-password")

  return res.status(200)
  .json(new ApiResponse(200,user,"||user fetched successfully ||"))

})


const sendFriendRequest = async (req, res) => {
    const { recipientId } = req.params;
    const senderId = req.user._id; 
  
    try {
      const sender = await User.findById(senderId);
      const recipient = await User.findById(recipientId);
  
      if (!recipient) return res.status(404).json(new ApiResponse(404,message="user not found "));
  
      if (recipient.friendRequestsReceived.includes(senderId)) {
        return res.status(400).json(new ApiResponse(400, message = 'Friend request already sent'));
      }
  
      recipient.friendRequestsReceived.push(senderId);
      sender.friendRequestsSent.push(recipientId);
  
      await recipient.save();
      await sender.save();
  
      return res.status(200).json(new ApiResponse(200," Friend request send successfully "));

    } catch (error) {
      console.log(error);
      throw new ApiError(500,"'Error sending friend request'")
    }
  };

const acceptFriendRequest = async (req, res) => {
    const { senderId } = req.params;
    const recipientId = req.user._id;
  
    try {
      const sender = await User.findById(senderId);
      const recipient = await User.findById(recipientId);
  
      if (!recipient.friendRequestsReceived.includes(senderId)) {
        return res.status(400).json(new ApiResponse(400,message = "No friend request found"
        ));
      }
  
      sender.friendList.push(recipientId);
      recipient.friendList.push(senderId);
  
      recipient.friendRequestsReceived = recipient.friendRequestsReceived.filter(
        (id) => id.toString() !== senderId
      );
      sender.friendRequestsSent = sender.friendRequestsSent.filter(
        (id) => id.toString() !== recipientId
      );
  
      await sender.save();
      await recipient.save();
  
      res.status(200).json(new ApiResponse(200,message="friend request accepted"));
    } catch (error) {
      console.log(error);
      throw new ApiError(400,"error while accepting the friend request ")
    }
  };

  
const rejectFriendRequest = async (req, res) => {
    const { senderId } = req.params;
    const recipientId = req.user._id;
  
    try {
      const recipient = await User.findById(recipientId);
  
      recipient.friendRequestsReceived = recipient.friendRequestsReceived.filter(
        (id) => id.toString() !== senderId
      );
  
      await recipient.save();
  
      res.status(200).json(new ApiResponse(200,message="rejected the freind request"));
    } catch (error) {
      console.log(error)
      throw new ApiError(500,"Error rejecting friend request ")
    }
  };
  
const unfriend = async (req, res) => {
    const { friendId } = req.params;
  
    try {
      const user = await User.findById(req.user.id);
      const friend = await User.findById(friendId);
  
      if (!user || !friend) return res.status(404).json({ message: 'User not found' });
  
      user.friendList = user.friendList.filter((id) => id.toString() !== friendId);
      friend.friendList = friend.friendList.filter((id) => id.toString() !== req.user.id);
  
      await user.save();
      await friend.save();
  
      res.status(200).json(new ApiResponse(200,friend.userName,"unfriended successfully "));
    } catch (error) {
      console.log(error)
      throw new ApiError(500,"Error unfriending the user")
    }
  };

const recommendFriends = async (req, res) => {
    try {
      const user = await User.findById(req.user.id).populate('friendList');
  
      const recommendations = await User.find({
        _id: { $nin: [req.user.id, ...user.friendList.map(friend => friend._id)] }, // Exclude current user and friends
        friendList: { $in: user.friendList.map(friend => friend._id) }, // Mutual friends
      }).limit(5);
  
      res.status(200).json(new ApiResponse(200,recommendations,"friend recommendation for the user "));
    } catch (error) {
      console.log(error)
      throw new ApiError(500,"Error during  recommending friends to the user")
    }
  };
  

const getFriends = async (req, res) => {
    try {
      const user = await User.findById(req.user.id).populate('friendList', 'username');
  
      res.status(200).json(new ApiResponse(200,user.friendList,"successfully fetched the user's friend list "));
    } catch (error) {
      console.log(error)
      throw new ApiError(500,"Error reteriving friend list")
    }
  };
  

export {
  signUpUser,
  generateAccessToken ,
  loginUser,
  logoutUser, 
  getUser, 
  sendFriendRequest,
  recommendFriends, 
  unfriend, 
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends

  }