import { Request, Response } from 'express';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db';

export const getActivityType = async (req: Request, res: Response) => {

    const {
        activity_type_id,
        activity_type_name,
        show,
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
    if (show) {
        query += `AND at.show = ${show}  \n`
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

export const createActivityType = async (req: Request, res: Response) => {
    const {
        activity_type_name,
        activity_type_description,
    } = req.body;


    const query = `
        INSERT INTO activity_type (activity_type_name, activity_type_description, show, flag_valid)
        VALUES ('${activity_type_name}', '${activity_type_description}', true, true)
        RETURNING *;
    `;

    try {
        const data = await queryPostgresDB(query, globalSmartGISConfig);
        res.status(201).json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error creating activity type:', error);
        res.status(500).json({ success: false, message: 'Error creating activity type' });
    }
};


