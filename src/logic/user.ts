import { Request, Response } from 'express';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db'; 
import { error } from 'console';

export const getUser = async (req: Request, res: Response) => {

  const {
    user_sys_id,
    user_first_name,
    user_last_name,
    username,
    org_id,
    role_id,
    sex,
    phone,
    email,
  } = req.body

  if (
    !user_sys_id &&
    !user_first_name &&
    !user_last_name &&
    !username &&
    !org_id &&
    !role_id &&
    !sex &&
    !phone &&
    !email){
      throw new Error("No value input!");
    }

  // console.log(req.body)

  let query = ``;

  query += 'SELECT * FROM user_sys us \n'
  query += 'LEFT JOIN role r ON r.role_id = us.role_id \n'
  query += 'LEFT JOIN org o ON o.org_id = us.org_id \n'
  query += 'WHERE us.user_sys_id > 0 \n'

  if (user_sys_id){
    query += `AND us.user_sys_id = ${user_sys_id} \n`
  }
  if (user_first_name){
    query += `AND us.user_first_name = ${user_first_name}  \n`
  }
  if (user_last_name){
    query += `AND us.user_last_name = ${user_last_name}  \n`
  }
  if (username){
    query += `AND us.username = ${username}  \n`
  }
  if (org_id){
    query += `AND us.org_id = ${org_id}  \n`
  }
  if (role_id){
    query += `AND us.role_id = ${role_id}  \n`
  }
  if (sex){
    query += `AND us.sex = ${sex}  \n`
  }
  if (phone){
    query += `AND us.phone = ${phone}  \n`
  }
  if (email){
    query += `AND us.email = ${email}  \n`
  }

  console.log(query)


  try {
    const data = await queryPostgresDB(query, globalSmartGISConfig);  
    res.status(200).json({ success: true, data });  
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ success: false, message: 'Error fetching data' });
  }
};

