import { Request, Response } from 'express';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db';

export const getClub = async (req: Request, res: Response) => {

    const {
        club_id,
        club_name,
        club_description,
        club_timestamp,
        club_link,
        club_image_path,
    } = req.body

    console.log(req.body)

    let query = ``;

    query += 'SELECT * FROM club c  \n'
    query += 'WHERE c.club_id > 0  \n'

    if (club_id) {
        query += `AND c.club_id = ${club_id}  \n`
    }
    if (club_name) {
        query += `AND c.club_name = ${club_name}  \n`
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