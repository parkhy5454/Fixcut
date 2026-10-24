// 금융상품 한눈에(금감원) 금리 조회 - 진단용 1단계
// GET /api/rates?type=mortgage|credit|deposit|savings
// 인증키는 환경 변수 FINLIFE_AUTH_KEY 에서만 읽고, 응답에는 절대 포함하지 않는다.
const SERVICES = {
  mortgage: "mortgageLoanProductsSearch",   // 주택담보대출
  credit: "creditLoanProductsSearch",       // 개인신용대출
  deposit: "depositProductsSearch",         // 정기예금
  savings: "savingProductsSearch",          // 적금
};
const BASE = "http://finlife.fss.or.kr/finlifeapi/";
const TOP_GROUP = "020000"; // 은행
const TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map();

async function fetchAll(svc, auth){
  const base = [];
  const option = [];
  let page = 1;
  let max = 1;
  let asOf = null;
  do{
    const url = new URL(BASE + svc + ".json");
    url.searchParams.set("auth", auth);
    url.searchParams.set("topFinGrpNo", TOP_GROUP);
    url.searchParams.set("pageNo", String(page));
    const res = await fetch(url, { cache: "no-store" });
    if(!res.ok) throw new Error("finlife http " + res.status);
    const json = await res.json();
    const r = json.result || {};
    if(r.err_cd && String(r.err_cd) !== "000") throw new Error("finlife err " + r.err_cd + " " + (r.err_msg || ""));
    base.push(...(r.baseList || []));
    option.push(...(r.optionList || []));
    if(!asOf && base[0]?.dcls_month) asOf = base[0].dcls_month;
    max = Number(r.max_page_no) || 1;
    page++;
  }while(page <= max && page <= 30);
  return { base, option, asOf, pages: max };
}

export async function GET(req){
  try{
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "";
    const svc = SERVICES[type];
    if(!svc) return Response.json({ ok:false, error:"type 은 mortgage, credit, deposit, savings 중 하나" }, { status:400 });
    const auth = process.env.FINLIFE_AUTH_KEY;
    if(!auth) return Response.json({ ok:false, error:"금리 데이터 설정이 없습니다" }, { status:503 });

    let entry = cache.get(type);
    if(!entry || Date.now() - entry.at > TTL_MS){
      entry = { at: Date.now(), data: await fetchAll(svc, auth) };
      cache.set(type, entry);
    }
    const { base, option, asOf, pages } = entry.data;
    // 진단용: 실제 필드명을 확인하기 위해 키 목록과 첫 항목을 돌려준다
    return Response.json({
      ok: true,
      type,
      asOf,
      pages,
      baseCount: base.length,
      optionCount: option.length,
      baseKeys: base[0] ? Object.keys(base[0]) : [],
      optionKeys: option[0] ? Object.keys(option[0]) : [],
      sample: { base: base[0] || null, option: option[0] || null },
    });
  }catch(e){
    console.error("rates", e.message);
    return Response.json({ ok:false, error:"금리 데이터를 가져오지 못했습니다" }, { status:502 });
  }
}
