import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// scrypt 해시로 비밀번호 저장: "scrypt$<salt>$<hash>"
export function hashPassword(pw){
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(pw, stored){
  if(!stored || typeof pw !== "string") return false;
  if(stored.startsWith("scrypt$")){
    const [, salt, hash] = stored.split("$");
    const actual = scryptSync(pw, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return expected.length === actual.length && timingSafeEqual(actual, expected);
  }
  // 예전 평문 비밀번호 호환 (로그인 성공 시 해시로 교체됨)
  return stored === pw;
}

export function isLegacyPlain(stored){
  return !!stored && !stored.startsWith("scrypt$");
}

import { createHmac } from "crypto";

// 로그인 세션 토큰: 저장된 비밀번호 해시를 키로 한 HMAC (비밀번호가 바뀌면 토큰도 무효)
export function makeSessionToken(email, storedPassword){
  return createHmac("sha256", storedPassword).update(String(email).trim().toLowerCase()).digest("hex");
}

export function checkSession(req, email, storedPassword){
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if(!token || !email || !storedPassword) return false;
  const expected = Buffer.from(makeSessionToken(email, storedPassword));
  const given = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
