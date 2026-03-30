/**
 * ===== 樂點創意 工作人員教學驗收系統 — Google Apps Script =====
 *
 * 部署步驟：
 * 1. 開啟 Google Sheets，建立新的試算表
 * 2. 點選「擴充功能」→「Apps Script」
 * 3. 將此檔案的內容貼上，取代預設的 Code.gs
 * 4. 點選「部署」→「新增部署作業」
 * 5. 類型選「網頁應用程式」
 * 6. 「誰可以存取」設為「所有人」
 * 7. 點選「部署」，複製產生的網址
 * 8. 將網址貼回 js/app.js 中的 APP.API_URL
 *
 * 試算表結構會自動建立。
 */

// ===== 設定 =====
const SHEET_NAME = '驗收記錄';
const HEADERS = ['時間戳', '姓名', '主題', '崗位', '分數', '總題數', '答對題數', '是否通過', '通過項目', '未通過項目'];

// ===== 初始化工作表 =====
function initSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground('#1a237e');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');

    // 設定欄寬
    sheet.setColumnWidth(1, 160); // 時間戳
    sheet.setColumnWidth(2, 80);  // 姓名
    sheet.setColumnWidth(3, 100); // 主題
    sheet.setColumnWidth(4, 120); // 崗位
    sheet.setColumnWidth(5, 60);  // 分數
    sheet.setColumnWidth(6, 60);  // 總題數
    sheet.setColumnWidth(7, 80);  // 答對題數
    sheet.setColumnWidth(8, 80);  // 是否通過
    sheet.setColumnWidth(9, 300); // 通過項目
    sheet.setColumnWidth(10, 300); // 未通過項目

    // 凍結標題列
    sheet.setFrozenRows(1);
  }

  return sheet;
}

// ===== POST：寫入驗收記錄 =====
function doPost(e) {
  try {
    const sheet = initSheet();
    const data = JSON.parse(e.postData.contents);

    const row = [
      data.timestamp || new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
      data.name || '',
      data.theme || '',
      data.station || '',
      data.score || 0,
      data.total || 0,
      data.correct || 0,
      data.passed || '',
      data.passedItems || '',
      data.failedItems || '',
    ];

    // 插入到第2列（標題列之後），讓最新記錄在最上面
    sheet.insertRowAfter(1);
    sheet.getRange(2, 1, 1, row.length).setValues([row]);

    // 設定通過/未通過的顏色
    const passedCell = sheet.getRange(2, 8);
    if (data.passed === '通過') {
      passedCell.setBackground('#e8f5e9').setFontColor('#2e7d32');
    } else {
      passedCell.setBackground('#ffebee').setFontColor('#c62828');
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: '記錄已儲存' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== GET：讀取驗收記錄 =====
function doGet(e) {
  try {
    const action = e.parameter.action || 'getRecords';

    if (action === 'getRecords') {
      return getRecords(e);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getRecords(e) {
  const sheet = initSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify({ records: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();

  // 可選的篩選參數
  const filterTheme = e.parameter.theme || '';
  const filterStation = e.parameter.station || '';

  let records = data.map(row => ({
    timestamp: row[0],
    name: row[1],
    theme: row[2],
    station: row[3],
    score: row[4],
    total: row[5],
    correct: row[6],
    passed: row[7],
    passedItems: row[8],
    failedItems: row[9],
  }));

  // 篩選
  if (filterTheme) {
    records = records.filter(r => r.theme === filterTheme);
  }
  if (filterStation) {
    records = records.filter(r => r.station === filterStation);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ records: records }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== 手動初始化（首次使用時執行一次）=====
function setup() {
  initSheet();
  SpreadsheetApp.getUi().alert('✅ 工作表已初始化完成！');
}
