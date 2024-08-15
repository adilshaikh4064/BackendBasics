import { aysncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from '../utils/ApiResponse.js';


const generateAccessAndRefreshTokens = async (userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        User.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refresh tokens");
    }
}


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
    
    const existedUser=await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "email or username already registered");
    }

    //console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0) {
        coverImageLocalPath = req.files.coverImage[0].path;
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

const loginUser = aysncHandler(async (req, res) => {
    //gather the user credential from req body of frontend.(req body)
    //check the validation of given data(it must be not empty or must be following the rules of input fields).(username or email)
    //if the user is not registered return the sign up page.(find the user)
    // else verify the credentials of user .(password check)
    //if found correct return the success message.(access and refresh token)
    //send cookies
    //else return the error.(wrong password)

    const { username, email, password } = req.body;
    if (!username || !email) {
        throw new ApiError(400, "username or email is required");
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if (!user) {
        throw new ApiError(404, "User doesn't exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(404, "password incorrect");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");
    
    const option = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken,option)
        .cookie("refresToken", refreshToken,option)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged in successfully"
            )
        )   
})

const logoutUser = aysncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    );

    const option = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(
            new ApiResponse(200, {}, "User logged out successfully")
        );
})

export {
    registerUser,
    loginUser,
    logoutUser,
}