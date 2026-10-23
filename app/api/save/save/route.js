
import { neon } from "@neondatabase/serverless";
export async function POST(req) {
  try {
    const { name } = await req.json();
    if (!process.env.DATABASE_URL) { return Response.json({ success: true, mock: true }); }
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT, created_at TIMESTAMP DEFAULT NOW())`;
    await sql`INSERT INTO users (name) VALUES (${name})`;
    return Response.json({ success: true });
  } catch (e) { return Response.json({ success: false, error: e.message }, { status: 500 }); }
}
