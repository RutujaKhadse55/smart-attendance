// db/queries.ts - FIXED VERSION
import { db } from './schema';

// ============ USER MANAGEMENT ============

export const getUserByCredentials = async (username: string, password: string) => {
  const rows = await db.getAllAsync<{ id: number; username: string; role: string }>(
    'SELECT * FROM users WHERE username = ? AND password = ? LIMIT 1;',
    [username, password]
  );
  return rows.length ? rows[0] : null;
};

export const createUser = async (
  username: string,
  password: string,
  role: 'Admin' | 'Attendance Teacher' | 'Batch Teacher'
) => {
  const result = await db.runAsync(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?);',
    [username, password, role]
  );
  return result.lastInsertRowId;
};

export const listTeachers = async () => {
  return await db.getAllAsync(
    "SELECT * FROM users WHERE role IN ('Attendance Teacher', 'Batch Teacher') ORDER BY username ASC;"
  );
};

// ============ BATCH MANAGEMENT ============

export const upsertBatch = async (batchId: string, batchName: string) => {
  await db.runAsync(
    'INSERT OR REPLACE INTO batches (batchId, batchName) VALUES (?, ?);',
    [batchId, batchName]
  );
};

export const deleteBatch = async (batchId: string) => {
  await db.runAsync('DELETE FROM batches WHERE batchId = ?;', [batchId]);
};

export const listBatches = async () => {
  return await db.getAllAsync<{ batchId: string; batchName: string }>(
    'SELECT * FROM batches ORDER BY batchName ASC;'
  );
};

// ============ TEACHER-BATCH ASSIGNMENTS ============

export const assignTeacherToBatch = async (teacherId: number, batchId: string) => {
  await db.runAsync(
    'INSERT OR IGNORE INTO teacherAssignments (teacherId, batchId) VALUES (?, ?);',
    [teacherId, batchId]
  );
};

export const removeTeacherFromBatch = async (teacherId: number, batchId: string) => {
  await db.runAsync(
    'DELETE FROM teacherAssignments WHERE teacherId = ? AND batchId = ?;',
    [teacherId, batchId]
  );
};

export const getTeacherAssignments = async (teacherId: number) => {
  return await db.getAllAsync(
    `SELECT b.* FROM batches b
     INNER JOIN teacherAssignments ta ON b.batchId = ta.batchId
     WHERE ta.teacherId = ?
     ORDER BY b.batchName ASC;`,
    [teacherId]
  );
};

export const getBatchAssignments = async (batchId: string) => {
  return await db.getAllAsync(
    `SELECT u.id, u.username, u.role FROM users u
     INNER JOIN teacherAssignments ta ON u.id = ta.teacherId
     WHERE ta.batchId = ?;`,
    [batchId]
  );
};

export const listTeacherBatches = async (teacherId: number) => {
  const rows = await db.getAllAsync<{ batchId: string }>(
    'SELECT batchId FROM teacherAssignments WHERE teacherId = ?;',
    [teacherId]
  );
  return rows.map(r => r.batchId);
};

// ============ STUDENT MANAGEMENT ============

