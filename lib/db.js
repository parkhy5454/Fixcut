
import { neon } from '@neondatabase/serverless';
export function getDb(){ const url=process.env.DATABASE_URL; if(!url) return null; return neon(url); }
export async function initTables(){
  const sql=getDb(); if(!sql) return;
  await sql`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, phone TEXT, password_hash TEXT NOT NULL, referral_code TEXT, referred_by TEXT, created_at TIMESTAMP DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS diagnoses (id SERIAL PRIMARY KEY, user_id INT, phone_fee INT, data_usage FLOAT, loans JSONB, result JSONB, created_at TIMESTAMP DEFAULT NOW())`;
}
