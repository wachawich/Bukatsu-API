import express from "express";
import { registerUser, loginUser, resetPassword, changePassword } from "../auth/auth";
import { getUser, updateUser } from "../logic/user"
import { getOrg } from "../logic/org"
import { getRole, createRole, updateRole } from "../logic/role"
import { getFav, createFav, updateFav } from "../logic/favorite"
import { getActivityType, createActivityType, updateActivityType } from "../logic/activity_type"
import { getActivity, createActivity, getMyActivity, updateActivity, deleteActivity , joinActivity, approveActivity } from "../logic/activity"
import { getLocation, createLocation, updateLocation } from "../logic/location"
import { getSubject, createSubject, updateSubject } from "../logic/subject"
import { getClub, uploadimageclub, createClub, updateClub, uploadPRImagesClub } from "../logic/club";
import { uploadMedia } from '../logic/image';
import {getImageClub} from '../logic/clubimage'
import { createImageProfile } from '../logic/genImageProfile'
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// import { sendOTP, verifyOTP } from "../auth/otp";


const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.post("/password.reset", resetPassword)
router.post("/password.change", changePassword)

// User Sys
router.post("/users.get", getUser);
router.post("/users.update", updateUser)


// Org
router.post("/org.get", getOrg)


// Role
router.post("/role.get", getRole)
router.post("/role.create", createRole)
router.post("/role.update", updateRole)


// Favorite
router.post("/fav.get", getFav)
router.post("/fav.create", createFav)
router.post("/fav.update", updateFav)


// Activity
router.post("/activity.get", getActivity)
router.post("/activity.update", updateActivity)
router.post("/activity.delete", deleteActivity)
router.post("/create_activity.post", createActivity)
router.post("/my_activity.get", getMyActivity)
// Join Activity
router.post("/join_activity", joinActivity)
router.post("/activity_approve", approveActivity)


// Activity Type
router.post("/activity_type.get", getActivityType)
router.post("/activity_type.post", createActivityType)
router.post("/activity_type.update", updateActivityType)


// Subject
router.post("/subject.get", getSubject)
router.post("/subject.create", createSubject)
router.post("/subject.update", updateSubject)


// Location
router.post("/location.get", getLocation)
router.post("/location.create", createLocation)
router.post("/location.update", updateLocation)

// club
router.post("/club.get", getClub)
router.post("/club.create", createClub)
router.post("/club.update", updateClub)
router.put("/club.put", upload.single('file'),uploadimageclub)
router.put('/club.uploadPrImage',upload.fields([{ name: 'square', maxCount: 1 },{ name: 'banner', maxCount: 1 },]),uploadPRImagesClub);
console.log(storage)

//club image
router.post("/clublink.get", getImageClub)
// router.post("/clublink.delete", deleteImageClub)

//image

router.put('/image.upload', upload.single('file'), uploadMedia);

router.post('/profile.gen', createImageProfile)

//otp
// router.post("/otp.send", sendOTP)
// router.post("/otp.verify", verifyOTP)

export default router;
