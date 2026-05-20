// ============================================================
//  Code.gs — สหกิจศึกษา + ปัญหาพิเศษ + ภาวะการมีงานทำ
//  สาขาวิชาเทคโนโลยีสารสนเทศและการสื่อสาร
//  ม.เกษตรศาสตร์ กำแพงแสน
// ============================================================

var SS = SpreadsheetApp.getActiveSpreadsheet();

// ── Sheet names ──────────────────────────────────────────────
var SHEET_RESPONSES = 'responses';   // สหกิจศึกษา  (57 cols)
var SHEET_SPECIAL   = 'special';     // ปัญหาพิเศษ  (50 cols)
var SHEET_GRADUATE  = 'graduate';    // ภาวะการมีงานทำ (35 cols)
var SHEET_STUDENTS  = 'students';    // ทะเบียนนิสิต (7 cols)
var SHEET_PROJECTS  = 'projects';    // ทะเบียนโปรเจกปัญหาพิเศษ (6 cols)
var SHEET_CONFIG    = 'config';      // academic_year, semester, form_token, dash_key

// ── Security ─────────────────────────────────────────────────
var FORM_TOKEN = 'ICT2568';

// ── Multi-select fields (เก็บเป็น comma-separated ใน sheet) ──
var ARRAY_FIELDS_COOP = [
  'apply_process','plo_weak','lang','db','framework','tools','other_skills','training_type'
];
var ARRAY_FIELDS_SPECIAL = [
  'pre_clo_weak','plo_weak','soft_skills_weak','lang','db','framework','tools','other_skills'
];
var ARRAY_FIELDS_GRADUATE = [
  'job_type','find_job_method','skills_used',
  'search_method','job_obstacle','skills_needed',
  'no_job_reason','competency_future'
];

// ── Column order ต้องตรงกับ header ใน Google Sheets ──────────
// ปรับให้ตรงกับ sheet จริงของคุณ
var COLUMNS_COOP = [
  'timestamp','student_id','first_name','last_name','program','advisor',
  'company','business_type','academic_year','semester','report_type',
  'job_title','need_coding','job_type','apply_process',
  'clo1','work_used','clo2','clo3','clo4','clo5','plo_weak',
  'training_type','univ_ready','useful_subject','add_subject',
  'lang','db','framework','tools','other_skills',
  'ai_use','ai_tools','data_privacy',
  'salary','expense',
  'advisor_care','advisor_feedback',
  'future_it','employment_status',
  // branch: มีงานทำ
  'post_job_title','post_job_type','work_type','org_type','company_name',
  'time_to_job','find_job_method','salary_range','job_match',
  'job_satisfaction','knowledge_sufficiency','coop_helped_job','skills_used','invited_back',
  // branch: กำลังหางาน
  'searching_duration','search_method','job_obstacle',
  // branch shared
  'skills_needed',
  // branch: ยังไม่ได้หางาน
  'no_job_reason','future_plan',
  // branch: ศึกษาต่อ
  'study_level','study_field','study_reason','study_ready',
  'recommend','advice_junior','advice_curriculum','other_feedback',
  'form_token','submitted_at'
];

var COLUMNS_SPECIAL = [
  'timestamp','student_id','first_name','last_name','program','advisor',
  'academic_year','semester','report_type',
  'project_name','project_type','project_team','project_members',
  'pre_clo_weak',
  'clo1','clo1_detail','clo2','clo3','clo4','clo5',
  'soft_skills_weak','plo_weak',
  'univ_ready','useful_subject','add_subject',
  'lang','db','framework','tools','other_skills',
  'ai_use','ai_tools','data_privacy',
  'project_difficulty','project_presented','project_continued','project_satisfaction',
  'advisor_care','advisor_feedback',
  'future_it','employment_status',
  // branch: มีงานทำ
  'job_title','job_type','work_type','org_type','company_name',
  'time_to_job','find_job_method','salary_range','job_match',
  'job_satisfaction','knowledge_sufficiency','special_helped_job','skills_used',
  // branch: กำลังหางาน
  'searching_duration','search_method','job_obstacle',
  // branch shared
  'skills_needed',
  // branch: ยังไม่ได้หางาน
  'no_job_reason','future_plan',
  // branch: ศึกษาต่อ
  'study_level','study_field','study_reason','study_ready',
  'advice_junior','advice_curriculum','other_feedback',
  'form_token','submitted_at'
];

var COLUMNS_GRADUATE = [
  'timestamp','student_id','first_name','last_name','program','advisor',
  'academic_year','semester','report_type',
  'future_it','employment_status',
  'job_title','job_type','work_type','org_type','company_name',
  'time_to_job','find_job_method','salary_range','job_match',
  'job_satisfaction','knowledge_sufficiency',
  'from_coop_company','coop_helped_job','skills_used',
  'searching_duration','search_method','job_obstacle',
  'no_job_reason','future_plan',
  'study_level','study_field','study_reason','study_ready',
  'skills_needed',
  'competency_future','advice_curriculum','other_feedback',
  'form_token','submitted_at'
];

