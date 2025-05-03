import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const OTPFunction = async (email: string, otp: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // ✅ ยอมรับ self-signed cert
    },
  });

  const mailOptions = {
    from: `"OTP Service" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `[${otp}] นี่คือ OTP สำหรับการยืนยันของคุณ`,
    html : htmlText(otp)
    // html: `<p>Your OTP is <b>${otp}</b>. It will expire in 5 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);

  return "Send"
};




export const htmlText = (otp : any) => {
  return `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>รหัส OTP ของคุณ - Bukatsu</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
        
        body {
            font-family: 'Prompt', sans-serif;
            background-color: #f5f7fa;
            margin: 0;
            padding: 0;
        }
        
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .email-header {
            background-color: #4361ee;
            padding: 20px;
            text-align: center;
        }
        
        .logo {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .email-body {
            padding: 30px;
            text-align: center;
        }
        
        .greeting {
            font-size: 20px;
            font-weight: 500;
            color: #333333;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #555555;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        
        .otp-container {
            background-color: #f0f4ff;
            border-radius: 8px;
            padding: 20px;
            margin: 0 auto 30px;
            width: 80%;
            border: 1px dashed #4361ee;
        }
        
        .otp-code {
            font-size: 32px;
            font-weight: 700;
            color: #4361ee;
            letter-spacing: 5px;
        }
        
        .expiry {
            font-size: 14px;
            color: #e63946;
            margin-top: 10px;
            font-weight: 500;
        }
        
        .note {
            font-size: 14px;
            color: #777777;
            margin-top: 30px;
            line-height: 1.5;
        }
        
        .email-footer {
            background-color: #f5f7fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e8eaed;
        }
        
        .footer-text {
            font-size: 12px;
            color: #999999;
        }
        
        .social-icons {
            margin-top: 15px;
        }
        
        .social-icon {
            display: inline-block;
            width: 30px;
            height: 30px;
            background-color: #4361ee;
            border-radius: 50%;
            margin: 0 5px;
            color: white;
            line-height: 30px;
            font-size: 14px;
        }
        
        .highlight {
            font-weight: 600;
            color: #4361ee;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="logo">Bukatsu</div>
        </div>
        
        <div class="email-body">
            <div class="greeting">สวัสดีค่ะ</div>
            
            <div class="message">
                ขอบคุณที่ใช้บริการ <span class="highlight">Bukatsu</span> ของเรา นี่คือรหัส OTP สำหรับการยืนยันตัวตนของคุณ
            </div>
            
            <div class="otp-container">
                <div class="otp-code">${otp}</div>
                <div class="expiry">รหัสนี้จะหมดอายุใน 5 นาที</div>
            </div>
            
            <div class="message">
                กรุณาใส่รหัส OTP นี้ในเว็บไซต์หรือแอปพลิเคชัน เพื่อดำเนินการต่อ
            </div>
            
            <div class="note">
                หากคุณไม่ได้ทำการร้องขอรหัส OTP นี้ กรุณาละเว้นอีเมลฉบับนี้หรือติดต่อฝ่ายสนับสนุนของเราทันที
            </div>
        </div>
        
        <div class="email-footer">
            <div class="footer-text">
                &copy; 2025 Bukatsu. สงวนลิขสิทธิ์ทั้งหมด<br>
                อีเมลนี้ถูกส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
            </div>
        </div>
    </div>
</body>
</html>`
}
