import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  completionDate: string;
  certificateId: string;
  instructorName: string;
  branchName: string;
}

const TEMPLATE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate of Completion</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Montserrat:wght@400;700&family=Playfair+Display:ital,wght@1,600&display=swap');

        :root {
            --primary: #1e293b;
            --accent: #6366f1;
            --gold: #d4af37;
        }

        body {
            margin: 0;
            padding: 0;
            background: white;
            font-family: 'Montserrat', sans-serif;
            color: var(--primary);
        }

        .certificate-container {
            width: 1120px;
            height: 790px;
            padding: 40px;
            position: relative;
            background: #fff;
            border: 20px solid var(--primary);
            box-sizing: border-box;
            overflow: hidden;
        }

        .inner-border {
            width: 100%;
            height: 100%;
            border: 4px solid var(--gold);
            padding: 60px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            position: relative;
        }

        /* Decorative Elements */
        .corner {
            position: absolute;
            width: 100px;
            height: 100px;
            border-color: var(--gold);
            border-style: solid;
            pointer-events: none;
        }
        .top-left { top: 20px; left: 20px; border-width: 8px 0 0 8px; }
        .top-right { top: 20px; right: 20px; border-width: 8px 8px 0 0; }
        .bottom-left { bottom: 20px; left: 20px; border-width: 0 0 8px 8px; }
        .bottom-right { bottom: 20px; right: 20px; border-width: 0 8px 8px 0; }

        .logo {
            font-family: 'Cinzel', serif;
            font-size: 32px;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 40px;
            letter-spacing: 4px;
        }

        .certificate-header {
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 6px;
            font-weight: 700;
            color: var(--accent);
            margin-bottom: 20px;
        }

        .certificate-title {
            font-family: 'Cinzel', serif;
            font-size: 56px;
            margin: 0;
            color: var(--primary);
            line-height: 1;
        }

        .award-text {
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            font-style: italic;
            margin: 40px 0 20px;
            color: #64748b;
        }

        .student-name {
            font-size: 48px;
            font-weight: 700;
            color: var(--primary);
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
            margin-bottom: 40px;
            min-width: 400px;
        }

        .course-info {
            font-size: 20px;
            margin-bottom: 60px;
            max-width: 700px;
            line-height: 1.6;
        }

        .course-title {
            color: var(--accent);
            font-weight: 700;
        }

        .footer {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: auto;
            padding-bottom: 20px;
        }

        .signature-block {
            width: 250px;
            text-align: center;
        }

        .signature-line {
            border-top: 1px solid var(--primary);
            margin-bottom: 10px;
        }

        .signature-name {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 4px;
        }

        .signature-title {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .date-block {
            text-align: center;
        }

        .date-text {
            font-size: 14px;
            font-weight: 700;
            color: var(--primary);
        }

        .id-badge {
            position: absolute;
            bottom: 60px;
            right: 60px;
            text-align: right;
            font-size: 10px;
            color: #94a3b8;
            font-family: monospace;
        }

        .seal {
            width: 100px;
            height: 100px;
            background: var(--gold);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 900;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>
        
        <div class="inner-border">
            <div class="logo">GLOBAL COLLEGE</div>
            
            <div class="certificate-header">Certificate of Achievement</div>
            <h1 class="certificate-title">EXCELLENCE</h1>
            
            <p class="award-text">This is proudly presented to</p>
            <div class="student-name">{{studentName}}</div>
            
            <p class="course-info">
                For successfully completing all academic requirements for the course 
                <br>
                <span class="course-title">{{courseTitle}}</span>
                <br>
                offered at the <span class="course-title">{{branchName}}</span> campus.
            </p>
            
            <div class="footer">
                <div class="signature-block">
                    <div class="signature-line"></div>
                    <div class="signature-name">{{instructorName}}</div>
                    <div class="signature-title">Lead Instructor</div>
                </div>
                
                <div class="date-block">
                    <div class="date-text">Awarded on</div>
                    <div class="date-text">{{completionDate}}</div>
                </div>
                
                <div class="signature-block">
                    <div class="signature-line"></div>
                    <div class="signature-name">Registrar</div>
                    <div class="signature-title">Academic Affairs</div>
                </div>
            </div>
            
            <div class="seal">OFFICIAL SEAL</div>
            <div class="id-badge">VERIFY ID: {{certificateId}}</div>
        </div>
    </div>
</body>
</html>
`;

export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const template = handlebars.compile(TEMPLATE_HTML);
  const html = template(data);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1120, height: 790 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      width: '1120px',
      height: '790px',
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