// ============================================================
//  doGet — GET requests
// ============================================================
function doGet(e) {
  var action = (e.parameter && e.parameter.action) ? e.parameter.action : '';
  var result;

  try {
    switch (action) {
      case 'getConfig':
        result = getConfig();
        break;

      case 'getData':
        var type = (e.parameter.type) ? e.parameter.type : 'coop';
        result = getData(type);
        break;

      case 'lookup':
        result = lookupStudent(e.parameter.id || '');
        break;

      default:
        result = { error: 'unknown action: ' + action };
    }
  } catch (err) {
    result = { error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
//  doPost — POST requests (form submission)
// ============================================================
function doPost(e) {
  var result;
  try {
    var payload = JSON.parse(e.postData.contents);
    result = saveData(payload);
  } catch (err) {
    result = { status: 'error', message: err.toString() };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
//  getConfig — อ่านค่าจาก sheet config
// ============================================================
function getConfig() {
  var sheet = SS.getSheetByName(SHEET_CONFIG);
  if (!sheet) return { academic_year: '2568', semester: '2', form_token: FORM_TOKEN };

  var data = sheet.getDataRange().getValues();
  var cfg = {};
  for (var i = 0; i < data.length; i++) {
    var key = String(data[i][0] || '').trim();
    var val = String(data[i][1] || '').trim();
    if (key) cfg[key] = val;
  }
  return cfg;
}

// ============================================================
//  getData — ดึงข้อมูลจาก sheet ตาม type
//  type: 'coop' | 'special' | 'graduate'
// ============================================================
function getData(type) {
  var sheetName, arrayFields;

  if (type === 'graduate') {
    sheetName   = SHEET_GRADUATE;
    arrayFields = ARRAY_FIELDS_GRADUATE;
  } else if (type === 'special') {
    sheetName   = SHEET_SPECIAL;
    arrayFields = ARRAY_FIELDS_SPECIAL;
  } else {
    sheetName   = SHEET_RESPONSES;
    arrayFields = ARRAY_FIELDS_COOP;
  }

  var sheet = SS.getSheetByName(sheetName);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    // ข้ามแถวว่าง
    if (!row[0] && !row[1]) continue;

    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      if (!key) continue;
      var val = row[j];

      if (arrayFields.indexOf(key) >= 0) {
        var str = String(val || '').trim();
        obj[key] = str
          ? str.split(',').map(function(v) { return v.trim(); }).filter(function(v) { return v; })
          : [];
      } else {
        obj[key] = (val !== null && val !== undefined) ? String(val) : '';
      }
    }

    if (obj['student_id']) rows.push(obj);
  }

  return rows;
}

// ============================================================
//  lookupStudent — ค้นหานิสิตจาก students sheet
//                  และดึงข้อมูลโปรเจกจาก projects sheet (ถ้ามี)
// ============================================================
function lookupStudent(id) {
  id = String(id || '').trim();
  if (!id || id.length !== 10) {
    return { found: false, message: 'รหัสนิสิตต้องมี 10 หลัก' };
  }

  // ── ค้นหาข้อมูลนิสิต ──
  var sheet = SS.getSheetByName(SHEET_STUDENTS);
  if (!sheet) return { found: false, message: 'ไม่พบ sheet students' };

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { found: false };

  var headers = data[0].map(function(h) { return String(h).trim(); });
  var idCol = headers.indexOf('student_id');
  if (idCol < 0) idCol = 0;

  var result = null;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol] || '').trim() === id) {
      result = { found: true };
      for (var j = 0; j < headers.length; j++) {
        if (headers[j]) result[headers[j]] = String(data[i][j] || '');
      }
      break;
    }
  }
  if (!result) return { found: false, message: 'ไม่พบรหัสนิสิตนี้' };

  // ── ค้นหาข้อมูลโปรเจกจาก projects sheet ──
  var projSheet = SS.getSheetByName(SHEET_PROJECTS);
  result.project_found = false;
  if (projSheet) {
    var projData = projSheet.getDataRange().getValues();
    if (projData.length > 1) {
      var ph = projData[0].map(function(h) { return String(h).trim(); });
      var pidCol = ph.indexOf('student_id');
      if (pidCol < 0) pidCol = 0;
      for (var k = 1; k < projData.length; k++) {
        if (String(projData[k][pidCol] || '').trim() === id) {
          for (var l = 0; l < ph.length; l++) {
            if (ph[l] && ph[l] !== 'student_id') {
              result[ph[l]] = String(projData[k][l] || '');
            }
          }
          result.project_found = true;
          break;
        }
      }
    }
  }

  return result;
}

