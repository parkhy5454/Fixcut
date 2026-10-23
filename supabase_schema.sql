
-- FIXCUT DB Schema v1.0 - Supabase PostgreSQL
-- 이 코드를 Supabase SQL Editor에 그대로 붙여넣으세요

-- 1. users 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. fixed_costs 테이블 (유저가 입력한 고정비 원본)
CREATE TABLE IF NOT EXISTS fixed_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  telecom_provider TEXT, -- SKT, KT, LG, 알뜰폰 등
  telecom_plan_name TEXT,
  telecom_monthly_fee INTEGER,
  telecom_data_usage INTEGER, -- GB
  subscriptions JSONB, -- ["youtube", "netflix", "melon"] 형태로 저장
  loan_balance BIGINT, -- 200000000
  loan_rate DECIMAL(4,2), -- 5.2
  loan_remaining_months INTEGER,
  total_fixed_cost INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. recommendations 테이블 (계산된 추천 결과)
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  fixed_cost_id UUID REFERENCES fixed_costs(id) ON DELETE CASCADE,
  recommended_telecom TEXT,
  recommended_telecom_fee INTEGER,
  telecom_saving INTEGER,
  recommended_subscription_plan JSONB,
  subscription_saving INTEGER,
  recommended_loan_rate DECIMAL(4,2),
  loan_saving INTEGER,
  total_monthly_saving INTEGER,
  total_yearly_saving INTEGER,
  break_even_months INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. actions 테이블 (실행 이력 - 수익 증빙용)
CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES recommendations(id),
  action_type TEXT CHECK (action_type IN ('telecom', 'subscription', 'loan')),
  provider TEXT, -- 리브엠, KB국민은행 등
  status TEXT CHECK (status IN ('clicked', 'applied', 'completed', 'failed')) DEFAULT 'clicked',
  commission_amount INTEGER, -- 우리가 번 수수료
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. subscriptions 테이블 (프리미엄 구독)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_type TEXT DEFAULT 'premium',
  monthly_fee INTEGER DEFAULT 3900,
  status TEXT CHECK (status IN ('active', 'canceled', 'expired')) DEFAULT 'active',
  next_billing_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 (검색 빠르게)
CREATE INDEX IF NOT EXISTS idx_fixed_costs_user_id ON fixed_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_user_id ON actions(user_id);

-- RLS (Row Level Security) - Supabase 필수
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 일단 개발 단계에서는 모두 허용 (나중에 로그인 붙이면 수정)
CREATE POLICY "Allow all for dev" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for dev" ON fixed_costs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for dev" ON recommendations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for dev" ON actions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for dev" ON subscriptions FOR ALL USING (true) WITH CHECK (true);

-- 샘플 데이터 (테스트용)
INSERT INTO users (name, phone) VALUES ('박현용', '010-1234-5678') ON CONFLICT DO NOTHING;
