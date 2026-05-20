## โปรเจก: ระบบแบบสอบถามสหกิจศึกษา + ปัญหาพิเศษ + ภาวะการมีงานทำ
### สาขาวิชาเทคโนโลยีสารสนเทศและการสื่อสาร
### มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตกำแพงแสน

## Stack
- Frontend: HTML + Vanilla JS (ไม่ใช้ framework)
- Backend: Google Apps Script (Code.gs)
- Database: Google Sheets
- Hosting: GitHub Pages

## ไฟล์ในโปรเจก
- index.html — ฟอร์มนิสิต (สหกิจ + ปัญหาพิเศษ เลือก role ก่อน)
- dashboard.html — รายงานผลสหกิจ (Google Auth + Charts)
- graduate.html — ฟอร์มบัณฑิต ภาวะการมีงานทำ
- Code.gs — Google Apps Script backend

## SCRIPT_URL
https://script.google.com/macros/s/AKfycbx-E1JmP4nAeI20vUYeeamIJN9FBdmuE-6uCLP9M8K6dbFRei7Tc2JTRh_W5x_U8V-M/exec

## Google Sheets Structure
- responses: สหกิจศึกษา (57 cols)
- special: ปัญหาพิเศษ (50 cols)
- graduate: ภาวะการมีงานทำ (35 cols)
- students: ทะเบียนนิสิต (7 cols)
- config: academic_year, semester, form_token, dash_key

## Security
- form_token: 'ICT2568' (ส่งทุก POST)
- duplicate check: student_id + academic_year + report_type
- dashboard: Google Auth (suriya.p@ku.th)

## CSS Variables
--accent: #2563eb
--text: #0f172a
--muted: #64748b
--border: #e2e8f0
--bg: #f0f4f8
--card: #fff

## Code Style
- Thai language UI
- ไม่ใช้ template literal ซ้อนกัน (ใช้ string concat แทน)
- event handler: onchange ไม่ใช้ onclick สำหรับ radio/checkbox
- ฟังก์ชันที่ต้องเรียกจาก onclick ให้ประกาศเป็น window.xxx = function()
- ทุก submit ต้องส่ง form_token และ report_type