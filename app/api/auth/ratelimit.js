// IP별 고정 시간창 요청 제한 (DB 기반, 서버리스 환경에서도 유지됨)
// 제한을 넘으면 false를 반환한다.
export async function allowRequest(req, sql, name, limit, windowSec){
  await sql`CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(), count INT NOT NULL DEFAULT 0)`;
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const key = name + ":" + ip;
  const rows = await sql`
    INSERT INTO rate_limits (key, window_start, count) VALUES (${key}, NOW(), 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start < NOW() - make_interval(secs => ${windowSec}) THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start < NOW() - make_interval(secs => ${windowSec}) THEN NOW() ELSE rate_limits.window_start END
    RETURNING count`;
  return rows[0].count <= limit;
}
