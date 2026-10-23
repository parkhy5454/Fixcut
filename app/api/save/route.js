import { neon } from '@neondatabase/serverless';

export async function POST(req) {
  try {
    const body = await req.json();
    const sql = neon(process.env.DATABASE_URL);
    
    // Create user
    const [user] = await sql`INSERT INTO users (name) VALUES (${body.name || '테스트유저'}) RETURNING id`;
    
    // Insert fixed costs
    await sql`
      INSERT INTO fixed_costs (user_id, telecom_provider, telecom_monthly_fee, telecom_data_usage, subscriptions, loan_balance, loan_rate)
      VALUES (${user.id}, ${body.telecom_provider}, ${body.telecom_fee}, ${body.data_usage}, ${JSON.stringify(body.subs)}, ${body.loan_balance}, ${body.loan_rate})
    `;
    
    return Response.json({ success: true, userId: user.id });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}