import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

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

const SESSION_DAYS = 30; // 로그인 세션 유효 기간

// 비밀번호 규칙: 8자 이상, 영문과 숫자 포함. 통과하면 null, 아니면 안내 문구
export function validatePassword(pw){
  if(typeof pw !== "string" || pw.length < 8) return "비밀번호는 8자 이상이어야 합니다";
  if(!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "비밀번호에는 영문과 숫자를 함께 넣어 주세요";
  return null;
}

// 로그인 세션 토큰: "만료시각(초).HMAC" 형식. HMAC 키는 저장된 비밀번호 해시
export function makeSessionToken(email, storedPassword, expSec){
  const exp = expSec || Math.floor(Date.now()/1000) + SESSION_DAYS*86400;
  const sig = createHmac("sha256", storedPassword).update(String(email).trim().toLowerCase() + "|" + exp).digest("hex");
  return exp + "." + sig;
}

export function checkSession(req, email, storedPassword){
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if(!token || !email || !storedPassword) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if(!exp || !sig || exp < Math.floor(Date.now()/1000)) return false;
  const expected = Buffer.from(makeSessionToken(email, storedPassword, exp).split(".")[1], "hex");
  const given = Buffer.from(sig, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
