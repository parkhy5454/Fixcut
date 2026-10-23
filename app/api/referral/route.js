import { neon } from "@neondatabase/serverless";
import { verifyAdmin } from "../auth/admin.js";
import { allowRequest } from "../auth/ratelimit.js";
export async function GET(req){
  try{
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const all = searchParams.get("all");
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
    return Response.json({referrals:[],error:String(e)});
  }
}
export async function POST(req){try{const {referrerCode,referredName,referredEmail}=await req.json(); if(!process.env.DATABASE_URL) return Response.json({ok:true,mock:true}); const sql=neon(process.env.DATABASE_URL); if(!(await allowRequest(req, sql, "referral", 10, 600))) return Response.json({ok:false,error:"요청이 너무 많습니다. 잠시 후 다시 시도해 주세요"},{status:429});; await sql`CREATE TABLE IF NOT EXISTS referrals (id SERIAL PRIMARY KEY, referrer_code TEXT, referred_name TEXT, referred_email TEXT, created_at TIMESTAMP DEFAULT NOW())`; await sql`INSERT INTO referrals (referrer_code, referred_name, referred_email) VALUES (${referrerCode}, ${referredName}, ${referredEmail})`; return Response.json({ok:true});}catch(e){return Response.json({ok:false,error:String(e)},{status:500});}}
