import { Request, Response } from 'express';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db';
import { error } from 'console';

export const getActivity = async (req: Request, res: Response) => {

    const {
        activity_id,
        title,
        create_date,
        start_date,
        end_date,
        status,
        create_by,
        location_id,
        location_name,
        location_type,
        flag_valid,
    } = req.body

    if (
        !activity_id &&
        !title &&
        !create_date &&
        !start_date &&
        !end_date &&
        !status &&
        !create_by &&
        !location_id &&
        !location_name &&
        !location_type &&
        !flag_valid
    ) {
        // throw new Error("No value input!");
        res.status(404).json({ success: false, message: 'No value input!' });
        return
    }

    let query = ``;

    query += 'SELECT * FROM activity a \n'
    query += 'LEFT JOIN location l ON l.location_id = a.location_id \n'
    query += 'WHERE a.activity_id > 0 \n'

    if (activity_id) {
        query += `AND a.activity_id = ${activity_id} \n`
    }
    if (title) {
        query += `AND a.title = ${title}  \n`
    }
    if (create_date) {
        query += `AND a.create_date = ${create_date}  \n`
    }
    if (start_date) {
        query += `AND a.start_date = ${start_date}  \n`
    }
    if (end_date) {
        query += `AND a.end_date = ${end_date}  \n`
    }
    if (status) {
        query += `AND a.status = ${status}  \n`
    }
    if (create_by) {
        query += `AND a.create_by = ${create_by}  \n`
    }
    if (location_id) {
        query += `AND a.location_id = ${location_id}  \n`
    }
    if (location_name) {
        query += `AND l.location_name = ${location_name}  \n`
    }
    if (location_type) {
        query += `AND l.location_type = ${location_type}  \n`
    }
    if (typeof flag_valid === 'boolean') {
        query += `AND a.flag_valid = ${flag_valid}`
    }

    console.log(query)

    const data = await queryPostgresDB(query, globalSmartGISConfig);
    const activityIDs = data.map((item: any) => item.activity_id);

    if (activityIDs.length === 0) {
        res.status(404).json({ success: false, message: 'Activity Not Found!' });
        return;
    }

    // สร้าง IN (...) clause
    const idsList = activityIDs.map(id => `'${id}'`).join(',');

    // Query ข้อมูล normalize แบบหลาย activity
    const queryAcNor = `
        SELECT * FROM public.activity_type_normalize atn
        LEFT JOIN activity_type at ON at.activity_type_id = atn.activity_type_id
        WHERE atn.activity_id IN (${idsList})
    `;

    const acActypeNordata = await queryPostgresDB(queryAcNor, globalSmartGISConfig);

    const querySubNor = `
        SELECT * FROM public.activity_subject_normalize asn
        LEFT JOIN subject s ON s.subject_id = asn.subject_id
        WHERE asn.activity_id IN (${idsList})
    `;

    const acSubNordata = await queryPostgresDB(querySubNor, globalSmartGISConfig);

    // จัดกลุ่ม normalize ข้อมูลตาม activity_id
    const acTypeGrouped: Record<string, any[]> = {};
    for (const row of acActypeNordata) {
        const id = row.activity_id;
        if (!acTypeGrouped[id]) acTypeGrouped[id] = [];
        acTypeGrouped[id].push(row);
    }

    const subTypeGrouped: Record<string, any[]> = {};
    for (const row of acSubNordata) {
        const id = row.activity_id;
        if (!subTypeGrouped[id]) subTypeGrouped[id] = [];
        subTypeGrouped[id].push(row);
    }

    // รวมข้อมูล normalize เข้ากับแต่ละ activity
    const enrichedData = data.map(activity => {
        const id = activity.activity_id;
        return {
            ...activity,
            activity_type_data: acTypeGrouped[id] || [],
            activity_subject_data: subTypeGrouped[id] || []
        };
    });


    try {
        res.status(200).json({ success: true, data: enrichedData });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
};


export const createActivity = async (req: Request, res: Response) => {

    const {
        title,
        description,
        create_date,
        start_date,
        end_date,
        status,
        contact,
        user_count,
        price,
        user_property,
        remark,
        create_by,
        location_id,
        activity_type,
        subject,
        activity_json_form,
        image_link,
    } = req.body;

    if (
        !title &&
        !description &&
        !create_date &&
        !start_date &&
        !end_date &&
        !status &&
        !contact &&
        !user_count &&
        !price &&
        !user_property &&
        !remark &&
        !create_by &&
        !location_id &&
        !activity_type &&
        !subject &&
        !activity_json_form &&
        !image_link
    ) {
        //throw new Error("No value input!");
        res.status(404).json({ success: false, message: 'No value input!' });
        return
    }

    if (!title || !create_by || !start_date || !end_date || !location_id || !user_count || !activity_type || !subject) {
        //throw new Error("No value input require feild!");
        res.status(404).json({ success: false, message: 'No value input require feild!' });
        return
    }

    const escape = (val: any) =>
        val === null || val === undefined
            ? 'NULL'
            : `'${String(val).replace(/'/g, "''")}'`;

    const finalCreateDate = create_date || new Date().toISOString();

    const activityJsonEscaped = activity_json_form
        ? `'${JSON.stringify(activity_json_form).replace(/'/g, "''")}'`
        : 'NULL';

    const iamgeLinkJsonEscaped = image_link
        ? `'${JSON.stringify(image_link).replace(/'/g, "''")}'`
        : 'NULL';

    const query = `
    INSERT INTO activity (
        title, description, create_date,
        start_date, end_date, status, contact,
        user_count, price, user_property, remark,
        create_by, location_id, flag_valid,
        image_link,
        activity_json_form
    ) VALUES (
        '${title}',
        ${description ? `'${description}'` : 'NULL'},
        '${finalCreateDate}', 
        '${start_date}',
        '${end_date}',
        'ACTIVE',
        ${contact ? `'${contact}'` : 'NULL'},
        '${user_count}',
        ${price ?? 'NULL'},
        ${user_property ? `'${user_property}'` : 'NULL'},
        ${remark ? `'${remark}'` : 'NULL'},
        ${create_by},
        ${location_id},
        true,
        ${iamgeLinkJsonEscaped}::jsonb
        ${activityJsonEscaped}::jsonb
    )
    RETURNING *;
    `;

    try {
        const activityData = await queryPostgresDB(query, globalSmartGISConfig);
        const activityID = activityData[0]['activity_id'];

        const subjectEntries = Object.values(subject);
        const subjectInsertValues = subjectEntries
            .map(subject_id => `(${activityID}, ${subject_id}, true)`)
            .join(", ");

        const subjectInsertQuery = `
          INSERT INTO activity_subject_normalize (activity_id, subject_id, flag_valid)
          VALUES ${subjectInsertValues}
          RETURNING *;
        `;

        const activitySubjectData = await queryPostgresDB(subjectInsertQuery, globalSmartGISConfig);

        const activityTypeEntries = Object.values(activity_type);
        const activityTypeInsertValues = activityTypeEntries
            .map(activity_type_id => `(${activityID}, ${activity_type_id}, true)`)
            .join(", ");

        const activityTypeInsertQuery = `
        INSERT INTO activity_type_normalize (activity_id, activity_type_id, flag_valid)
        VALUES ${activityTypeInsertValues}
        RETURNING *;
      `;

        const activityTypetInData = await queryPostgresDB(activityTypeInsertQuery, globalSmartGISConfig);

        res.status(200).json({ success: true, activityData, activitySubjectData, activityTypetInData });

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
};


export const updateActivity = async (req: Request, res: Response) => {
    const {
        activity_id,
        title,
        description,
        start_date,
        end_date,
        status,
        contact,
        user_count,
        price,
        user_property,
        remark,
        location_id,
        activity_type,
        subject,
        activity_json_form,
        image_link,
    } = req.body;

    if (!activity_id) {
        res.status(400).json({ success: false, message: 'Missing activity_id' });
        return
    }

    const updates = [];
    const escape = (val: any) =>
        val === null || val === undefined ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`;

    if (title) updates.push(`title = ${escape(title)}`);
    if (description) updates.push(`description = ${escape(description)}`);
    if (start_date) updates.push(`start_date = ${escape(start_date)}`);
    if (end_date) updates.push(`end_date = ${escape(end_date)}`);
    if (status) updates.push(`status = ${escape(status)}`);
    if (contact) updates.push(`contact = ${escape(contact)}`);
    if (user_count) updates.push(`user_count = ${user_count}`);
    if (price !== undefined) updates.push(`price = ${price}`);
    if (user_property) updates.push(`user_property = ${escape(user_property)}`);
    if (remark) updates.push(`remark = ${escape(remark)}`);
    if (location_id) updates.push(`location_id = ${location_id}`);
    if (activity_json_form) updates.push(`activity_json_form = '${JSON.stringify(activity_json_form).replace(/'/g, "''")}'::jsonb`);
    if (image_link) updates.push(`image_link = '${JSON.stringify(image_link).replace(/'/g, "''")}'::jsonb`);

    if (updates.length === 0) {
        res.status(400).json({ success: false, message: 'No data to update' });
        return
    }

    const query = `
        UPDATE activity SET ${updates.join(', ')}
        WHERE activity_id = ${activity_id}
        RETURNING *;
    `;

    try {
        const updatedActivity = await queryPostgresDB(query, globalSmartGISConfig);

        // Optional: Update normalize tables
        if (subject) {
            await queryPostgresDB(`DELETE FROM activity_subject_normalize WHERE activity_id = ${activity_id}`, globalSmartGISConfig);
            const subjectValues = Object.values(subject).map(sid => `(${activity_id}, ${sid}, true)`).join(', ');
            await queryPostgresDB(`INSERT INTO activity_subject_normalize (activity_id, subject_id, flag_valid) VALUES ${subjectValues}`, globalSmartGISConfig);
        }

        if (activity_type) {
            await queryPostgresDB(`DELETE FROM activity_type_normalize WHERE activity_id = ${activity_id}`, globalSmartGISConfig);
            const typeValues = Object.values(activity_type).map(tid => `(${activity_id}, ${tid}, true)`).join(', ');
            await queryPostgresDB(`INSERT INTO activity_type_normalize (activity_id, activity_type_id, flag_valid) VALUES ${typeValues}`, globalSmartGISConfig);
        }

        res.status(200).json({ success: true, updatedActivity });
    } catch (error) {
        console.error('Error updating activity:', error);
        res.status(500).json({ success: false, message: 'Error updating activity' });
    }
};


