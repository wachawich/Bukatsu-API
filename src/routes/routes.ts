import express from "express";
import { registerUser, loginUser } from "../auth/auth";
import { getUser } from "../logic/user"
import { getOrg } from "../logic/org"
import { getRole } from "../logic/role"
import { getFav } from "../logic/favorite"
import { getActivityType, createActivityType } from "../logic/activity_type"
import { getActivity, createActivity } from "../logic/activity"
import { getLocation } from "../logic/location"
import { getSubject } from "../logic/subject"

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// User Sys
router.post("/users.get", getUser);


// Org
router.post("/org.get", getOrg)


// Role
router.post("/role.get", getRole)


// Favorite
router.post("/fav.get", getFav)


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


export default router;
