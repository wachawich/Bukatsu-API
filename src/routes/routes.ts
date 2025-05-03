import express from "express";
import { registerUser, loginUser, resetPassword, changePassword } from "../auth/auth";
import { getUser, updateUser } from "../logic/user"
import { getOrg } from "../logic/org"
import { getRole } from "../logic/role"
import { getFav, createFav, updateFav } from "../logic/favorite"
import { getActivityType, createActivityType } from "../logic/activity_type"
import { getActivity, createActivity } from "../logic/activity"
import { getLocation } from "../logic/location"
import { getSubject } from "../logic/subject"

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


// Favorite
router.post("/fav.get", getFav)
router.post("/fav.create", createFav)
router.post("/fav.update", updateFav)


// Activity
router.post("/activity.get", getActivity)
router.post("/create_activity.post", createActivity)


// Activity Type
router.post("/activity_type.get", getActivityType)
router.post("/create_activity_type.post", createActivityType)


// Subject
router.post("/subject.get", getSubject)


// Location
router.post("/location.get", getLocation)


//otp
// router.post("/otp.send", sendOTP)
// router.post("/otp.verify", verifyOTP)

export default router;
