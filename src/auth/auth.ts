import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Pool } from 'pg';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db';

const hashPasswordWithSalt = async (plainPassword: string) => {
  const saltNumber = process.env.SALTNUMBER
  const combined = plainPassword + saltNumber;
  const hashed = await bcrypt.hash(combined, 10);
  return hashed
};

const verifyPasswordWithSalt = async (plainPassword: string, hashedPassword: string) => {
  const saltNumber = process.env.SALTNUMBER;
  const combined = plainPassword + saltNumber;
  const isMatch = await bcrypt.compare(combined, hashedPassword);
  return isMatch;
};

// const users: { id: number; username: string; password: string }[] = [];

const checkEmailAlreadyUse = async (email : string) => {
  
  const query = `
    select * from user_sys \n
    where email = '${email}'
  `

  const userData = await queryPostgresDB(query, globalSmartGISConfig);

  if (userData.length > 0) {
    return true
  } else {
    return false
  }

}

export const registerUser = async (req: Request, res: Response) => {
  try {
    const {
      email,
      user_first_name,
      user_last_name,
      password,
      role_id,
      org_id,
      subject,
      sex,
      activity_type,
    } = req.body;

    const emailIsUse = await checkEmailAlreadyUse(email);

    if (emailIsUse){
      res.status(500).json({ success: false, message: "Email Already Used!" });
      return
    }

    const passwordHasing = await hashPasswordWithSalt(password);
    const username = email.split('@')[0];

    const query = `
      INSERT INTO user_sys (username, email, user_first_name, user_last_name, password, sex, role_id) \n
      VALUES ('${username}', '${email}', '${user_first_name}', '${user_last_name}', '${passwordHasing}', '${sex}', ${role_id}) \n
      RETURNING *;
    `;

    const userData = await queryPostgresDB(query, globalSmartGISConfig);
    const userSysID = userData[0]?.user_sys_id;

    if (!userSysID) {
      throw new Error("Failed to create user.");
    }

    // Subject normalize
    const subjectEntries = Object.values(subject); // [19, 23]
    const subjectInsertValues = subjectEntries
      .map(subject_id => `(${userSysID}, ${subject_id}, true)`)
      .join(", ");

    const subjectInsertQuery = `
      INSERT INTO subject_interest_normalize (user_sys_id, subject_id, flag_valid) \n
      VALUES ${subjectInsertValues} \n
      RETURNING *;
    `;

    await queryPostgresDB(subjectInsertQuery, globalSmartGISConfig);

    // Activity type normalize
    const activityTypeEntries = Object.values(activity_type); // [19, 23]
    const activityTypeInsertValues = activityTypeEntries
      .map(activity_type_id => `(${userSysID}, ${activity_type_id}, true)`)
      .join(", ");

    const activityTypeInsertQuery = `
      INSERT INTO activity_interest_normalize (user_sys_id, activity_type_id, flag_valid) \n
      VALUES ${activityTypeInsertValues} \n
      RETURNING *;
    `;

    await queryPostgresDB(activityTypeInsertQuery, globalSmartGISConfig);

    // Success
    console.log("query", query, "\n\n\n", subjectInsertQuery, activityTypeInsertQuery);
    res.status(200).json({ success: true, message: "Register Successfully!" });

  } catch (error: any) {
    res.status(500).json({ success: false, message: "Register failed", error: error.message });
  }
};




export const loginUser = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const JWT_SECRET : any = process.env.JWT_SECRET

    // 1. Find user by username or email
    const userQuery = `
      SELECT u.*, r.*, o.* 
      FROM user_sys u
      LEFT JOIN role r ON u.role_id = r.role_id
      LEFT JOIN org o ON u.org_id = o.org_id
      WHERE u.username = '${username}' OR u.email = '${username}'
      LIMIT 1
    `;

    const usersData = await queryPostgresDB(userQuery, globalSmartGISConfig);

    if (usersData.length === 0) {
      res.status(401).json({ success: false, message: "User not found" });
      return
    }

    const user = usersData[0];

    // 2. Verify password with salt
    const isMatch = await verifyPasswordWithSalt(password , user.password)

    if (!isMatch) {
      res.status(401).json({ success: false, message: "Incorrect password" });
      return
    }

    // 3. Exclude password from user object
    const { password: _, ...userData } = user;

    // 4. Generate JWT token
    const token = jwt.sign(
      {
        ...userData, // ใช้ทั้งหมด ยกเว้น password
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 5. Return token and user data
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userData.email,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};



export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and new password are required" });
      return
    }

    const passwordHasing = await hashPasswordWithSalt(password)

    const query = `
      UPDATE user_sys
      SET password = '${passwordHasing}'
      WHERE email = '${email}'
      RETURNING email;
    `;

    const result = await queryPostgresDB(query, globalSmartGISConfig);

    if (result.length === 0) {
      res.status(404).json({ success: false, message: "Email not found" });
      return
    } else {
      res.status(200).json({ success: true, message: "Password reset successfully" });
    }
  } catch (error) {
    // console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


export const changePassword = async (req: Request, res: Response) => {
  try {
    const { user_sys_id, old_password, new_password } = req.body;

    if (!user_sys_id || !old_password || !new_password) {
      res.status(400).json({ success: false, message: "Email and new password are required" });
      return
    }

    const query = `
      SELECT * FROM user_sys
      WHERE user_sys_id = ${user_sys_id}
    `

    const userData = await  queryPostgresDB(query, globalSmartGISConfig);
    if (userData.length <= 0) {
      res.status(404).json({ success: false, message: "User not found" });
      return
    }

    const passwordUserData = userData[0]['password']

    const isMatch = await verifyPasswordWithSalt(old_password , passwordUserData)

    if (isMatch){
      const passwordHasing = await hashPasswordWithSalt(new_password)

      const updateQuery = `
        UPDATE user_sys
        SET password = '${passwordHasing}'
        WHERE user_sys_id = '${user_sys_id}'
        RETURNING user_sys_id;
      `

      const result = await queryPostgresDB(updateQuery, globalSmartGISConfig);

      res.status(200).json({ success: true, message: `Update password successfully!` });
    } else {
      res.status(400).json({ success: true, message: `Your password does not match.!` });
      return
    }

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};