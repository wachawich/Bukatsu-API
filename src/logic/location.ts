import { Request, Response } from 'express';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db';

export const getLocation = async (req: Request, res: Response) => {

    const {
        location_id,
        location_name,
        location_type,
        lat,
        long,
        flag_valid,
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
    if (flag_valid) {
        query += `AND l.flag_valid = ${flag_valid}`
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


export const createLocation = async (req: Request, res: Response) => {
    const {
        location_name,
        location_type,
        lat,
        long,
    } = req.body;

    if (!location_name || !location_type || lat == null || long == null) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const query = `
      INSERT INTO location (location_name, location_type, lat, long, flag_valid)
      VALUES ('${location_name}', '${location_type}', ${lat}, ${long}, true)
      RETURNING *;
    `;

    console.log(query);

    try {
        const data = await queryPostgresDB(query, globalSmartGISConfig);
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error creating location:', error);
        res.status(500).json({ success: false, message: 'Error creating location' });
    }
};


export const updateLocation = async (req: Request, res: Response) => {
    const {
        location_id,
        location_name,
        location_type,
        lat,
        long,
        flag_valid,
    } = req.body;

    if (!location_id) {
        res.status(400).json({ success: false, message: 'location_id is required for update' });
    }

    let query = `UPDATE location SET \n`;
    let updates: string[] = [];

    if (location_name) updates.push(`location_name = '${location_name}'`);

    if (location_type) updates.push(`location_type = '${location_type}'`);

    if (lat != null) updates.push(`lat = ${lat}`);
    if (long != null) updates.push(`long = ${long}`);

    if (typeof flag_valid === 'boolean') updates.push(`flag_valid = ${flag_valid}`);

    if (updates.length === 0) {
        res.status(400).json({ success: false, message: 'No fields provided to update' });
    }

    query += `${updates.join(', ')} \n`;
    query += `
        WHERE location_id = ${location_id} 
        RETURNING *;
    `

    console.log(query);

    try {
        const data = await queryPostgresDB(query, globalSmartGISConfig);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ success: false, message: 'Error updating location' });
    }
};


