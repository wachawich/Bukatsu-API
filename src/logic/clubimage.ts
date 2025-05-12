import { Request, Response } from 'express';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db';

export const getImageClub = async (req: Request, res: Response) => {

    const {
        club_id,
        image_link,
    } = req.body

    console.log(req.body)

    let query = ``;

    query += 'SELECT * FROM club_image c  \n'
    query += 'WHERE c.club_id > 0  \n'

    console.log(query)
    try {
        const data = await queryPostgresDB(query, globalSmartGISConfig);  
        res.status(200).json({ success: true, data });  
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
      }
}

//   export const deleteImageClub = async (req: Request, res: Response) => {
//     const { club_id } = req.body;
  
//     if (!club_id) {
//       res.status(400).json({ success: false, message: "Missing club_id" });
//     }
  
//     const query = `
//       DELETE FROM club_image
//       WHERE club_id = ${club_id}
//       RETURNING *;
//     `;
  
//     try {
//       const data = await queryPostgresDB(query, globalSmartGISConfig);
//       res.status(200).json({ success: true, data });
//     } catch (error) {
//       console.error("Error deleting club:", error);
//       res.status(500).json({ success: false, message: "Error deleting club" });
//     }
//   };