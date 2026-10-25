// 금융상품 한눈에(금감원) 금리 요약
// GET /api/rates?type=mortgage|credit|deposit|savings
// 인증키는 환경 변수 FINLIFE_AUTH_KEY 에서만 읽고, 응답에는 포함하지 않는다.
const SERVICES = {
  mortgage: "mortgageLoanProductsSearch",  // 주택담보대출
  credit: "creditLoanProductsSearch",      // 개인신용대출
  jeonse: "rentHouseLoanProductsSearch",   // 전세자금대출
  business: "busiLoanProductsSearch",     // 개인사업자대출 (금감원 오픈API 개인사업자대출 API)
  deposit: "depositProductsSearch",        // 정기예금
  savings: "savingProductsSearch",         // 적금
  pension: "annuitySavingProductsSearch", // 연금저축 (금융상품한눈에 오픈API 4번)
};
const BASE = "http://finlife.fss.or.kr/finlifeapi/";
const TOP_GROUP = "020000"; // 은행
const TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map();

const num = v => { const n = Number(v); return n > 0 ? n : null; };

async function fetchAll(svc, auth, groups = [TOP_GROUP]){
  const base = [];
  const option = [];
  const meta = { resultKeys: null, firstKeys: null };
  for(const group of groups){
    let page = 1;
    let max = 1;
    do{
      const url = new URL(BASE + svc + ".json");
      url.searchParams.set("auth", auth);
      url.searchParams.set("topFinGrpNo", group);
      url.searchParams.set("pageNo", String(page));
      const res = await fetch(url, { cache: "no-store" });
      if(!res.ok) throw new Error("finlife http " + res.status);
      const json = await res.json();
      const r = json.result || {};
      if(meta.resultKeys === null){ meta.resultKeys = Object.keys(r); meta.firstKeys = Object.keys(json); }
      if(r.err_cd && String(r.err_cd) !== "000") throw new Error("finlife err " + r.err_cd);
      base.push(...(r.baseList || []));
      option.push(...(r.optionList || []));
      // 연금저축은 products[{baseinfo, options}] 구조로 올 수 있다
      for(const p of (Array.isArray(r.products) ? r.products : [])){
        if(p.baseinfo) base.push(p.baseinfo);
        const opts = p.options?.option ?? p.options ?? [];
        option.push(...(Array.isArray(opts) ? opts : [opts]));
      }
      max = Number(r.max_page_no) || 1;
      page++;
    }while(page <= max && page <= 30);
  }
  return { base, option, meta };
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
  // 기본 금리 순위: 기간이 같아야 공정하므로 12개월 상품을 먼저 본다 (없으면 전체)
  const std = rows.filter(r => r.term === "12개월" && r.baseRate);
  const basePool = std.length ? std : rows.filter(r => r.baseRate);
  const baseTop = [...basePool].sort((a, b) => b.baseRate - a.baseRate).slice(0, 5);
  return { asOf, productCount: rows.length, best: rows[0], top: rows.slice(0, 3), baseTop, companies: [...new Set(rows.map(r=>r.company).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ko")), baseTerm: std.length ? "12개월" : "전체 기간" };
}

const CREDIT_BANDS = {
  "1": "900점 초과", "4": "801~900점", "5": "701~800점", "6": "601~700점",
  "10": "501~600점", "11": "401~500점", "12": "301~400점", "13": "300점 이하",
};
function cbOf(v){
  const t = String(v || "").toUpperCase();
  if(t.includes("KCB")) return "KCB";
  if(t.includes("NICE") || t.includes("나이스")) return "NICE";
  return null;
}
// 신용대출: CB(KCB/NICE)별, 점수 구간별로 상품 중 가장 낮은 금리 (금리 구분이 "대출금리"인 행만 사용)
function summarizeCredit(base, option, asOf){
  const names = nameMap(base);
  const cbKey = base[0] ? Object.keys(base[0]).find(k => /cb/i.test(k)) : null;
  const byCb = {};
  for(const o of option){
    const typeNm = o.crdt_lend_rate_type_nm || "";
    if(!typeNm.includes("대출금리")) continue;
    const b = names.get(o.fin_co_no + "|" + o.fin_prdt_cd) || {};
    const cb = cbKey ? (cbOf(b[cbKey]) || "OTHER") : "ALL";
    if(!byCb[cb]) byCb[cb] = {};
    const bucket = byCb[cb];
    for(const g of Object.keys(CREDIT_BANDS)){
      const v = num(o["crdt_grad_" + g]);
      if(!v) continue;
      if(!bucket[g] || v < bucket[g].rate){
        bucket[g] = { rate: v, company: b.kor_co_nm || "", product: b.fin_prdt_nm || "", band: CREDIT_BANDS[g] };
      }
    }
  }
  if(Object.keys(byCb).length === 0) return null;
  return {
    asOf,
    productCount: option.length,
    byCb,
    bands: CREDIT_BANDS,
    cbField: cbKey || null,
    baseKeys: Object.keys(base[0] || {}),
  };
}

// 전세자금대출: 자격 조건이 붙은 상품(청년·신혼 등)은 따로 분리해서 금리 최저값을 낸다
const SPECIAL_ELIGIBILITY = /청년|신혼|다자녀|저소득|사회초년생|한부모|장애|고령|기초/;
function summarizeJeonse(base, option, asOf){
  const names = nameMap(base);
  let general = null;
  let special = null;
  let rangeMin = null;
  let rangeMax = null;
  for(const o of option){
    const avg = num(o.lend_rate_avg) ?? num(o.lend_rate_min);
    if(!avg) continue;
    const b = names.get(o.fin_co_no + "|" + o.fin_prdt_cd) || {};
    const row = { rate: avg, product: ((b.kor_co_nm || "") + " " + (b.fin_prdt_nm || "")).trim(), type: o.lend_rate_type_nm || "" };
    if(SPECIAL_ELIGIBILITY.test(b.fin_prdt_nm || "")){
      if(!special || avg < special.rate) special = row;
    } else if(!general || avg < general.rate){
      general = row;
    }
    const mn = num(o.lend_rate_min);
    const mx = num(o.lend_rate_max);
    if(mn && (rangeMin === null || mn < rangeMin)) rangeMin = mn;
    if(mx && (rangeMax === null || mx > rangeMax)) rangeMax = mx;
  }
  if(!general && !special) return null;
  return {
    asOf,
    benchmarkRate: general ? general.rate : null,
    benchmarkProduct: general ? general.product : "",
    benchmarkType: general ? general.type : "",
    specialRate: special ? special.rate : null,
    specialProduct: special ? special.product : "",
    rangeMin,
    rangeMax,
    productCount: option.length,
  };
}

// 연금저축: 평균 수익률이 높은 상품 순 (수수료는 이 API에 없음)
function summarizePension(base, option, asOf){
  const rows = [];
  for(const b of base){
    const rate = num(b.avg_prft_rate);
    if(!rate) continue;
    rows.push({
      company: b.kor_co_nm || "",
      product: b.fin_prdt_nm || "",
      kind: b.pnsn_kind_nm || "",
      rate,
      btrm1: num(b.btrm_prft_rate_1),
      btrm2: num(b.btrm_prft_rate_2),
      btrm3: num(b.btrm_prft_rate_3),
    });
  }
  rows.sort((a, b) => b.rate - a.rate);
  if(rows.length === 0) return null;
  return { asOf, productCount: rows.length, best: rows[0], top: rows.slice(0, 3), baseKeys: Object.keys(base[0] || {}) };
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
      const groups = type === "pension" ? ["060000", "050000", "020000"] : [TOP_GROUP];
      const { base, option, meta } = await fetchAll(svc, auth, groups);
      const perGroup = {};
      if(type === "pension"){
        for(const g of groups){
          const one = await fetchAll(svc, auth, [g]);
          perGroup[g] = { baseCount: one.base.length, optionCount: one.option.length, baseKeys: Object.keys(one.base[0] || {}).slice(0, 40), sample: one.base.slice(0, 2).map(b => ({ kor_co_nm: b.kor_co_nm, fin_prdt_nm: b.fin_prdt_nm, avg_prft_rate: b.avg_prft_rate ?? null })) };
        }
      }
      const asOf = base[0]?.dcls_month || null;
      const summary = (type === "deposit" || type === "savings")
        ? summarizeSavings(base, option, asOf)
        : type === "credit"
          ? summarizeCredit(base, option, asOf)
          : type === "jeonse" ? summarizeJeonse(base, option, asOf) : type === "pension" ? summarizePension(base, option, asOf) : summarizeLoan(base, option, asOf);
      // 요약이 실패하면 실제 응답의 필드 이름만 남겨 두어 원인을 확인할 수 있게 한다 (금리 값은 제외)
      const fields = option[0] ? Object.keys(option[0]) : [];
      entry = { at: Date.now(), summary, fields, count: option.length, baseCount: base.length, baseKeys: Object.keys(base[0] || {}), meta, perGroup };
      cache.set(type, entry);
    }
    if(!entry.summary) return Response.json({ ok:false, error:"금리 데이터가 없습니다", fields: entry.fields, optionCount: entry.count, baseCount: entry.baseCount, baseKeys: entry.baseKeys, meta: entry.meta, perGroup: entry.perGroup }, { status:502 });
    return Response.json({ ok:true, type, summary: entry.summary });
  }catch(e){
    console.error("rates", e.message);
    return Response.json({ ok:false, error:"금리 데이터를 가져오지 못했습니다" }, { status:502 });
  }
}
