// db/schema.ts
import * as SQLite from 'expo-sqlite';

// Use openDatabaseSync instead of openDatabase
export const db = SQLite.openDatabaseSync('attendance.db');

export const initDB = async () => {
  // Users table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Admin', 'Attendance Teacher', 'Batch Teacher'))
    );
  `);

  // Batches table
  db.execAsync(`
    CREATE TABLE IF NOT EXISTS batches (
      batchId TEXT PRIMARY KEY NOT NULL,
      batchName TEXT NOT NULL
    );
  `);

  // Students table (with foreign key to batches)
  db.execAsync(`
    CREATE TABLE IF NOT EXISTS students (
      prn TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      mobile TEXT,
      parentMobile TEXT,
      batchId TEXT,
      FOREIGN KEY (batchId) REFERENCES batches(batchId) ON DELETE SET NULL
    );
  `);

  // Attendance table
  db.execAsync(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentPrn TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Present', 'Absent')),
      updatedAt TEXT NOT NULL,
      UNIQUE(studentPrn, date),
      FOREIGN KEY (studentPrn) REFERENCES students(prn) ON DELETE CASCADE
    );
  `);

  // Teacher-Batch Assignments table (NEW - for role-based access)
  db.execAsync(`
    CREATE TABLE IF NOT EXISTS teacherAssignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacherId INTEGER NOT NULL,
      batchId TEXT NOT NULL,
      UNIQUE(teacherId, batchId),
      FOREIGN KEY (teacherId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (batchId) REFERENCES batches(batchId) ON DELETE CASCADE
    );
  `);

  // Follow-ups table
  db.execAsync(`
    CREATE TABLE IF NOT EXISTS followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentPrn TEXT NOT NULL,
      date TEXT NOT NULL,
      proofPath TEXT,
      remarks TEXT,
      FOREIGN KEY (studentPrn) REFERENCES students(prn) ON DELETE CASCADE
    );
  `);

  // Create indexes for better performance
  db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batchId);
  `);

  db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
  `);

  db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_attendance_prn ON attendance(studentPrn);
  `);

  db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_teacher_assignments ON teacherAssignments(teacherId);
  `);

  db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_followups_student ON followups(studentPrn);
  `);

  console.log('Database initialized successfully');
};