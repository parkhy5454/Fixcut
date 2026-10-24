// 금융상품 한눈에(금감원) 금리 요약
// GET /api/rates?type=mortgage|credit|deposit|savings
// 인증키는 환경 변수 FINLIFE_AUTH_KEY 에서만 읽고, 응답에는 포함하지 않는다.
const SERVICES = {
  mortgage: "mortgageLoanProductsSearch",  // 주택담보대출
  credit: "creditLoanProductsSearch",      // 개인신용대출
  jeonse: "rentHouseLoanProductsSearch",   // 전세자금대출
  deposit: "depositProductsSearch",        // 정기예금
  savings: "savingProductsSearch",         // 적금
};
const BASE = "http://finlife.fss.or.kr/finlifeapi/";
const TOP_GROUP = "020000"; // 은행
const TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map();

const num = v => { const n = Number(v); return n > 0 ? n : null; };

async function fetchAll(svc, auth){
  const base = [];
  const option = [];
  let page = 1;
  let max = 1;
  do{
    const url = new URL(BASE + svc + ".json");
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

function nameMap(base){
  return new Map(base.map(b => [b.fin_co_no + "|" + b.fin_prdt_cd, b]));
}

// 대출: 상품별 평균 금리 중 최저값 (주택담보·신용 공통)
function summarizeLoan(base, option, asOf){
  const names = nameMap(base);
  let best = null;
  let rangeMin = null;
  let rangeMax = null;
  for(const o of option){
    // 가감조정금리(조정분)는 제외한다
    const typeNm = o.lend_rate_type_nm || o.crdt_lend_rate_type_nm || "";
    if(typeNm.includes("가감")) continue;
    // 주택담보: lend_rate_*, 신용대출: crdt_grad_* (신용등급별 금리, avg는 등급 평균)
    const avg = num(o.lend_rate_avg) ?? num(o.crdt_grad_avg) ?? num(o.lend_rate_min);
    if(!avg) continue;
    if(!best || avg < best.rate){
      const b = names.get(o.fin_co_no + "|" + o.fin_prdt_cd) || {};
      best = { rate: avg, company: b.kor_co_nm || "", product: b.fin_prdt_nm || "", type: o.lend_rate_type_nm || o.crdt_lend_rate_type_nm || "" };
    }
    const mn = num(o.lend_rate_min) ?? num(o.crdt_grad_1);
    const mx = num(o.lend_rate_max) ?? num(o.crdt_grad_13);
    if(mn && (rangeMin === null || mn < rangeMin)) rangeMin = mn;
    if(mx && (rangeMax === null || mx > rangeMax)) rangeMax = mx;
  }
  if(!best) return null;
  return {
    asOf,
    benchmarkRate: best.rate,
    benchmarkProduct: (best.company + " " + best.product).trim(),
    benchmarkType: best.type,
    rangeMin,
    rangeMax,
    productCount: option.length,
  };
}

// 예금·적금: 상품별 최고 우대금리(intr_rate2)를 기준으로 상위 3개 정렬
function summarizeSavings(base, option, asOf){
  const names = nameMap(base);
  const rows = [];
  for(const o of option){
    const base1 = num(o.intr_rate);
    const top = num(o.intr_rate2) ?? base1;
    if(!top) continue;
    const b = names.get(o.fin_co_no + "|" + o.fin_prdt_cd) || {};
    rows.push({
      company: b.kor_co_nm || "",
      product: b.fin_prdt_nm || "",
      term: o.save_trm ? o.save_trm + "개월" : "",
      baseRate: base1,
      topRate: top,
    });
  }
  rows.sort((a, b) => b.topRate - a.topRate);
  if(rows.length === 0) return null;
  return { asOf, productCount: rows.length, best: rows[0], top: rows.slice(0, 3) };
}

const CREDIT_GRADES = ["1","4","5","6","10","11","12","13"];
// 신용대출: 등급별로 상품 중 가장 낮은 값. 값의 의미(가산분/완성금리)는 확인 중이라 원본 값을 그대로 쓴다
function summarizeCredit(base, option, asOf){
  const names = nameMap(base);
  const grades = {};
  for(const o of option){
    const typeNm = o.crdt_lend_rate_type_nm || o.lend_rate_type_nm || "";
    if(typeNm.includes("가감")) continue;
    const b = names.get(o.fin_co_no + "|" + o.fin_prdt_cd) || {};
    for(const g of CREDIT_GRADES){
      const v = num(o["crdt_grad_" + g]);
      if(!v) continue;
      if(!grades[g] || v < grades[g].rate){
        grades[g] = { rate: v, company: b.kor_co_nm || "", product: b.fin_prdt_nm || "", type: typeNm };
      }
    }
  }
  if(Object.keys(grades).length === 0) return null;
  return { asOf, productCount: option.length, grades };
}

export async function GET(req){
  try{
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "";
    const svc = SERVICES[type];
    if(!svc) return Response.json({ ok:false, error:"지원하지 않는 금리 종류입니다" }, { status:400 });
    const auth = process.env.FINLIFE_AUTH_KEY;
    if(!auth) return Response.json({ ok:false, error:"금리 데이터 설정이 없습니다" }, { status:503 });

    let entry = cache.get(type);
    if(!entry || Date.now() - entry.at > TTL_MS){
      const { base, option } = await fetchAll(svc, auth);
      const asOf = base[0]?.dcls_month || null;
      const summary = (type === "deposit" || type === "savings")
        ? summarizeSavings(base, option, asOf)
        : type === "credit"
          ? summarizeCredit(base, option, asOf)
          : summarizeLoan(base, option, asOf);
      // 요약이 실패하면 실제 응답의 필드 이름만 남겨 두어 원인을 확인할 수 있게 한다 (금리 값은 제외)
      const fields = option[0] ? Object.keys(option[0]) : [];
      entry = { at: Date.now(), summary, fields, count: option.length };
      cache.set(type, entry);
    }
    if(!entry.summary) return Response.json({ ok:false, error:"금리 데이터가 없습니다", fields: entry.fields, optionCount: entry.count }, { status:502 });
    return Response.json({ ok:true, type, summary: entry.summary });
  }catch(e){
    console.error("rates", e.message);
    return Response.json({ ok:false, error:"금리 데이터를 가져오지 못했습니다" }, { status:502 });
  }
}
