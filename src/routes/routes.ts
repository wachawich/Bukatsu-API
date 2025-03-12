import express from "express";
import { registerUser, loginUser, getUsers } from "../auth/auth";
import {testPullData}  from "../logic/testpull"

const router = express.Router();

// router.post("/register", registerUser);
// router.post("/login", loginUser);
// router.get("/users", getUsers);
router.get("/testpull", testPullData);

export default router;
