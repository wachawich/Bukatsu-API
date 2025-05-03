import express from "express";

import { sendOTP, verifyOTP } from "../auth/otp";

const OTProuter = express.Router();

OTProuter.post("/otp.send", sendOTP)
OTProuter.post("/otp.verify", verifyOTP)


export default OTProuter;
