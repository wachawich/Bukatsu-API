import { Request, Response } from 'express';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db';

export const getRole = async (req: Request, res: Response) => {

    const {
        role_id,
        role_name,
        show,
    } = req.body

    // console.log(req.body)

    let query = ``;

    query += 'SELECT * FROM role r  \n'
    query += 'WHERE r.role_id > 0  \n'

    if (role_id) {
        query += `AND r.role_id = ${role_id}  \n`
    }
    if (role_name) {
        query += `AND r.role_name = ${role_name}  \n`
    }
    if (show) {
        query += `AND r.show = ${show}  \n`
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

