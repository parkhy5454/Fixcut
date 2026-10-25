import { signText } from "./crypto.js";

// 인증번호는 평문으로 저장하지 않고 키가 섞인 HMAC으로만 보관한다
export function codeHash(email, code){
  return signText("verify|" + email + "|" + code);
}

export async function ensureVerifyTable(sql){
  await sql`CREATE TABLE IF NOT EXISTS email_verifications (
    email TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

// 비밀번호 재설정 인증번호 (인증 메일과 목적을 나눠서 해시한다)
export function resetCodeHash(email, code){
  return signText("reset|" + email + "|" + code);
}

export async function ensureResetTable(sql){
  await sql`CREATE TABLE IF NOT EXISTS password_resets (
    email TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}
