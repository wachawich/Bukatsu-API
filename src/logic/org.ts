import { Request, Response } from 'express';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db';

export const getOrg = async (req: Request, res: Response) => {

    const {
        org_id,
        org_name,
        org_type,
    } = req.body

    // console.log(req.body)

    let query = ``;

    query += 'SELECT * FROM org o  \n'
    query += 'WHERE o.org_id > 0  \n'

    if (org_id) {
        query += `AND o.org_id = ${org_id}  \n`
    }
    if (org_name) {
        query += `AND o.org_name = ${org_name}  \n`
    }
    if (org_type) {
        query += `AND o.org_type = ${org_type}  \n`
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

