import { verifyAdmin } from "../../auth/admin.js";
import { encryptField, decryptField } from "../../auth/crypto.js";
// 관리자 전용 설정 점검: 환경 변수가 있는지와 암호화 동작 여부만 보여 주고, 값은 보여 주지 않는다
export async function GET(req){
  try{
    const v = await verifyAdmin(req);
    if(!v.ok) return Response.json({ok:false, error:"관리자만 접근할 수 있습니다"}, {status:v.status});
    const key = process.env.FIELD_ENCRYPTION_KEY || "";
    let cryptoOk = false;
    let cryptoError = null;
    try{
      cryptoOk = decryptField(encryptField("ping")) === "ping";
    }catch(e){
      cryptoError = String(e.message || e).slice(0, 120);
    }
    let dbOk = false;
    try{ await v.sql`SELECT 1`; dbOk = true; }catch(e){ dbOk = false; }
    return Response.json({
      ok: true,
      env: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        FIELD_ENCRYPTION_KEY: key.length >= 32,
        FINLIFE_AUTH_KEY: !!process.env.FINLIFE_AUTH_KEY,
        RESEND_API_KEY: !!process.env.RESEND_API_KEY,
        MAIL_FROM: !!process.env.MAIL_FROM,
      },
      checks: { db: dbOk, encryption: cryptoOk, encryptionError: cryptoError },
    });
  }catch(e){
    return Response.json({ok:false, error:"점검 중 오류가 발생했습니다"}, {status:500});
  }
}
