import { neon } from "@neondatabase/serverless";
import { verifyAdmin } from "../auth/admin.js";
export async function GET(req){
  try{
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const all = searchParams.get("all");
    if(!process.env.DATABASE_URL && process.env.NODE_ENV === "production") return Response.json({ok:false, error:"서버 설정 오류입니다"}, {status:503});
    if(!process.env.DATABASE_URL){ return Response.json({referrals:[]}); }
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS referrals (id SERIAL PRIMARY KEY, referrer_code TEXT, referred_name TEXT, referred_email TEXT, created_at TIMESTAMP DEFAULT NOW())`;
    if(all){
      // 전체 추천 목록(이메일 포함)은 관리자만
      const v = await verifyAdmin(req);
      if(!v.ok) return Response.json({referrals:[], error:"관리자만 접근할 수 있습니다"}, {status:v.status});
      const rows=await sql`SELECT * FROM referrals ORDER BY id DESC LIMIT 200`;
      return Response.json({referrals:rows});
    }
    if(!code) return Response.json({referrals:[]});
    // 내 추천 목록: 이메일은 빼고 이름과 날짜만
    const rows=await sql`SELECT id, referred_name, created_at FROM referrals WHERE referrer_code=${code} ORDER BY id DESC`;
    return Response.json({referrals:rows});
  }catch(e){
    return Response.json({referrals:[],error:"서버 오류가 발생했습니다"});
  }
}
export async function POST(){ return Response.json({ok:false, error:"추천은 회원가입 시 자동으로 연결됩니다"}, {status:410}); }
