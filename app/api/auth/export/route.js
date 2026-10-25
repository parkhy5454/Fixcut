import { neon } from "@neondatabase/serverless";
import { checkSession } from "../password.js";
import { openPhone, openSaving, ensureUserColumns, ensureSavingColumns } from "../crypto.js";
import { ensureTables } from "../referral.js";
// 개인정보 열람: 본인 정보, 진단 기록, 포인트 내역을 JSON 파일로 내려준다 (비밀번호 해시는 제외)
export async function GET(req){
  try{
    const email = (req.headers.get("x-user-email") || "").trim().toLowerCase();
    if(!email) return Response.json({ok:false, error:"이메일이 필요합니다"}, {status:400});
    if(!process.env.DATABASE_URL) return Response.json({ok:false, error:"서버 설정 오류입니다"}, {status:503});
    const sql = neon(process.env.DATABASE_URL);
    await ensureUserColumns(sql);
    await ensureTables(sql);
    const users = await sql`SELECT id, name, phone, phone_enc, email, password, created_at, terms_version, terms_agreed_at, verified_at, suspended_at FROM users WHERE LOWER(email)=${email} LIMIT 1`;
    if(users.length === 0 || !checkSession(req, email, users[0].password)){
      return Response.json({ok:false, error:"로그인이 필요합니다"}, {status:401});
    }
    const u = users[0];
    if(u.suspended_at) return Response.json({ok:false, error:"이용이 정지된 계정입니다"}, {status:403});

    let diagnoses = [];
    try{
      await ensureSavingColumns(sql);
      const rows = await sql`SELECT id, name, total, carrier, phone_fee, data_usage, phone, phone_enc, details, details_enc, inputs, inputs_enc, loans, loans_enc, ott, ott_enc, created_at FROM savings WHERE LOWER(email)=${email} ORDER BY id`;
      diagnoses = rows.map(openSaving);
    }catch(e){ console.error("export savings", e); }
    const points = await sql`SELECT reason, ref_email, amount, status, created_at, confirmed_at, expires_at FROM point_ledger WHERE LOWER(email)=${email} ORDER BY id`;

    const body = {
      exported_at: new Date().toISOString(),
      profile: {
        name: u.name, phone: openPhone(u), email: u.email, created_at: u.created_at,
        terms_version: u.terms_version, terms_agreed_at: u.terms_agreed_at, verified_at: u.verified_at,
      },
      diagnoses,
      points,
    };
    return new Response(JSON.stringify(body, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="fixcut-my-data.json"',
        "Cache-Control": "no-store",
      },
    });
  }catch(e){
    console.error("export", e);
    return Response.json({ok:false, error:"서버 오류가 발생했습니다"}, {status:500});
  }
}
