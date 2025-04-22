import { Request, Response } from 'express';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db';

export const getActivityType = async (req: Request, res: Response) => {

    const {
        activity_type_id,
        activity_type_name,
    } = req.body

    let query = ``;

    query += 'SELECT * FROM activity_type at  \n'
    query += 'WHERE at.activity_type_id > 0  \n'

    if (activity_type_id) {
        query += `AND at.activity_type_id = ${activity_type_id}  \n`
    }
    if (activity_type_name) {
        query += `AND at.activity_type_name = ${activity_type_name}  \n`
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

