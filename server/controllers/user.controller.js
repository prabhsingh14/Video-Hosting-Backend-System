import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/Cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    const {fullName, email, username, password} = req.body
    
    if(
        [fullName, email, username, password].includes(undefined) ||
        [fullName, email, username, password].includes("") ||
        [fullName, email, username, password].includes(null)
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({
        $or: [
            {username},
            {email}
        ]
    })

    if(existingUser){
        throw new ApiError(409, "User already exists")  
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    console.log("Avatar Path:", avatarLocalPath);
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(500, "Error uploading avatar")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        username: username.toLowerCase(),
        password
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser){
        throw new ApiError(500, "Error creating user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User created successfully")
    )
})

export { registerUser }