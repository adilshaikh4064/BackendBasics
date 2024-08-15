import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import jwt from "jsonwebtoken";
import { User } from '../models/user.models.js';

//if value is never used , it can be replaced with _ : res=>_
export const verifyJWT = asyncHandler(async (_, req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
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