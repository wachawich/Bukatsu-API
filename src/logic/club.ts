import { Request, Response } from 'express';
import express from 'express';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import multer from 'multer';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
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

dotenv.config();

// Azure config
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || '';

const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);
const containerClient = blobServiceClient.getContainerClient(containerName);

async function setPublicAccess() {
  // กำหนด public access level เป็น 'blob'
  await containerClient.setAccessPolicy('blob');
  console.log('Container is now public!');
}

// Multer config
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload handler
export const uploadimageclub = async (req: express.Request, res: express.Response) => {
  const file:any = req.file;  // กำหนด file ให้ตรง ๆ โดยไม่ใช้ destructuring
  const id:any = req.body.id;

  // ตรวจสอบว่าไฟล์ถูกอัพโหลดหรือไม่
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // ดึงส่วนขยายของไฟล์
    const fileExtension = file.originalname.split('.').pop();
    const blobName = `${uuidv4()}.${fileExtension}`;

    // สร้าง Blob client สำหรับการอัพโหลดไฟล์
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // กำหนด HTTP headers ของ Blob
    const options = {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,  // กำหนด content type ของไฟล์
      },
    };

    // อัพโหลดไฟล์ไปยัง Azure Blob Storage
    await blockBlobClient.uploadData(file.buffer, options);
    const url:any = blockBlobClient.url;

    const insertQuery = `
    INSERT INTO club_image (club_id,image_link)
    VALUES ('${id}','${url}')
    RETURNING *;
  `;
    const data = await queryPostgresDB(insertQuery, globalSmartGISConfig); 
    // ส่ง URL ของไฟล์ที่อัพโหลด
    res.status(200).json({
        message: 'File uploaded successfully',
        fileName: blobName,
        fileUrl: blockBlobClient.url,
        data: data,
      });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

export const uploadPRImagesClub = async (req: express.Request, res: express.Response) => {
  const files: any = req.files;
  const clubId: string = req.body.id;

  if (!clubId || !files || (!files.square && !files.banner)) {
    res.status(400).json({ error: 'Missing club ID or files' });
  }

  const uploadedUrls: { square?: string; banner?: string } = {};

  try {
    // อัปโหลดแต่ละไฟล์ที่มี
    for (const type of ['square', 'banner']) {
      const file = files[type]?.[0];
      if (file) {
        const fileExtension = file.originalname.split('.').pop();
        const blobName = `${uuidv4()}.${fileExtension}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const options = {
          blobHTTPHeaders: {
            blobContentType: file.mimetype,
          },
        };

        await blockBlobClient.uploadData(file.buffer, options);
        uploadedUrls[type as 'square' | 'banner'] = blockBlobClient.url;
      }
    }

    // ดึง club_image_path เดิม
    const selectQuery = `SELECT club_image_path FROM club WHERE club_id = '${clubId}'`;
    const result = await queryPostgresDB(selectQuery, globalSmartGISConfig);
    let imagePathJson = { square: '', banner: '' };
    
    if (result.length > 0 && result[0].club_image_path) {
      const existingPath = result[0].club_image_path;
      imagePathJson = typeof existingPath === 'string' ? JSON.parse(existingPath) : existingPath;
    }

    // รวมข้อมูลใหม่
    const updatedPath = {
      ...imagePathJson,
      ...uploadedUrls,
    };

    const updateQuery = `
      UPDATE club
      SET club_image_path = '${JSON.stringify(updatedPath)}'
      WHERE club_id = '${clubId}'
      RETURNING *;
    `;
    const updated = await queryPostgresDB(updateQuery, globalSmartGISConfig);

    res.status(200).json({
      message: 'Images uploaded successfully',
      fileUrls: uploadedUrls,
      updatedData: updated,
    });
    console.log(uploadedUrls)
  } catch (error) {
    console.error('Upload PR images error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
};


export const createClub = async (req: Request, res: Response) => {
    const {
      club_name,
      club_description,
      club_link,
      club_image_path, // JSON object: { square: "", banner: "" }
    } = req.body;
  
    const jsonPath = JSON.stringify(club_image_path);
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0'); 
    const dd = String(now.getDate()).padStart(2, '0');
    const club_timestamp = `${yyyy}-${mm}-${dd}`;
    const query = `
      INSERT INTO club (
        club_name,
        club_description,
        club_timestamp,
        club_link,
        club_image_path
      ) VALUES (
        '${club_name}',
        '${club_description}',
        '${club_timestamp}',
        '${club_link}',
        '${jsonPath}'
      )
      RETURNING *;
    `;
  
    try {
      const data = await queryPostgresDB(query, globalSmartGISConfig);
      res.status(201).json({ success: true, data });
    } catch (error) {
      console.error("Error creating club:", error);
      res.status(500).json({ success: false, message: "Error creating club" });
    }
  };


  export const updateClub = async (req: Request, res: Response) => {
    const {
      club_id,
      club_name,
      club_description,
      club_timestamp,
      club_link,
      club_image_path,
    } = req.body;
  
    if (!club_id) {
    res.status(400).json({ success: false, message: "Missing club_id" });
    }
  
    const jsonPath = JSON.stringify(club_image_path);
  
    const query = `
      UPDATE club SET
        club_name = '${club_name}',
        club_description = '${club_description}',
        club_timestamp = '${club_timestamp}',
        club_link = '${club_link}',
        club_image_path = '${jsonPath}'
      WHERE club_id = ${club_id}
      RETURNING *;
    `;
  
    try {
      const data = await queryPostgresDB(query, globalSmartGISConfig);
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("Error updating club:", error);
      res.status(500).json({ success: false, message: "Error updating club" });
    }
  };

  



  