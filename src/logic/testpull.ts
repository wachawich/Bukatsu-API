// auth/auth.ts
import { Request, Response } from 'express';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db'; 

export const testPullData = async (req: Request, res: Response) => {
  const query = 'SELECT "Name_iD", "Username" FROM test."Test";';  

  try {
    const data = await queryPostgresDB(query, globalSmartGISConfig);  
    res.status(200).json({ success: true, data });  
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ success: false, message: 'Error fetching data' });
  }
};
