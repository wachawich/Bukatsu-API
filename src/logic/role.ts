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

export const createRole = async (req: Request, res: Response) => {
    const {
        role_name,
        access,
    } = req.body;

    if (!role_name) {
        res.status(400).json({ success: false, message: 'role_name is required' });
        return
    }

    const query = `
        INSERT INTO role (role_name, access, show)
        VALUES ('${role_name}', '${JSON.stringify(access)}'::jsonb, true)
        RETURNING *;
    `;

    try {
        const data = await queryPostgresDB(query, globalSmartGISConfig);
        res.status(201).json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({ success: false, message: 'Error creating role' });
    }
};


export const updateRole = async (req: Request, res: Response) => {
    const {
        role_id,
        role_name,
        access,
        show,
        flag_valid
    } = req.body;

    if (!role_id) {
        res.status(400).json({ success: false, message: 'role_id is required' });
        return
    }

    let updates: string[] = [];

    if (role_name) {
        updates.push(`role_name = '${role_name}'`);
    }
    if (access) {
        updates.push(`access = '${JSON.stringify(access)}'::jsonb`);
    }
    
    if (typeof show === 'boolean') updates.push(`show = ${show}`);
    if (typeof flag_valid === 'boolean') updates.push(`flag_valid = ${flag_valid}`);

    if (updates.length === 0) {
        res.status(400).json({ success: false, message: 'No fields to update' });
        return
    }

    const query = `
        UPDATE role
        SET ${updates.join(', ')}
        WHERE role_id = ${role_id}
        RETURNING *;
    `;

    console.log("query", query)

    try {
        const data = await queryPostgresDB(query, globalSmartGISConfig);
        res.status(200).json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ success: false, message: 'Error updating role' });
    }
};



