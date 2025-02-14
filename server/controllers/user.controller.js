import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary, deleteImageFromStorage} from "../utils/Cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) => {
    try{
        const user = await User.findById(userId)
        if(!user){
            throw new ApiError(404, "User not found")
        }

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    } catch(error){
        throw new ApiError(500, "Error generating tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    try {
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
    } catch (error) {
        throw new ApiError(500, "Error creating user")
    }
})

const loginUser = asyncHandler(async (req, res) => {
    try {
        const {email, username, password} = req.body
        if(!(email || username)){
            throw new ApiError(400, "Email or username is required")
        }
    
        if(!password){
            throw new ApiError(400, "Password is required")
        }
    
        const user = await User.findOne({
            $or: [
                {email},
                {username}
            ]
        })
    
        if(!user){
            throw new ApiError(404, "User not found")
        }
    
        const isPasswordValid = await user.isPasswordCorrect(password)
        if(!isPasswordValid){
            throw new ApiError(401, "Invalid password")
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken
            }, "User logged in successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error logging in user")
    }
})

const logoutUser = asyncHandler(async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            $set: {
                refreshToken: undefined
            },
        },{ new: true })
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(
            new ApiResponse(200, {}, "User logged out successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error logging out user")
    }
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request!")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        if(!decodedToken){
            throw new ApiError(401, "Unauthorized request!")
        }
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(404, "User not found")
        }
    
        if(user.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, "Refresh token revoked")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options).json(
            new ApiResponse(200, {
                accessToken,
                refreshToken: newRefreshToken
            }, "Access token refreshed successfully")
        )
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token!")
    }
})

const changePassword = asyncHandler(async (req, res) => {
    try {
        const {oldPassword, newPassword, confirmNewPassword} = req.body
        if(!oldPassword || !newPassword || !confirmNewPassword){
            throw new ApiError(400, "All fields are required")
        }
    
        if(newPassword !== confirmNewPassword){
            throw new ApiError(400, "Passwords do not match")
        }
    
        const user = await User.findById(req.user._id)
        if(!user){
            throw new ApiError(404, "User not found")
        }
    
        if(!await user.isPasswordCorrect(oldPassword)){
            throw new ApiError(400, "Invalid old password")
        }
    
        user.password = newPassword
        await user.save({ validateBeforeSave: false })
    
        return res.status(200).json(
            new ApiResponse(200, {}, "Password changed successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error changing password")
    }
})

const getCurrentUser = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password -refreshToken")
        if(!user){
            throw new ApiError(404, "User not found")
        }
    
        return res.status(200).json(
            new ApiResponse(200, user, "User fetched successfully, password not shown due to security reasons")
        )
    } catch (error) {
        throw new ApiError(500, "Error fetching user")
    }
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    try {
        const {fullName, email, username} = req.body
        if(
            [fullName, email, username].includes(undefined) ||
            [fullName, email, username].includes("") ||
            [fullName, email, username].includes(null)
        ){
            throw new ApiError(400, "All fields are required")
        }
    
        const user = await User.findById(req.user._id)
        if(!user){
            throw new ApiError(404, "User not found")
        }
        
        const oldAvatar = user.avatar;
        
        user.fullName = fullName
        user.email = email
        user.username = username

        if(avatar) user.avatar = avatar;

        await user.save({ validateBeforeSave: false })
        
        if(avatar && oldAvatar){
            await deleteImageFromStorage(oldAvatar);
        }

        return res.status(200).json(
            new ApiResponse(200, {}, "Account details updated successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error updating account details")
    }
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    try {
        const avatarLocalPath = req.file?.path;
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar is required");
        }
        
        const user = await User.findById(req.user._id)
        if(!user){
            throw new ApiError(404, "User not found")
        }
    
        const avatar = await uploadOnCloudinary(avatarLocalPath)
        if(!avatar.url){
            throw new ApiError(500, "Error uploading avatar")
        }
    
        await User.findByIdAndUpdate(req.user?._id, {
            $set: {
                avatar: avatar.url
            },
        },{ new: true }).select("-password -refreshToken")
    
        return res.status(200).json(
            new ApiResponse(200, {}, "Avatar updated successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error updating avatar")
    }
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    try {
        const coverImageLocalPath = req.file?.path;
        if (!coverImageLocalPath) {
            throw new ApiError(400, "Cover Image is required");
        }
        
        const user = await User.findById(req.user._id)
        if(!user){
            throw new ApiError(404, "User not found")
        }
    
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)
        if(!coverImage.url){
            throw new ApiError(500, "Error uploading cover image")
        }
    
        await User.findByIdAndUpdate(req.user?._id, {
            $set: {
                coverImage: coverImage.url
            },
        },{ new: true }).select("-password -refreshToken")
    
        return res.status(200).json(
            new ApiResponse(200, {}, "Cover Image updated successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error updating cover image")
    }
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    try {
        const {username} = req.params
        if(!username){
            throw new ApiError(400, "Username is required")
        }

        const channel = await User.aggregate([
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            {
                $addFields: {
                    subscriberCount: { $size: "$subscribers" },
                    subscribedToCount: { $size: "$subscribedTo" },
                    isSubscribed: {
                        $cond: {
                            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    email: 1,
                    fullName: 1,
                    username: 1,
                    subscriberCount: 1,
                    subscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                }
            }
        ])

        if(!channel?.length){
            throw new ApiError(404, "Channel not found")
        }

        return res.status(200).json(
            new ApiResponse(200, channel[0], "Channel fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error fetching channel")
    }

})

const getWatchHistory = asyncHandler(async (req, res) => {
    try {
        const user = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user._id) // req.user._id -> it returns a string, so we need to convert it to ObjectId
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",

                                pipeline: [
                                    {
                                        $project: {
                                            fullName: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner: { 
                                    $first: "$owner"
                                }
                            }
                        },
                    ]
                }
            }
        ])

        if(!user?.length){
            throw new ApiError(404, "User not found")
        }

        return res.status(200).json(
            new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error fetching watch history")
    }
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}