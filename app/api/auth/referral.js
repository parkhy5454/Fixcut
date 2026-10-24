import { randomBytes } from "crypto";

export const REWARD = 10000;      // 적립 금액 (추천한 사람, 추천받은 사람 각각)
export const EXPIRE_MONTHS = 12;  // 적립 포인트 유효기간

export async function ensureTables(sql){
  await sql`CREATE TABLE IF NOT EXISTS referrals (id SERIAL PRIMARY KEY, referrer_code TEXT, referred_name TEXT, referred_email TEXT, created_at TIMESTAMP DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS point_ledger (id SERIAL PRIMARY KEY, email TEXT NOT NULL, reason TEXT NOT NULL, ref_email TEXT, amount INT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW(), confirmed_at TIMESTAMPTZ, expires_at TIMESTAMPTZ)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMPTZ`;
}

function makeCode(email){
  const base = (email.split("@")[0] || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "FIX";
  return base + randomBytes(3).toString("hex").toUpperCase();
}

// 회원의 추천 코드를 가져오고, 없으면 서버에서 만들어 저장한다
export async function ensureReferralCode(sql, id, email){
  const rows = await sql`SELECT referral_code FROM users WHERE id=${id} LIMIT 1`;
  if(rows[0]?.referral_code) return rows[0].referral_code;
  for(let i = 0; i < 5; i++){
    try{
      const upd = await sql`UPDATE users SET referral_code=${makeCode(email)} WHERE id=${id} AND referral_code IS NULL RETURNING referral_code`;
      if(upd.length) return upd[0].referral_code;
    }catch(e){ /* 코드 중복 등 드문 경우 재시도 */ }
    const again = await sql`SELECT referral_code FROM users WHERE id=${id} LIMIT 1`;
    if(again[0]?.referral_code) return again[0].referral_code;
  }
  return null;
}

// 추천 관계와 양쪽 대기 포인트를 함께 만든다 (회원가입 API 안에서만 호출)
export async function createReferral(sql, referrerCode, referredName, referredEmail){
  const referred = referredEmail.toLowerCase();
  const found = await sql`SELECT email FROM users WHERE referral_code=${referrerCode} LIMIT 1`;
  if(found.length === 0) return {ok:false, reason:"no_referrer"};
  const referrer = found[0].email.toLowerCase();
  if(referrer === referred) return {ok:false, reason:"self"};
  const dup = await sql`SELECT id FROM referrals WHERE LOWER(referred_email)=${referred} LIMIT 1`;
  if(dup.length) return {ok:false, reason:"duplicate"};
  await sql`INSERT INTO referrals (referrer_code, referred_name, referred_email) VALUES (${referrerCode}, ${referredName}, ${referred})`;
  await sql`INSERT INTO point_ledger (email, reason, ref_email, amount) VALUES (${referrer}, 'referral_referrer', ${referred}, ${REWARD})`;
  await sql`INSERT INTO point_ledger (email, reason, ref_email, amount) VALUES (${referred}, 'referral_referee', ${referrer}, ${REWARD})`;
  return {ok:true};
}

// 본인 인증과 첫 진단을 마친 회원의 대기 포인트를 적립 확정한다
export async function confirmRewards(sql, email){
  const e = email.toLowerCase();
  const v = await sql`SELECT verified_at FROM users WHERE LOWER(email)=${e} LIMIT 1`;
  if(!v[0]?.verified_at) return 0;
  const d = await sql`SELECT 1 FROM savings WHERE LOWER(email)=${e} LIMIT 1`;
  if(d.length === 0) return 0;
  const done = await sql`
    UPDATE point_ledger SET status='confirmed', confirmed_at=NOW(), expires_at=NOW() + make_interval(months => ${EXPIRE_MONTHS})
    WHERE status='pending' AND ((email=${e} AND reason='referral_referee') OR (reason='referral_referrer' AND ref_email=${e}))
    RETURNING id`;
  return done.length;
}