// ============================================================
//  saveData — บันทึกข้อมูลลง sheet
// ============================================================
function saveData(payload) {
  // ── Token check ──
  if (String(payload.form_token || '') !== FORM_TOKEN) {
    return { status: 'error', message: 'invalid token' };
  }

  var reportType = String(payload.report_type || 'coop');
  var sheetName, arrayFields, columns;

  if (reportType === 'graduate') {
    sheetName   = SHEET_GRADUATE;
    arrayFields = ARRAY_FIELDS_GRADUATE;
    columns     = COLUMNS_GRADUATE;
  } else if (reportType === 'special') {
    sheetName   = SHEET_SPECIAL;
    arrayFields = ARRAY_FIELDS_SPECIAL;
    columns     = COLUMNS_SPECIAL;
  } else {
    sheetName   = SHEET_RESPONSES;
    arrayFields = ARRAY_FIELDS_COOP;
    columns     = COLUMNS_COOP;
  }

  var sheet = SS.getSheetByName(sheetName);
  if (!sheet) return { status: 'error', message: 'sheet not found: ' + sheetName };

  // ── Duplicate check: student_id + academic_year ──
  var studentId    = String(payload.student_id    || '').trim();
  var academicYear = String(payload.academic_year || '').trim();

  if (studentId) {
    var existing = sheet.getDataRange().getValues();
    if (existing.length > 1) {
      var headers = existing[0].map(function(h) { return String(h).trim(); });
      var idCol   = headers.indexOf('student_id');
      var yrCol   = headers.indexOf('academic_year');
      for (var i = 1; i < existing.length; i++) {
        var rowId = String(existing[i][idCol] || '').trim();
        var rowYr = String(existing[i][yrCol] || '').trim();
        if (rowId === studentId && rowYr === academicYear) {
          return { status: 'duplicate', message: 'ส่งแบบสอบถามนี้แล้ว' };
        }
      }
    }
  }

  // ── Build row ──
  var now = new Date();
  var thaiTime = Utilities.formatDate(now, 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');
  payload['timestamp']    = thaiTime;
  payload['submitted_at'] = thaiTime;

  var row = columns.map(function(col) {
    var val = payload[col];
    if (val === undefined || val === null) return '';
    if (Array.isArray(val)) return val.join(',');
    return String(val);
  });

  sheet.appendRow(row);
  return { status: 'ok' };
}

// ============================================================
//  setupHeaders — รันครั้งเดียวเพื่อสร้าง header row
//  วิธีใช้: Apps Script Editor → เลือกฟังก์ชัน setupHeaders → กด ▶ เรียกใช้
// ============================================================
function setupHeaders() {
  var sheets = [
    { name: SHEET_RESPONSES, cols: COLUMNS_COOP },
    { name: SHEET_SPECIAL,   cols: COLUMNS_SPECIAL },
    { name: SHEET_GRADUATE,  cols: COLUMNS_GRADUATE },
    { name: SHEET_PROJECTS,  cols: ['student_id','project_name','project_type','project_team','project_members','academic_year'] },
  ];

  sheets.forEach(function(s) {
    var sheet = SS.getSheetByName(s.name);
    if (!sheet) {
      sheet = SS.insertSheet(s.name);
      Logger.log('สร้าง sheet ใหม่: ' + s.name);
    }
    var existing = sheet.getLastRow();
    if (existing === 0) {
      // sheet ว่าง — ใส่ header แถวแรก
      sheet.appendRow(s.cols);
      Logger.log('ใส่ header: ' + s.name);
    } else {
      var firstRow = sheet.getRange(1, 1, 1, s.cols.length).getValues()[0];
      var hasHeader = firstRow[0] !== '' && firstRow[0] !== null;
      if (!hasHeader) {
        sheet.insertRowBefore(1);
        sheet.getRange(1, 1, 1, s.cols.length).setValues([s.cols]);
        Logger.log('แทรก header แถวแรก: ' + s.name);
      } else {
        Logger.log('มี header แล้ว (ข้าม): ' + s.name);
      }
    }
  });

  SpreadsheetApp.flush();
  Logger.log('setupHeaders เสร็จแล้ว');
}

// ============================================================
//  fixResponsesHeader — แทรก header แถวแรกใน responses sheet
//  ใช้เมื่อ sheet มีข้อมูลแล้วแต่ยังไม่มี header
//  วิธีใช้: เลือกฟังก์ชัน fixResponsesHeader → กด ▶ เรียกใช้
// ============================================================
function fixResponsesHeader() {
  var sheet = SS.getSheetByName(SHEET_RESPONSES);
  if (!sheet) { Logger.log('ไม่พบ sheet responses'); return; }
  sheet.insertRowBefore(1);
  sheet.getRange(1, 1, 1, COLUMNS_COOP.length).setValues([COLUMNS_COOP]);
  SpreadsheetApp.flush();
  Logger.log('แทรก header เสร็จแล้ว (' + COLUMNS_COOP.length + ' columns)');
}
