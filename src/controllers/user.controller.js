import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUSer = asyncHandler( async (req, res) => {
    
    const {username, email, fullname, password} = req.body
    
    if(
        [username, email, fullname, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existingUser =await User.findOne({
    
        $or: [{email},{username}]
    }
    )
    if(existingUser){
        throw new ApiError(409, "User already exists with this email or username")
    }

    const avatarPath = req.files?.avatar?.[0]?.path;
    const coverImagePath = req.files?.coverImage?.[0]?.path;

    if(!avatarPath){
        throw new ApiError(400, "Avatar image is required")
    }

    const avatar = await uploadOnCloudinary(avatarPath);
    const coverImage = await uploadOnCloudinary(coverImagePath);

    if(!avatar){
        throw new ApiError(500, "Failed to upload avatar image")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullname,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser){
        throw new ApiError(500, "Failed to create user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )
    
})

export {registerUSer}