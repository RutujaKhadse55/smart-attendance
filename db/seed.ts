// db/seed.ts
import { db } from './schema';
export const seedDefaultAdmin = async () => {
  await db.execAsync(`
    INSERT OR IGNORE INTO users (username, password, role)
    VALUES ('admin', 'admin123', 'Admin');
  `);
};
