// 관리자 작업 감사 로그. 기록에 실패하면 작업도 진행하지 않는다 (호출하는 쪽에서 예외를 그대로 둔다)
export async function ensureAuditTable(sql){
  await sql`CREATE TABLE IF NOT EXISTS admin_audit (
    id SERIAL PRIMARY KEY,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT,
    detail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

export async function writeAudit(sql, adminEmail, action, target, detail){
  await ensureAuditTable(sql);
  await sql`INSERT INTO admin_audit (admin_email, action, target, detail) VALUES (${adminEmail}, ${action}, ${target||null}, ${detail||null})`;
}
