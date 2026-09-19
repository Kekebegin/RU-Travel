// functions/api.js
// 处理 /api/records 的 GET（读取）和 POST（添加）请求

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  // GET /api/records —— 返回所有记账记录
  if (method === 'GET') {
    try {
      const { results } = await env.DB.prepare(
        'SELECT id, datetime, person, amountCNY, note, currency, originalAmount FROM records ORDER BY datetime DESC'
      ).all();
      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // POST /api/records —— 添加一条记录
  if (method === 'POST') {
    try {
      const body = await request.json();
      const { id, datetime, person, amountCNY, note, currency, originalAmount } = body;
      await env.DB.prepare(
        `INSERT INTO records (id, datetime, person, amountCNY, note, currency, originalAmount)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, datetime, person, amountCNY, note || '', currency, originalAmount).run();
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}