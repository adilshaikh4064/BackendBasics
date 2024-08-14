import { aysncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from '../utils/ApiResponse.js';


const registerUser = aysncHandler(async (req, res) => {
    //1.take the data from the users from frontend.
    //2.check the validation of all the data provided with their respective datatypes feild.
    //3.if user is already registered, return it withour registering
    //4.check for image,avatar.
    //5.if found upload it on cloudinary and keep the url.(check if avatar is uploaded or not)
    //6.create user object-create entry in db.
    //7.remove password and refresh token field from response
    //8.check for user creation.
    //9.return result.

    const { fullName, email, username, password } = req.body
    
    if (
        [fullName,email,username,password].some((field)=>(field?.trim()===""))
    ) {
        throw new ApiError(400, "All fields are required");
    }
    
    const existedUser=User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "email or username already registered");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user=await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage ?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

export {
    registerUser,
}