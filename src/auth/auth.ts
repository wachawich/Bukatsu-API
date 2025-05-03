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

// const users: { id: number; username: string; password: string }[] = [];

export const registerUser = async (req: Request, res: Response) => {

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

  const passwordHasing = await hashPasswordWithSalt(password)
  const username = email.split('@')[0];

  // เอา email ไปทำ OTP





  // OTP section ถ้าผ่านทำต่อ ถ้าไม่ผ่าน return error

  const query = `
    INSERT INTO user_sys (username, email, user_first_name, user_last_name, password, sex, role_id, org_id)
    VALUES ('${username}', '${email}', '${user_first_name}', '${user_last_name}', '${passwordHasing}', '${sex}' , ${role_id}, ${org_id})
    RETURNING *;
  `;

  const userData = await queryPostgresDB(query, globalSmartGISConfig);
  const userSysID = userData[0]['user_sys_id']

  const subjectEntries = Object.values(subject); // [19, 23]
  const subjectInsertValues = subjectEntries
    .map(subject_id => `(${userSysID}, ${subject_id}, true)`)
    .join(", ");

  const subjectInsertQuery = `
    INSERT INTO subject_interest_normalize (user_sys_id, subject_id, flag_valid)
    VALUES ${subjectInsertValues};
  `;

  const subjectInData = await queryPostgresDB(subjectInsertQuery, globalSmartGISConfig);

  const activityTypeEntries = Object.values(activity_type); // [19, 23]
  const activityTypeInsertValues = activityTypeEntries
    .map(activity_type_id => `(${userSysID}, ${activity_type_id}, true)`)
    .join(", ");

  const activityTypeInsertQuery = `
    INSERT INTO activity_interest_normalize (user_sys_id, activity_type_id, flag_valid)
    VALUES ${activityTypeInsertValues};
  `;

  const activityTypetInData = await queryPostgresDB(activityTypeInsertQuery, globalSmartGISConfig);


  // console.log("req.body", req.body)
  // console.log('passwordHasing', passwordHasing, username, query)
  console.log("query", query, "\n\n\n", subjectInsertQuery, activityTypeInsertQuery)

  res.status(200).json({ success: true, subjectInData, activityTypetInData, userData  });

  // res.status(200).json({ success: true, query });

};



export const loginUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;
};

export const resetPassword = async (req : Request , res: Response) => {

}