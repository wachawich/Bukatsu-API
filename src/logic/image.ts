import express from 'express';
import multer from 'multer';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config();

// Azure config
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';
const containerName = process.env.AZURE_STORAGE_CONTAINEROTHER_NAME || '';

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
export const uploadMedia = async (req: express.Request, res: express.Response) => {
  const file:any = req.file;  

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
        blobContentType: file.mimetype, 
      },
    };

    // อัพโหลดไฟล์ไปยัง Azure Blob Storage
    await blockBlobClient.uploadData(file.buffer, options);

    // ส่ง URL ของไฟล์ที่อัพโหลด
    res.status(200).json({
      message: 'File uploaded successfully',
      fileName: blobName,
      fileUrl: blockBlobClient.url,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

