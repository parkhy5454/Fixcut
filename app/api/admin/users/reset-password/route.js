import { randomBytes } from "crypto";
import { verifyAdmin } from "../../../auth/admin.js";
import { writeAudit } from "../../../auth/audit.js";
import { ensureUserColumns, phoneHash } from "../../../auth/crypto.js";
import { hashPassword } from "../../../auth/password.js";

// 관리자가 회원의 이름과 가입 휴대폰 번호를 확인한 뒤 임시 비밀번호를 발급한다.
// 회원은 다음 로그인 때 반드시 새 비밀번호를 설정해야 한다. 모든 발급은 감사 로그에 남는다.
const LETTERS = "abcdefghjkmnpqrstuvwxyz";
const DIGITS = "23456789";
const pick = (set, n) => Array.from(randomBytes(n)).map(x => set[x % set.length]).join("");

export async function POST(req){
  try{
    const v = await verifyAdmin(req);
    if(!v.ok) return Response.json({ok:false, error:"관리자만 접근할 수 있습니다"}, {status:v.status});
    const { name, phone } = await req.json();
    const cleanName = String(name || "").trim();
    const cleanPhone = String(phone || "").trim();
    if(!cleanName || !cleanPhone) return Response.json({ok:false, error:"이름과 휴대폰 번호를 입력해 주세요"}, {status:400});
    const adminEmail = (req.headers.get("x-user-email") || "").trim().toLowerCase();
    await ensureUserColumns(v.sql);
    const rows = await v.sql`SELECT id, email, name FROM users WHERE phone_hash=${phoneHash(cleanPhone)} LIMIT 1`;
    if(rows.length === 0 || String(rows[0].name || "").trim() !== cleanName){
      return Response.json({ok:false, error:"이름과 휴대폰 번호가 일치하는 회원이 없습니다"}, {status:404});
    }
    const target = rows[0];
    const tempPassword = pick(LETTERS, 6) + pick(DIGITS, 4);
    // 기록에 실패하면 비밀번호도 바꾸지 않는다
    await writeAudit(v.sql, adminEmail, "reset_password", target.email, "임시 비밀번호 발급 (이름·휴대폰 확인)");
    await v.sql`UPDATE users SET password=${hashPassword(tempPassword)}, must_change_pw=TRUE WHERE id=${target.id}`;
    return Response.json({ok:true, email: target.email, tempPassword});
  }catch(e){
    console.error("reset-password", e);
    return Response.json({ok:false, error:"서버 오류가 발생했습니다"}, {status:500});
  }
}
