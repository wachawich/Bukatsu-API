import { Request, Response } from 'express';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db';

export const getFav = async (req: Request, res: Response) => {

  const {
    user_sys_id,
    activity_id,
    flag_valid,
  } = req.body

  if (!user_sys_id && !activity_id && !flag_valid) {
    res.status(400).json({ success: false, message: 'No value Input' });
  }
  // console.log(req.body)

  let query = ``;

  query += 'SELECT * FROM favorite_normalize fn  \n'
  query += 'WHERE fn.user_sys_id > 0  \n'

  if (user_sys_id) {
    query += `AND fn.user_sys_id = ${user_sys_id}  \n`
  }
  if (activity_id) {
    query += `AND fn.activity_id = ${activity_id}  \n`
  }
  if (flag_valid) {
    query += `AND fn.flag_valid = ${flag_valid} \n`
  }

  console.log(query)


  try {
    const data = await queryPostgresDB(query, globalSmartGISConfig);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ success: false, message: 'Error fetching data' });
  }

}


export const createFav = async (req: Request, res: Response) => {
  const {
    user_sys_id,
    activity_id,
  } = req.body;

  if (!user_sys_id || !activity_id) {
    res.status(400).json({ success: false, message: 'user_sys_id and activity_id are required' });
  }

  const query = `
      INSERT INTO favorite_normalize (user_sys_id, activity_id, flag_valid)
      VALUES (${user_sys_id}, ${activity_id}, true)
      RETURNING *;
    `;

  console.log(query);

  try {
    const data = await queryPostgresDB(query, globalSmartGISConfig);
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ success: false, message: 'Error inserting data' });
  }
};


// export const updateFav = async (req: Request, res: Response) => {
//   const {
//     user_sys_id,
//     activity_id,
//     flag_valid,
//   } = req.body;

//   if (!user_sys_id || !activity_id || typeof flag_valid !== 'boolean') {
//     res.status(400).json({
//       success: false,
//       message: 'user_sys_id, activity_id, and flag_valid (boolean) are required',
//     });
//   }

//   const query = `
//       UPDATE favorite_normalize
//       SET flag_valid = ${flag_valid}
//       WHERE user_sys_id = ${user_sys_id}
//       AND activity_id = ${activity_id}
//       RETURNING *;
//     `;

//   console.log(query);

//   try {
//     const data = await queryPostgresDB(query, globalSmartGISConfig);
//     res.status(200).json({ success: true, data });
//   } catch (error) {
//     console.error('Error updating data:', error);
//     res.status(500).json({ success: false, message: 'Error updating data' });
//   }
// };

export const updateFav = async (req: Request, res: Response) => {
  const { user_sys_id, activity_id, flag_valid } = req.body;

  if (!user_sys_id || !activity_id || typeof flag_valid !== 'boolean') {
    res.status(400).json({
      success: false,
      message: 'user_sys_id, activity_id, and flag_valid (boolean) are required',
    });
    return;
  }

  try {
    // ตรวจสอบว่ามี record นี้อยู่หรือยัง
    const checkQuery = `
      SELECT * FROM favorite_normalize
      WHERE user_sys_id = ${user_sys_id}
      AND activity_id = ${activity_id};
    `;
    const existing = await queryPostgresDB(checkQuery, globalSmartGISConfig);

    let query = '';

    if (existing.length > 0) {
      // ถ้ามีแล้ว → UPDATE
      query = `
        UPDATE favorite_normalize
        SET flag_valid = ${flag_valid}
        WHERE user_sys_id = ${user_sys_id}
        AND activity_id = ${activity_id}
        RETURNING *;
      `;
    } else {
      // ถ้าไม่มี → INSERT
      query = `
        INSERT INTO favorite_normalize (user_sys_id, activity_id, flag_valid)
        VALUES (${user_sys_id}, ${activity_id}, ${flag_valid})
        RETURNING *;
      `;
    }

    console.log('Query:', query);

    const data = await queryPostgresDB(query, globalSmartGISConfig);
    res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ success: false, message: 'Error updating or inserting data' });
  }
};




