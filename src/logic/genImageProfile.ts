import { Request, Response } from 'express';
import { queryPostgresDB, globalSmartGISConfig } from '../config/db';


function generateDefaultAvatar(letter : any) {
  // Ensure we have a valid letter (convert to uppercase for consistency)
  const displayLetter = (letter || '?').toString().toUpperCase().charAt(0);
  
  // Create an SVG with a beautiful linear gradient background
  const svg = `
  <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0EA5E9" />
        <stop offset="50%" stop-color="#2563EB" />
        <stop offset="100%" stop-color="#1E40AF" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#avatarGradient)" />
    <text 
      x="50%" 
      y="50%" 
      font-size="64" 
      fill="white" 
      dominant-baseline="middle" 
      text-anchor="middle" 
      font-family="Arial, sans-serif"
      font-weight="bold">
      ${displayLetter}
    </text>
  </svg>
  `;
  
  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

export const createImageProfile = async (req: Request, res: Response) => {

    const {
        char = "",
    } = req.body

    const profile = generateDefaultAvatar(char)


    try {
        res.status(200).json({ success: true, profile });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ success: false, message: 'Error fetching data' });
    }

}