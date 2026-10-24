import { neon } from "@neondatabase/serverless";
import { checkSession } from "../auth/password.js";
import { allowRequest } from "../auth/ratelimit.js";
import { confirmRewards } from "../auth/referral.js";
import { encryptField, encryptJson, ensureSavingColumns } from "../auth/crypto.js";
export async function POST(req){
  try{
    const body = await req.json();
    if(!process.env.DATABASE_URL && process.env.NODE_ENV === "production") return Response.json({ok:false, error:"서버 설정 오류입니다"}, {status:503});
    if(!process.env.DATABASE_URL) return Response.json({ok:true,mock:true});
    const sql = neon(process.env.DATABASE_URL);
    // 토큰이 유효한 회원이면 회원 이메일과 함께 저장, 아니면 비회원 기록으로 저장
    let owner = null;
    const email = (body.email||"").trim().toLowerCase();
    if(email){
      const users = await sql`SELECT password FROM users WHERE LOWER(email)=${email} LIMIT 1`;
      if(users.length > 0 && checkSession(req, email, users[0].password)) owner = email;
    }

    // 비회원은 IP당 10분에 10회, 회원은 30회까지만 저장 가능 (테이블 생성 전에 막는다)
    const lim = owner ? 30 : 10;
    if(!(await allowRequest(req, sql, owner ? "save_member" : "save_anon", lim, 600))) return Response.json({ok:false,error:"요청이 너무 많습니다. 잠시 후 다시 시도해 주세요"},{status:429});
    await sql`CREATE TABLE IF NOT EXISTS savings (
      id SERIAL PRIMARY KEY,
      name TEXT,
      phone TEXT,
      total INT,
      details JSONB,
      inputs JSONB,
      carrier TEXT,
      phone_fee TEXT,
      data_usage TEXT,
      ott JSONB,
      loans JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )`;
    // add columns if old table exists
    try{
      await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS inputs JSONB`;
      await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS carrier TEXT`;
      await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS phone_fee TEXT`;
      await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS data_usage TEXT`;
      await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS ott JSONB`;
      await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS loans JSONB`;
      await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS email TEXT`;
    }catch(e){}
    await ensureSavingColumns(sql);

    // 전화번호와 금액·항목 데이터는 암호화해서 저장한다 (평문 열은 비워 둔다)
    await sql`INSERT INTO savings (name, phone_enc, total, details_enc, inputs_enc, carrier, phone_fee, data_usage, ott_enc, loans_enc, email)
      VALUES (
        ${body.name||""},
        ${encryptField(body.phone||"")},
        ${body.total||0},
        ${encryptJson(body.details||[])},
        ${encryptJson(body.inputs||{})},
        ${body.inputs?.carrier||body.carrier||""},
        ${body.inputs?.phoneFee||body.phoneFee||""},
        ${body.inputs?.dataUsage||body.dataUsage||""},
        ${encryptJson(body.inputs?.ott||body.ott||{})},
        ${encryptJson(body.inputs?.loans||body.loans||[])},
        ${owner}
      )`;
    if(owner){ try{ await confirmRewards(sql, owner); }catch(e){ console.error("confirm rewards", e); } }
    return Response.json({ok:true});
  }catch(e){
    return Response.json({ok:false,error:"서버 오류가 발생했습니다"},{status:500});
  }
}
