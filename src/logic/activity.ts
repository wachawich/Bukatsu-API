import { Request, Response } from 'express';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db';
import { error } from 'console';

export const getActivity = async (req: Request, res: Response) => {

    const {
        activity_id,
        title,
        create_date,
        start_date,
        end_date,
        status,
        create_by,
        location_id,
        location_name,
        location_type
    } = req.body

    if (
        !activity_id &&
        !title &&
        !create_date &&
        !start_date &&
        !end_date &&
        !status &&
        !create_by &&
        !location_id &&
        !location_name &&
        !location_type
    ) {
        throw new Error("No value input!");
    }

    let query = ``;

    query += 'SELECT * FROM activity a \n'
    query += 'LEFT JOIN location l ON l.location_id = a.location_id \n'
    query += 'WHERE a.activity_id > 0 \n'

    if (activity_id) {
        query += `AND a.activity_id = ${activity_id} \n`
    }
    if (title) {
        query += `AND a.title = ${title}  \n`
    }
    if (create_date) {
        query += `AND a.create_date = ${create_date}  \n`
    }
    if (start_date) {
        query += `AND a.start_date = ${start_date}  \n`
    }
    if (end_date) {
        query += `AND a.end_date = ${end_date}  \n`
    }
    if (status) {
        query += `AND a.status = ${status}  \n`
    }
    if (create_by) {
        query += `AND a.create_by = ${create_by}  \n`
    }
    if (location_id) {
        query += `AND a.location_id = ${location_id}  \n`
    }
    if (location_name) {
        query += `AND l.location_name = ${location_name}  \n`
    }
    if (location_type) {
        query += `AND l.location_type = ${location_type}  \n`
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



export const createActivity = async (req: Request, res: Response) => {

    const {
        activity_id,
        title,
        description,
        create_date,
        start_date,
        end_date,
        status,
        contact,
        user_count,
        price,
        user_property,
        remark,
        create_by,
        location_id,
    } = req.body

    if (
        !activity_id &&
        !title &&
        !description &&
        !create_date &&
        !start_date &&
        !end_date &&
        !status &&
        !contact &&
        !user_count &&
        !price &&
        !user_property &&
        !remark &&
        !create_by &&
        !location_id
    ) {
        throw new Error("No value input!");
    }

    if (!title || !create_by || !start_date || !end_date || !status || !location_id || !user_count) {
        // throw new Error("No value input require feild!");
        // return res.status(400).json({
        //     success: false,
        //     errors: [
        //       { message: "Missing required fields" }
        //     ]
        //   });
    }

    const escape = (val: any) => val === null || val === undefined ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`;

    const finalCreateDate = create_date || new Date().toISOString(); // 'YYYY-MM-DD'

    let query = ``;

    query += `
    INSERT INTO activity (
        title, description, create_date,
        start_date, end_date, status, contact,
        user_count, price, user_property, remark,
        create_by, location_id
    ) VALUES (
        ${title ? `'${title}'` : 'NULL'},
        ${description ? `'${description}'` : 'NULL'},
        '${finalCreateDate}', 
        ${start_date ? `'${start_date}'` : 'NULL'},
        ${end_date ? `'${end_date}'` : 'NULL'},
        ${status ? `'${status}'` : 'NULL'},
        ${contact ? `'${contact}'` : 'NULL'},
        ${user_count ?? 'NULL'},
        ${price ?? 'NULL'},
        ${user_property ? `'${user_property}'` : 'NULL'},
        ${remark ? `'${remark}'` : 'NULL'},
        ${create_by ? `${create_by}` : 'NULL'},
        ${location_id ?? 'NULL'}
    )
    RETURNING *;
    `;

    console.log(query)


    try {
        const data = await queryPostgresDB(query, globalSmartGISConfig);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
};


