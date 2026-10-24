import { neon } from "@neondatabase/serverless";
import { checkSession } from "../auth/password.js";
import { ensureTables, ensureReferralCode } from "../auth/referral.js";
// 내 포인트, 적립 내역, 추천 현황 (본인 토큰이 맞아야 조회 가능)
export async function GET(req){
  try{
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email")||"").trim().toLowerCase();
    if(!email) return Response.json({ok:false, error:"email 필요"},{status:400});
    if(!process.env.DATABASE_URL && process.env.NODE_ENV === "production") return Response.json({ok:false, error:"서버 설정 오류입니다"}, {status:503});
    if(!process.env.DATABASE_URL) return Response.json({ok:true, code:null, balance:0, pending:0, items:[], referrals:[]});
    const sql = neon(process.env.DATABASE_URL);
    await ensureTables(sql);
    const users = await sql`SELECT id, password, suspended_at FROM users WHERE LOWER(email)=${email} LIMIT 1`;
    if(users.length === 0 || !checkSession(req, email, users[0].password)){
      return Response.json({ok:false, error:"로그인이 필요합니다"},{status:401});
    }
    if(users[0].suspended_at) return Response.json({ok:false, error:"이용이 정지된 계정입니다"},{status:403});
    const code = await ensureReferralCode(sql, users[0].id, email);
    const bal = await sql`SELECT COALESCE(SUM(amount),0)::int AS balance FROM point_ledger WHERE LOWER(email)=${email} AND status='confirmed' AND (expires_at IS NULL OR expires_at > NOW())`;
    const pend = await sql`SELECT COALESCE(SUM(amount),0)::int AS pending FROM point_ledger WHERE LOWER(email)=${email} AND status='pending'`;
    const items = await sql`SELECT id, amount, reason, status, created_at, confirmed_at, expires_at FROM point_ledger WHERE LOWER(email)=${email} ORDER BY id DESC LIMIT 50`;
    const referrals = code ? await sql`
      SELECT r.id, r.referred_name, r.created_at,
        EXISTS(SELECT 1 FROM point_ledger p WHERE LOWER(p.email)=LOWER(r.referred_email) AND p.reason='referral_referee' AND p.status='confirmed') AS done
      FROM referrals r WHERE r.referrer_code=${code} ORDER BY r.id DESC LIMIT 100` : [];
    return Response.json({ok:true, code, balance: bal[0].balance, pending: pend[0].pending, items, referrals});
  }catch(e){
    return Response.json({ok:false, error:"서버 오류가 발생했습니다"},{status:500});
  }
}
