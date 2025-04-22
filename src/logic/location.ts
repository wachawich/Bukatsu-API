import { Request, Response } from 'express';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db';

export const getLocation = async (req: Request, res: Response) => {

    const {
        location_id,
        location_name,
        location_type,
        lat,
        long,
    } = req.body

    // console.log(req.body)

    let query = ``;

    query += 'SELECT * FROM location l  \n'
    query += 'WHERE l.location_id > 0  \n'

    if (location_id) {
        query += `AND l.location_id = ${location_id}  \n`
    }
    if (location_name) {
        query += `AND l.location_name = ${location_name}  \n`
    }
    if (location_type) {
        query += `AND l.location_type = ${location_type}  \n`
    };

    console.log(query)


    try {
        const data = await queryPostgresDB(query, globalSmartGISConfig);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }

}

