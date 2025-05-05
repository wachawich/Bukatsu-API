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
        throw new Error("No value input!");
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
    if (flag_valid) {
        query += `AND a.flag_valid = ${flag_valid}`
    }

    console.log(query)

    const data = await queryPostgresDB(query, globalSmartGISConfig);
    const activityID = data[0]['activity_id']

    let queryAcNor = ``

    queryAcNor += `
        SELECT * FROM public.activity_type_normalize atn
        LEFT JOIN activity_type at ON at.activity_type_id = atn.activity_type_id
        WHERE atn.activity_id = ${activityID}
    `

    const acActypeNordata = await queryPostgresDB(queryAcNor, globalSmartGISConfig);

    let querySubNor = ``

    querySubNor += `
        SELECT * FROM public.activity_subject_normalize asn
        LEFT JOIN subject s ON s.subject_id = asn.subject_id
        WHERE asn.activity_id = ${activityID}
    `

    const acSubNordata = await queryPostgresDB(querySubNor, globalSmartGISConfig);

    // จัดกลุ่มข้อมูล normalize โดย activity_id
    const acTypeGrouped : any = {};
    for (const row of acActypeNordata) {
        const id = row.activity_id;
        if (!acTypeGrouped[id]) acTypeGrouped[id] = [];
        acTypeGrouped[id].push(row);
    }

    const subTypeGrouped : any = {};
    for (const row of acSubNordata) {
        const id = row.activity_id;
        if (!subTypeGrouped[id]) subTypeGrouped[id] = [];
        subTypeGrouped[id].push(row);
    }

    // ใส่ข้อมูล normalize ลงในแต่ละ activity
    const enrichedData = data.map(activity => {
        const id = activity.activity_id;
        return {
            ...activity,
            activity_type_data: acTypeGrouped[id] || [],
            activity_subject_data: subTypeGrouped[id] || []
        };
    });


    try {
        res.status(200).json({ success: true, data : enrichedData });
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
    } = req.body

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
        !subject
    ) {
        throw new Error("No value input!");
    }

    if (!title || !create_by || !start_date || !end_date || !status || !location_id || !user_count || !activity_type || !subject) {
        throw new Error("No value input require feild!");
    }

    const escape = (val: any) => val === null || val === undefined ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`;

    const finalCreateDate = create_date || new Date().toISOString(); // 'YYYY-MM-DD'

    let query = ``;

    query += `
    INSERT INTO activity (
        title, description, create_date,
        start_date, end_date, status, contact,
        user_count, price, user_property, remark,
        create_by, location_id, flag_valid
    ) VALUES (
        '${title}',
        ${description ? `'${description}'` : 'NULL'},
        '${finalCreateDate}', 
        '${start_date}',
        '${end_date}',
        '${status}',
        ${contact ? `'${contact}'` : 'NULL'},
        '${user_count}',
        ${price ?? 'NULL'},
        ${user_property ? `'${user_property}'` : 'NULL'},
        ${remark ? `'${remark}'` : 'NULL'},
        ${create_by},
        ${location_id},
        true
    )
    RETURNING *;
    `;

    console.log(query)

    const activityData = await queryPostgresDB(query, globalSmartGISConfig);

    const activityID = activityData[0]['activity_id']

    const subjectEntries = Object.values(subject); // [19, 23]
    const subjectInsertValues = subjectEntries
        .map(subject_id => `(${activityID}, ${subject_id}, true)`)
        .join(", ");

    const subjectInsertQuery = `
      INSERT INTO activity_subject_normalize (activity_id, subject_id, flag_valid)
      VALUES ${subjectInsertValues}
      RETURNING *;
    `;

    const activitySubjectData = await queryPostgresDB(subjectInsertQuery, globalSmartGISConfig);

    const activityTypeEntries = Object.values(activity_type); // [19, 23]
    const activityTypeInsertValues = activityTypeEntries
        .map(activity_type_id => `(${activityID}, ${activity_type_id}, true)`)
        .join(", ");

    const activityTypeInsertQuery = `
    INSERT INTO activity_type_normalize (activity_id, activity_type_id, flag_valid)
    VALUES ${activityTypeInsertValues}
    RETURNING *;
  `;

    const activityTypetInData = await queryPostgresDB(activityTypeInsertQuery, globalSmartGISConfig);


    try {
        // const data = await queryPostgresDB(query, globalSmartGISConfig);
        res.status(200).json({ success: true, activityData, activitySubjectData, activityTypetInData });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
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
        throw new Error("No value input!");
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

    console.log(query)


    try {
        const data = await queryPostgresDB(query, globalSmartGISConfig);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }
};