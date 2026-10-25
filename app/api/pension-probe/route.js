// [임시 진단] 금감원 연금 API 조합 확인용. 공개 값만 돌려주고 인증키는 넣지 않는다. 확인 후 이 폴더를 지운다.
const SERVICES = ["annuitySavingProductsSearch", "savingProductsSearch"];
const GROUPS = ["060000", "050000", "020000", "030200", "030300", "032000"];

export async function GET(){
  const auth = process.env.FINLIFE_AUTH_KEY;
  if(!auth) return Response.json({ ok:false, error:"FINLIFE_AUTH_KEY 없음" }, { status:503 });
  const rows = [];
  const combos = [];
  for(const svc of SERVICES) for(const g of GROUPS) combos.push({ svc, g, fin: "" });
  combos.push({ svc: "annuitySavingProductsSearch", g: "060000", fin: "미래에셋" });
  combos.push({ svc: "annuitySavingProductsSearch", g: "060000", fin: "타임폴리오" });
  for(const c of combos){
    const finPart = c.fin ? `&financeCd=${encodeURIComponent(c.fin)}` : "";
    const url = `http://finlife.fss.or.kr/finlifeapi/${c.svc}.json?auth=${auth}&topFinGrpNo=${c.g}&pageNo=1${finPart}`;
    try{
      const res = await fetch(url, { cache: "no-store" });
      const raw = await res.json().catch(() => ({}));
      const r = raw.result && typeof raw.result === "object" ? raw.result : raw;
      const base = Array.isArray(r.baseList) ? r.baseList : [];
      rows.push({
        svc: c.svc, group: c.g, fin: c.fin || "-",
        http: res.status, err: r.err_msg ?? null, total: r.total_count ?? null,
        baseLen: base.length,
        first: base[0] ? [base[0].kor_co_nm, base[0].fin_prdt_nm, base[0].avg_prft_rate ?? null] : null,
      });
    }catch(e){
      rows.push({ svc: c.svc, group: c.g, fin: c.fin || "-", error: String(e.message || e) });
    }
  }
  return Response.json({ ok:true, rows });
}
