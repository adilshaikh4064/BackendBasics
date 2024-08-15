import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import jwt from "jsonwebtoken";
import { User } from '../models/user.models.js';

//if value is never used , it can be replaced with _ : res=>_
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        // const token =
        //     (typeof req.header("Authorization") === "string"
        //         ? req.header("Authorization").replace("Bearer ", "")
        //         : undefined) || req.cookies?.accessToken;

        if (!token) {
            throw new ApiError(401, "unauthorised request");
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id)
            .select("-password -refreshToken");
        
        if (!user) {
            // TODO: discuss about frontend in next video.
            throw new ApiError(401, "invalid access token");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
})