import { Request, Response } from 'express';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db';

export const getSubject = async (req: Request, res: Response) => {

    const {
        subject_id,
        subject_name,
        show,
        flag_valid,
    } = req.body

    // console.log(req.body)

    let query = ``;

    query += 'SELECT * FROM subject s \n'
    query += 'WHERE s.subject_id > 0  \n'

    if (subject_id) {
        query += `AND s.subject_id = ${subject_id}  \n`
    }
    if (subject_name) {
        query += `AND s.subject_name = ${subject_name}  \n`
    }
    if (show) {
        query += `AND s.show = ${show}  \n`
    }
    if (flag_valid) {
        query += `AND s.flag_valid = ${flag_valid}  \n`
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

