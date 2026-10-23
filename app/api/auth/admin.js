import { neon } from "@neondatabase/serverless";
import { checkSession } from "./password.js";

// 관리자 검증: 로그인 토큰이 맞고 DB의 is_admin = true 인 회원만 통과
export async function verifyAdmin(req){
  if(!process.env.DATABASE_URL) return {ok:false, status:503};
  const email = (req.headers.get("x-user-email") || "").trim().toLowerCase();
  if(!email) return {ok:false, status:401};
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT password, is_admin FROM users WHERE LOWER(email)=${email} LIMIT 1`;
  if(rows.length === 0 || !checkSession(req, email, rows[0].password)) return {ok:false, status:401};
  if(rows[0].is_admin !== true) return {ok:false, status:403};
  return {ok:true, sql};
}