export const upsertStudent = async (student: {
  prn: string;
  name: string;
  email?: string;
  mobile?: string;
  parentMobile?: string;
  batchId?: string | null;
}) => {
  await db.runAsync(
    `INSERT OR REPLACE INTO students (prn, name, email, mobile, parentMobile, batchId)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [
      student.prn, 
      student.name, 
      student.email || '', 
      student.mobile || '', 
      student.parentMobile || '', 
      student.batchId || null
    ]
  );
};

export const listStudentsByBatch = async (batchId?: string) => {
  if (batchId) {
    return await db.getAllAsync(
      'SELECT * FROM students WHERE batchId = ? ORDER BY name ASC;',
      [batchId]
    );
  }
  return await db.getAllAsync('SELECT * FROM students ORDER BY name ASC;');
};

export const listStudentsForTeacher = async (teacherId: number, userRole: string) => {
  if (userRole === 'Attendance Teacher' || userRole === 'Admin') {
    return await db.getAllAsync('SELECT * FROM students ORDER BY batchId, name ASC;');
  } else if (userRole === 'Batch Teacher') {
    return await db.getAllAsync(
      `SELECT DISTINCT s.* FROM students s
       INNER JOIN teacherAssignments ta ON s.batchId = ta.batchId
       WHERE ta.teacherId = ?
       ORDER BY s.batchId, s.name ASC;`,
      [teacherId]
    );
  }
  return [];
};

export const deleteStudent = async (prn: string) => {
  await db.runAsync('DELETE FROM students WHERE prn = ?;', [prn]);
};

// ============ ATTENDANCE MANAGEMENT (FIXED) ============

export const markAttendance = async (
  studentPrn: string,
  date: string,
  status: 'Present' | 'Absent',
  updatedAt: string
) => {
  await db.runAsync(
    `INSERT OR REPLACE INTO attendance (studentPrn, date, status, updatedAt)
     VALUES (?, ?, ?, ?);`,
    [studentPrn, date, status, updatedAt]
  );
};

export const getAttendanceByDate = async (date: string, teacherId?: number, userRole?: string) => {
  if (userRole === 'Batch Teacher' && teacherId) {
    return await db.getAllAsync(
      `SELECT a.*, s.name, s.batchId FROM attendance a
       INNER JOIN students s ON a.studentPrn = s.prn
       INNER JOIN teacherAssignments ta ON s.batchId = ta.batchId
       WHERE a.date = ? AND ta.teacherId = ?
       ORDER BY s.batchId, s.name ASC;`,
      [date, teacherId]
    );
  }
  return await db.getAllAsync(
    `SELECT a.*, s.name, s.batchId FROM attendance a
     INNER JOIN students s ON a.studentPrn = s.prn
     WHERE a.date = ?
     ORDER BY s.batchId, s.name ASC;`,
    [date]
  );
};

// FIXED: getAttendanceSummaryByDate with proper aggregate handling
export const getAttendanceSummaryByDate = async (date: string, teacherId?: number, userRole?: string) => {
  console.log('getAttendanceSummaryByDate called with:', { date, teacherId, userRole });
  
  try {
    if (userRole === 'Batch Teacher' && teacherId) {
      // Summary for assigned batches only
      const totalResult = await db.getAllAsync<{ total: number }>(
        `SELECT COUNT(DISTINCT s.prn) as total FROM students s
         INNER JOIN teacherAssignments ta ON s.batchId = ta.batchId
         WHERE ta.teacherId = ?;`,
        [teacherId]
      );
      
      const presentResult = await db.getAllAsync<{ present: number }>(
        `SELECT COUNT(DISTINCT a.studentPrn) as present FROM attendance a
         INNER JOIN students s ON a.studentPrn = s.prn
         INNER JOIN teacherAssignments ta ON s.batchId = ta.batchId
         WHERE a.date = ? AND a.status = ? AND ta.teacherId = ?;`,
        [date, 'Present', teacherId]
      );
      
      const absentResult = await db.getAllAsync<{ absent: number }>(
        `SELECT COUNT(DISTINCT a.studentPrn) as absent FROM attendance a
         INNER JOIN students s ON a.studentPrn = s.prn
         INNER JOIN teacherAssignments ta ON s.batchId = ta.batchId
         WHERE a.date = ? AND a.status = ? AND ta.teacherId = ?;`,
        [date, 'Absent', teacherId]
      );
      
      return {
        total: totalResult[0]?.total || 0,
        present: presentResult[0]?.present || 0,
        absent: absentResult[0]?.absent || 0,
      };
    }
    
    // Admin or Attendance Teacher - all students
    // Use getAllAsync instead of getFirstAsync for aggregate queries
    const totalResult = await db.getAllAsync<{ total: number }>(
      'SELECT COUNT(*) as total FROM students;'
    );
    
    console.log('Total students result:', totalResult);
    
    const presentResult = await db.getAllAsync<{ present: number }>(
      'SELECT COUNT(*) as present FROM attendance WHERE date = ? AND status = ?;',
      [date, 'Present']
    );
    
    console.log('Present students result:', presentResult);
    
    const absentResult = await db.getAllAsync<{ absent: number }>(
      'SELECT COUNT(*) as absent FROM attendance WHERE date = ? AND status = ?;',
      [date, 'Absent']
    );
    
    console.log('Absent students result:', absentResult);
    
    const summary = {
      total: totalResult[0]?.total || 0,
      present: presentResult[0]?.present || 0,
      absent: absentResult[0]?.absent || 0,
    };
    
    console.log('Final summary:', summary);
    return summary;
    
  } catch (error) {
    console.error('Error in getAttendanceSummaryByDate:', error);
    return {
      total: 0,
      present: 0,
      absent: 0,
    };
  }
};

// ============ ABSENT STUDENTS ============

export const listAbsentByDateAndBatch = async (date: string, batchId: string) => {
  return await db.getAllAsync(
    `SELECT s.*, a.status FROM students s
     LEFT JOIN attendance a ON a.studentPrn = s.prn AND a.date = ?
     WHERE s.batchId = ? AND (a.status = ? OR a.status IS NULL)
     ORDER BY s.name ASC;`,
    [date, batchId, 'Absent']
  );
};

export const listAbsentForTeacher = async (date: string, teacherId: number, userRole: string) => {
  if (userRole === 'Batch Teacher') {
    return await db.getAllAsync(
      `SELECT s.*, a.status FROM students s
       INNER JOIN teacherAssignments ta ON s.batchId = ta.batchId
       LEFT JOIN attendance a ON a.studentPrn = s.prn AND a.date = ?
       WHERE ta.teacherId = ? AND (a.status = ? OR a.status IS NULL)
       ORDER BY s.batchId, s.name ASC;`,
      [date, teacherId, 'Absent']
    );
  }
  
  return await db.getAllAsync(
    `SELECT s.*, a.status FROM students s
     LEFT JOIN attendance a ON a.studentPrn = s.prn AND a.date = ?
     WHERE (a.status = ? OR a.status IS NULL)
     ORDER BY s.batchId, s.name ASC;`,
    [date, 'Absent']
  );
};

// ============ FOLLOW-UPS ============

export const addFollowUp = async (studentPrn: string, date: string, proofPath: string, remarks: string) => {
  await db.runAsync(
    'INSERT INTO followups (studentPrn, date, proofPath, remarks) VALUES (?, ?, ?, ?);',
    [studentPrn, date, proofPath, remarks]
  );
};

export const listFollowUps = async (studentPrn: string) => {
  return await db.getAllAsync(
    'SELECT * FROM followups WHERE studentPrn = ? ORDER BY date DESC;',
    [studentPrn]
  );
};

export const listFollowUpsByDate = async (date: string) => {
  return await db.getAllAsync(
    `SELECT f.*, s.name, s.batchId FROM followups f
     INNER JOIN students s ON f.studentPrn = s.prn
     WHERE f.date = ?
     ORDER BY s.batchId, s.name ASC;`,
    [date]
  );
};

// ============ DEBUG HELPER ============

export const debugDatabaseContent = async () => {
  try {
    console.log('=== DATABASE DEBUG ===');
    
    const students = await db.getAllAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM students;'
    );
    console.log('Total students:', students[0]?.count || 0);
    
    const attendance = await db.getAllAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM attendance;'
    );
    console.log('Total attendance records:', attendance[0]?.count || 0);
    
    const batches = await db.getAllAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM batches;'
    );
    console.log('Total batches:', batches[0]?.count || 0);
    
    // Sample data
    const sampleStudents = await db.getAllAsync('SELECT * FROM students LIMIT 3;');
    console.log('Sample students:', JSON.stringify(sampleStudents, null, 2));
    
    const sampleAttendance = await db.getAllAsync('SELECT * FROM attendance LIMIT 3;');
    console.log('Sample attendance:', JSON.stringify(sampleAttendance, null, 2));
    
    console.log('=== END DEBUG ===');
    
    return {
      studentsCount: students[0]?.count || 0,
      attendanceCount: attendance[0]?.count || 0,
      batchesCount: batches[0]?.count || 0,
    };
  } catch (error) {
    console.error('Debug error:', error);
    return null;
  }
};