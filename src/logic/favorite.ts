import { Request, Response } from 'express';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db';

export const getFav = async (req: Request, res: Response) => {

    const {
        user_sys_id,
        activity_id,
    } = req.body

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

    console.log(query)


    try {
        const data = await queryPostgresDB(query, globalSmartGISConfig);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }

}