export const deleteActivity = async (req: Request, res: Response) => {
    const { activity_id } = req.params;

    if (!activity_id) {
        res.status(400).json({ success: false, message: 'Missing activity_id' });
        return
    }

    const query = `
        UPDATE activity
        SET flag_valid = false
        WHERE activity_id = ${activity_id}
        RETURNING *;
    `;

    try {
        const deletedActivity = await queryPostgresDB(query, globalSmartGISConfig);
        res.status(200).json({ success: true, deletedActivity });
    } catch (error) {
        console.error('Error deleting activity:', error);
        res.status(500).json({ success: false, message: 'Error deleting activity' });
    }
};


export const getMyActivity = async (req: Request, res: Response) => {

    const {
        activity_id,
        title,
        create_date,
        start_date,
        end_date,
        status,
        create_by,
        location_id,
        location_name,
        location_type,
        flag_valid,
        user_sys_id,
    } = req.body

    if (
        !activity_id &&
        !title &&
        !create_date &&
        !start_date &&
        !end_date &&
        !status &&
        !create_by &&
        !location_id &&
        !location_name &&
        !location_type &&
        !flag_valid &&
        !user_sys_id
    ) {
        res.status(404).json({ success: false, message: 'No value input!' });
        // throw new Error("No value input!");
        return
    }

    let query = ``;

    query += 'SELECT * FROM activity a \n'
    query += 'LEFT JOIN location l ON l.location_id = a.location_id \n'
    query += 'LEFT JOIN attendance atd ON atd.activity_id = a.activity_id \n'
    query += 'WHERE a.activity_id > 0 \n'

    if (activity_id) {
        query += `AND a.activity_id = ${activity_id} \n`
    }
    if (title) {
        query += `AND a.title = ${title}  \n`
    }
    if (create_date) {
        query += `AND a.create_date = ${create_date}  \n`
    }
    if (start_date) {
        query += `AND a.start_date = ${start_date}  \n`
    }
    if (end_date) {
        query += `AND a.end_date = ${end_date}  \n`
    }
    if (status) {
        query += `AND a.status = ${status}  \n`
    }
    if (create_by) {
        query += `AND a.create_by = ${create_by}  \n`
    }
    if (location_id) {
        query += `AND a.location_id = ${location_id}  \n`
    }
    if (location_name) {
        query += `AND l.location_name = ${location_name}  \n`
    }
    if (location_type) {
        query += `AND l.location_type = ${location_type}  \n`
    }
    if (flag_valid) {
        query += `AND a.flag_valid = ${flag_valid}  \n`
    }
    if (user_sys_id) {
        query += `AND atd.user_sys_id = ${user_sys_id}`
    }

    console.log(query)


    try {
        const data = await queryPostgresDB(query, globalSmartGISConfig);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
};

// export const getActivityWithAttendance = async (req: Request, res: Response) => {
//     const {
//         activity_id,
//         create_date,
//         start_date,
//         end_date,
//         status,
//         create_by,
//         location_id,
//         flag_valid
//     } = req.body;

//     if (
//         !activity_id &&
//         !create_date &&
//         !start_date &&
//         !end_date &&
//         !status &&
//         !create_by &&
//         !location_id &&
//         !flag_valid
//     ) {
//         res.status(404).json({ success: false, message: 'No value input!' });
//         return
//     }

//     let query = ``;

//     query += `
//         SELECT * FROM activity a 
//         LEFT JOIN attendance atd ON a.activity_id = atd.activity_id 
//         WHERE a.activity_id > 0 \n
//     `

//     if (activity_id) {
//         query += `AND a.activity_id = ${activity_id} \n`;
//     }
//     if (create_date) {
//         query += `AND a.create_date = '${create_date}' \n`;
//     }
//     if (start_date) {
//         query += `AND a.start_date = '${start_date}' \n`;
//     }
//     if (end_date) {
//         query += `AND a.end_date = '${end_date}' \n`;
//     }
//     if (status) {
//         query += `AND a.status = '${status}' \n`;
//     }
//     if (create_by) {
//         query += `AND a.create_by = '${create_by}' \n`;
//     }
//     if (location_id) {
//         query += `AND a.location_id = ${location_id} \n`;
//     }
//     if (typeof flag_valid === 'boolean') {
//         query += `AND a.flag_valid = ${flag_valid} \n`;
//     }

//     console.log('Generated SQL:', query);

//     try {
//         const data = await queryPostgresDB(query, globalSmartGISConfig);

//         if (data.length === 0) {
//             res.status(404).json({ success: false, message: 'No matching data found!' });
//             return
//         }

//         res.status(200).json({ success: true, data });
//     } catch (error) {
//         //console.error('Error fetching data:', error);
//         res.status(500).json({ success: false, message: 'Error fetching data' });
//     }
// };

export const getActivityWithAttendance = async (req: Request, res: Response) => {
    const {
        activity_id,
        create_date,
        start_date,
        end_date,
        status,
        create_by,
        location_id,
        flag_valid,
        approve,
    } = req.body;

    if (
        !activity_id &&
        !create_date &&
        !start_date &&
        !end_date &&
        !status &&
        !create_by &&
        !location_id &&
        typeof approve !== 'boolean' &&
        typeof flag_valid !== 'boolean'
    ) {
        res.status(404).json({ success: false, message: 'No value input!' });
        return;
    }

    let query = `
        SELECT * FROM activity a 
        WHERE a.activity_id > 0 
    `;

    if (activity_id) query += `AND a.activity_id = ${activity_id} \n`;
    if (create_date) query += `AND a.create_date = '${create_date}' \n`;
    if (start_date) query += `AND a.start_date = '${start_date}' \n`;
    if (end_date) query += `AND a.end_date = '${end_date}' \n`;
    if (status) query += `AND a.status = '${status}' \n`;
    if (create_by) query += `AND a.create_by = '${create_by}' \n`;
    if (location_id) query += `AND a.location_id = ${location_id} \n`;
    if (typeof flag_valid === 'boolean') query += `AND a.flag_valid = ${flag_valid} \n`;

    try {
        const data = await queryPostgresDB(query, globalSmartGISConfig);
        const activityIDs = data.map((item: any) => item.activity_id);

        if (activityIDs.length === 0) {
            res.status(404).json({ success: false, message: 'Activity Not Found!' });
            return;
        }

        const idsList = activityIDs.map(id => `'${id}'`).join(',');

        // ดึงข้อมูล attendance ที่เกี่ยวข้อง
        let queryAttendance = `
            SELECT * FROM public.attendance atd \n
            LEFT JOIN user_sys us ON us.user_sys_id = atd.user_sys_id \n
            WHERE atd.activity_id IN (${activityIDs}) \n
        `;
        console.log("typeof approve", typeof approve)
        
        if (typeof approve == 'boolean') {
            queryAttendance += `AND atd.approve = ${approve} \n`
        };

        console.log("queryAttendance", queryAttendance)

        const attendanceData = await queryPostgresDB(queryAttendance, globalSmartGISConfig);

        // จัดกลุ่ม attendance ตาม activity_id
        const attendanceGrouped: Record<string, any[]> = {};
        for (const row of attendanceData) {
            const id = row.activity_id;
            if (!attendanceGrouped[id]) attendanceGrouped[id] = [];
            attendanceGrouped[id].push(row);
        }

        // ผูกข้อมูล attendance เข้ากับแต่ละ activity
        const enrichedData = data.map(activity => {
            const id = activity.activity_id;
            return {
                ...activity,
                attendance_data: attendanceGrouped[id] || []
            };
        });

        res.status(200).json({ success: true, data: enrichedData });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
};


export const joinActivity = async (req: Request, res: Response) => {
    const {
        user_sys_id,
        activity_id,
        approve = false,
        flag_valid = true,
        activity_json_form_user
    } = req.body;

    if (!user_sys_id || !activity_id) {
        res.status(400).json({ success: false, message: 'Missing user_sys_id or activity_id' });
        return
    }

    const escape = (val: any) =>
        val === null || val === undefined ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`;

    const activityFormJson = activity_json_form_user
        ? `'${JSON.stringify(activity_json_form_user).replace(/'/g, "''")}'::jsonb`
        : 'NULL';

    const query = `
        INSERT INTO attendance (
            user_sys_id,
            activity_id,
            approve,
            flag_valid,
            activity_json_form_user
        )
        VALUES (
            ${user_sys_id},
            ${activity_id},
            ${approve},
            ${flag_valid},
            ${activityFormJson}
        )
        RETURNING *;
    `;

    console.log("query", query)

    try {
        const data = await queryPostgresDB(query, globalSmartGISConfig);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error joining activity:', error);
        res.status(500).json({ success: false, message: 'Error joining activity' });
    }
};

export const approveActivity = async (req: Request, res: Response) => {
    const {
        user_sys_id,
        activity_id,
        approve = true,
        flag_valid = true
    } = req.body;

    if (!user_sys_id || !activity_id) {
        res.status(400).json({ success: false, message: 'Missing user_sys_id or activity_id' });
        return;
    }


    const query = `
        UPDATE attendance
        SET
            approve = ${approve},
            flag_valid = ${flag_valid} \n
        \nWHERE user_sys_id = ${user_sys_id} AND activity_id = ${activity_id}
        RETURNING *;
    `;

    console.log("query", query)

    try {
        const data = await queryPostgresDB(query, globalSmartGISConfig);
        if (data.length === 0) {
            res.status(404).json({ success: false, message: 'No matching attendance record found.' });
        } else {
            res.status(200).json({ success: true, data });
        }
    } catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({ success: false, message: 'Error updating attendance' });
    }
};


