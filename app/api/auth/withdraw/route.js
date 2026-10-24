import { neon } from "@neondatabase/serverless";
import { verifyPassword, checkSession } from "../password.js";

// 회원 탈퇴: 토큰 + 현재 비밀번호 확인 후 회원 정보와 본인 진단 기록을 삭제
export async function POST(req){
  try{
    const email = (req.headers.get("x-user-email") || "").trim().toLowerCase();
    const body = await req.json().catch(()=>({}));
    const currentPassword = body.currentPassword || "";
    if(!email || !currentPassword) return Response.json({ok:false, error:"이메일과 현재 비밀번호가 필요합니다"}, {status:400});
    if(!process.env.DATABASE_URL && process.env.NODE_ENV === "production") return Response.json({ok:false, error:"서버 설정 오류입니다"}, {status:503});
    if(!process.env.DATABASE_URL) return Response.json({ok:true, mock:true});
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT id, password FROM users WHERE LOWER(email)=${email} LIMIT 1`;
    if(rows.length === 0 || !checkSession(req, email, rows[0].password) || !verifyPassword(currentPassword, rows[0].password)){
      return Response.json({ok:false, error:"현재 비밀번호가 일치하지 않습니다"}, {status:401});
    }
    try{ await sql`DELETE FROM savings WHERE email=${email}`; }catch(e){ console.error("withdraw savings", e); }
    try{ await sql`DELETE FROM referrals WHERE LOWER(referred_email)=${email}`; }catch(e){ console.error("withdraw referrals", e); }
    try{ await sql`DELETE FROM point_ledger WHERE LOWER(email)=${email}`; }catch(e){ console.error("withdraw points", e); }
    await sql`DELETE FROM users WHERE id=${rows[0].id}`;
    return Response.json({ok:true});
  }catch(e){
    console.error(e);
    return Response.json({ok:false, error:"서버 오류가 발생했습니다"}, {status:500});
  }
}
