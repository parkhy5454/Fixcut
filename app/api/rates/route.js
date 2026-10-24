// 금융상품 한눈에(금감원) 주택담보대출 금리 요약
// GET /api/rates?type=mortgage
// 인증키는 환경 변수 FINLIFE_AUTH_KEY 에서만 읽고, 응답에는 포함하지 않는다.
const SERVICE = "mortgageLoanProductsSearch";
const BASE = "http://finlife.fss.or.kr/finlifeapi/";
const TOP_GROUP = "020000"; // 은행
const TTL_MS = 6 * 60 * 60 * 1000;
let cached = null;

async function fetchAll(auth){
  const base = [];
  const option = [];
  let page = 1;
  let max = 1;
  do{
    const url = new URL(BASE + SERVICE + ".json");
    url.searchParams.set("auth", auth);
    url.searchParams.set("topFinGrpNo", TOP_GROUP);
    url.searchParams.set("pageNo", String(page));
    const res = await fetch(url, { cache: "no-store" });
    if(!res.ok) throw new Error("finlife http " + res.status);
    const json = await res.json();
    const r = json.result || {};
    if(r.err_cd && String(r.err_cd) !== "000") throw new Error("finlife err " + r.err_cd);
    base.push(...(r.baseList || []));
    option.push(...(r.optionList || []));
    max = Number(r.max_page_no) || 1;
    page++;
  }while(page <= max && page <= 30);
  return { base, option };
}

// 상품별 평균 금리 중 가장 낮은 값을 대환 기준으로 쓴다
function summarize(base, option, asOf){
  const names = new Map(base.map(b => [b.fin_co_no + "|" + b.fin_prdt_cd, b]));
  let best = null;
  let rangeMin = null;
  let rangeMax = null;
  for(const o of option){
    const avg = Number(o.lend_rate_avg);
    const mn = Number(o.lend_rate_min);
    const mx = Number(o.lend_rate_max);
    if(!(avg > 0)) continue;
    if(!best || avg < best.avg){
      const b = names.get(o.fin_co_no + "|" + o.fin_prdt_cd) || {};
      best = { avg, company: b.kor_co_nm || "", product: b.fin_prdt_nm || "", type: o.lend_rate_type_nm || "" };
    }
    if(mn > 0 && (rangeMin === null || mn < rangeMin)) rangeMin = mn;
    if(mx > 0 && (rangeMax === null || mx > rangeMax)) rangeMax = mx;
  }
  if(!best) return null;
  return {
    asOf,
    benchmarkRate: best.avg,
    benchmarkProduct: (best.company + " " + best.product).trim(),
    benchmarkType: best.type,
    rangeMin,
    rangeMax,
    productCount: option.length,
  };
}

export async function GET(req){
  try{
    const { searchParams } = new URL(req.url);
    if((searchParams.get("type") || "") !== "mortgage"){
      return Response.json({ ok:false, error:"지원하지 않는 금리 종류입니다" }, { status:400 });
    }
    const auth = process.env.FINLIFE_AUTH_KEY;
    if(!auth) return Response.json({ ok:false, error:"금리 데이터 설정이 없습니다" }, { status:503 });

    if(!cached || Date.now() - cached.at > TTL_MS){
      const { base, option } = await fetchAll(auth);
      const asOf = base[0]?.dcls_month || null;
      cached = { at: Date.now(), summary: summarize(base, option, asOf) };
    }
    if(!cached.summary) return Response.json({ ok:false, error:"금리 데이터가 없습니다" }, { status:502 });
    return Response.json({ ok:true, summary: cached.summary });
  }catch(e){
    console.error("rates", e.message);
    return Response.json({ ok:false, error:"금리 데이터를 가져오지 못했습니다" }, { status:502 });
  }
}
