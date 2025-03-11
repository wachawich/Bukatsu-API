import { Pool } from 'pg';

const globalSmartGISConfig = {
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT) || 5432,
    database: process.env.PG_DATABASE || 'your-database',
    user: process.env.PG_USER || 'your-username',
    password: process.env.PG_PASSWORD || 'your-password',
};

type GlobalConfig = typeof globalSmartGISConfig;

const queryPostgresDB = async (query: string, config: GlobalConfig) => {
    const pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
    });

    try {
        const client = await pool.connect();
        const result = await client.query(query);
        client.release();
        return result.rows;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    } finally {
        await pool.end();
    }
};

export { queryPostgresDB, globalSmartGISConfig };


// example เรียกใช้ฟังก์ชัน ในไฟล?อื่น

// import { queryPostgresDB, globalSmartGISConfig } from './queryPostgresDB';

// (async () => {
//   const query = 'SELECT * FROM your_table;';
//   try {
//     const data = await queryPostgresDB(query, globalSmartGISConfig);
//     console.log(data);
//   } catch (error) {
//     console.error('Error fetching data:', error);
//   }
// })();