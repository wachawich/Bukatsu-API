import { Request, Response } from "express";
import { queryPostgresDB, globalSmartGISConfig } from '../config/db';
import { OTPFunction } from "./mailer";
import crypto from "crypto";

const otpStore: Record<string, { otp: string; expiresAt: number }> = {};


export const sendOTP = async (req: Request, res: Response) => {
    const { email } = req.body;

    // if (!email) return res.status(400).json({ message: "Email is required" });

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore[email] = { otp, expiresAt };

    try {
        const otpData = await OTPFunction(email, otp);
        console.log("otp", otp)
        res.status(200).json({ success: true, message: "OTP sent to email" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
};

export const verifyOTP = async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const record = otpStore[email];

    if (!record) {
        res.status(400).json({ success: false, message: "No OTP sent to this email" });
    }
    else if (Date.now() > record.expiresAt) {
        res.status(400).json({ success: false, message: "OTP expired" });
    }
    else if (otp !== record.otp) {
        res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    else {
        delete otpStore[email];
        res.status(200).json({ success: true, message: "OTP verified successfully" });
    }
};
