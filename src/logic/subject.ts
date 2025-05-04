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



export const createSubject = async (req: Request, res: Response) => {
    const {
        subject_name,
        subject_description
    } = req.body;

    if (!subject_name) {
        res.status(400).json({ success: false, message: 'subject_name is required' });
        return
    }

    const query = `
        INSERT INTO subject (subject_name, subject_description, show, flag_valid)
        VALUES ('${subject_name}', '${subject_description}', true, true)
        RETURNING *;
    `;

    try {
        const data = await queryPostgresDB(query, globalSmartGISConfig);
        res.status(201).json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error creating subject:', error);
        res.status(500).json({ success: false, message: 'Error creating subject' });
    }
};


export const updateSubject = async (req: Request, res: Response) => {
    const {
        subject_id,
        subject_name,
        subject_description,
        show,
        flag_valid
    } = req.body;

    if (!subject_id) {
        res.status(400).json({ success: false, message: 'subject_id is required' });
        return
    }

    let updates: string[] = [];

    if (subject_name) {
        updates.push(`subject_name = '${subject_name}'`);
    }
    if (subject_description) {
        updates.push(`subject_description = '${subject_description}'`);
    }
    if (typeof show === 'boolean') updates.push(`show = ${show}`);
    if (typeof flag_valid === 'boolean') updates.push(`flag_valid = ${flag_valid}`);

    if (updates.length === 0) {
        res.status(400).json({ success: false, message: 'No fields to update' });
        return
    }

    const query = `
        UPDATE subject
        SET ${updates.join(', ')}
        WHERE subject_id = ${subject_id}
        RETURNING *;
    `;

    try {
        const data = await queryPostgresDB(query, globalSmartGISConfig);
        res.status(200).json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error updating subject:', error);
        res.status(500).json({ success: false, message: 'Error updating subject' });
    }
};
