import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.enve.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        //upload file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })
        //file has been successfully uploaded on the cloudinary
        console.log("file is successfully uploaded", response.url);
        return response
    } catch (error) {
        //remove the locally saved temporary file as the upload operations got failed
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export { uploadOnCloudinary };