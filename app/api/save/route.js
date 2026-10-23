
import { neon } from '@neondatabase/serverless';
export async function POST(req) {
  try {
    const body = await req.json();
    const sql = neon(process.env.DATABASE_URL);
    const [user] = await sql`INSERT INTO users (name) VALUES (${body.name || '테스트유저'}) RETURNING id`;
    return Response.json({ success: true, userId: user.id });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
