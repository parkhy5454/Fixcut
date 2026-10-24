import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync } from "crypto";

// 개인정보 필드 암호화 (AES-256-GCM)
// 키는 환경 변수 FIELD_ENCRYPTION_KEY 에서 읽는다. 키를 잃으면 암호화된 데이터를 복구할 수 없다.
const PREFIX = "enc:v1:";
let cachedKey = null;

function getKey(){
  if(cachedKey) return cachedKey;
  const raw = process.env.FIELD_ENCRYPTION_KEY;
  if(!raw || raw.length < 32) throw new Error("FIELD_ENCRYPTION_KEY 가 없거나 너무 짧습니다 (32자 이상)");
  cachedKey = scryptSync(raw, "fixcut-field-v1", 32);
  return cachedKey;
}

// 값 암호화. null/undefined 는 그대로 null
export function encryptField(value){
  if(value === null || value === undefined) return null;
  const text = String(value);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + [iv, tag, enc].map(b => b.toString("base64")).join(":");
}

// 값 복호화. 예전 평문 데이터는 그대로 돌려준다 (호환용)
export function decryptField(stored){
  if(typeof stored !== "string" || !stored.startsWith(PREFIX)) return stored;
  const [ivB, tagB, encB] = stored.slice(PREFIX.length).split(":").map(s => Buffer.from(s, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", getKey(), ivB);
  decipher.setAuthTag(tagB);
  return Buffer.concat([decipher.update(encB), decipher.final()]).toString("utf8");
}

// 전화번호 검색·중복 확인용 해시 (숫자만 남겨서 계산, 같은 번호는 같은 값)
export function phoneHash(phone){
  const digits = String(phone || "").replace(/\D/g, "");
  return createHmac("sha256", getKey()).update(digits).digest("hex");
}

export function encryptJson(obj){
  if(obj === null || obj === undefined) return null;
  return encryptField(JSON.stringify(obj));
}

function decryptJson(enc, legacy){
  if(enc) return JSON.parse(decryptField(enc));
  return legacy;
}

// DB에서 읽은 회원 행의 전화번호를 평문으로
export function openPhone(row){
  return row.phone_enc ? decryptField(row.phone_enc) : row.phone;
}

// DB에서 읽은 진단 기록 행을 평문 형태로 바꾼다 (암호화 열은 응답에 넣지 않는다)
export function openSaving(row){
  const { phone_enc, details_enc, inputs_enc, loans_enc, ott_enc, ...rest } = row;
  return {
    ...rest,
    phone: phone_enc ? decryptField(phone_enc) : row.phone,
    details: decryptJson(details_enc, row.details),
    inputs: decryptJson(inputs_enc, row.inputs),
    loans: decryptJson(loans_enc, row.loans),
    ott: decryptJson(ott_enc, row.ott),
  };
}

// 암호화용 열 추가 (이미 있으면 무시)
export async function ensureUserColumns(sql){
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_enc TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_hash TEXT`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_phone_hash_key ON users (phone_hash)`;
}

export async function ensureSavingColumns(sql){
  await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS phone_enc TEXT`;
  await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS details_enc TEXT`;
  await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS inputs_enc TEXT`;
  await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS loans_enc TEXT`;
  await sql`ALTER TABLE savings ADD COLUMN IF NOT EXISTS ott_enc TEXT`;
}

// 예전에 평문으로 저장된 회원 전화번호와 진단 기록을 암호화해서 옮긴다.
// 한 번 옮긴 행은 다시 건드리지 않으므로 호출 비용은 작다.
export async function migrateLegacyData(sql){
  await ensureUserColumns(sql);
  const users = await sql`SELECT id, phone FROM users WHERE phone IS NOT NULL AND phone_enc IS NULL LIMIT 500`;
  for(const u of users){
    try{
      await sql`UPDATE users SET phone_enc=${encryptField(u.phone)}, phone_hash=${phoneHash(u.phone)}, phone=NULL WHERE id=${u.id}`;
    }catch(e){
      // 같은 번호가 두 번 있으면 중복 해시로 실패한다. 원본은 그대로 두고 기록만 남긴다.
      console.error("phone migrate skipped", u.id, String(e));
    }
  }
  try{
    await ensureSavingColumns(sql);
    const rows = await sql`SELECT id, phone, details, inputs, loans, ott FROM savings WHERE phone_enc IS NULL LIMIT 500`;
    for(const r of rows){
      await sql`UPDATE savings SET
        phone_enc=${encryptField(r.phone || "")},
        details_enc=${encryptJson(r.details ?? [])},
        inputs_enc=${encryptJson(r.inputs ?? {})},
        loans_enc=${encryptJson(r.loans ?? [])},
        ott_enc=${encryptJson(r.ott ?? {})},
        phone=NULL, details=NULL, inputs=NULL, loans=NULL, ott=NULL
        WHERE id=${r.id}`;
    }
  }catch(e){
    // savings 테이블이 아직 없으면 옮길 것이 없다
    console.error("saving migrate", String(e));
  }
}
