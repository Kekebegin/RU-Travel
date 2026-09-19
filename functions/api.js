// functions/api.js
// Cloudflare Pages Functions：处理 /api/records 的 GET / POST / DELETE 请求

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // GET /api/records —— 读取所有记录
  if (method === 'GET') {
    try {
      const { results } = await env.DB.prepare(
        'SELECT id, datetime, person, amountCNY, note, currency, originalAmount FROM records ORDER BY datetime DESC'
      ).all();
      return new Response(JSON.stringify(results || []), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  }

  // POST /api/records —— 添加一条记录
  if (method === 'POST') {
    try {
      const body = await request.json();
      const { id, datetime, person, amountCNY, note, currency, originalAmount } = body;
      if (!id || !datetime || !person || amountCNY == null) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
      }
      await env.DB.prepare(
        `INSERT INTO records (id, datetime, person, amountCNY, note, currency, originalAmount)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, datetime, person, amountCNY, note || '', currency || 'CNY', originalAmount || amountCNY).run();
      return new Response(JSON.stringify({ ok: true }), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  }

  // DELETE /api/records?id=xxx —— 删除一条记录
  if (method === 'DELETE') {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers });
      }
      await env.DB.prepare('DELETE FROM records WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ ok: true }), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
  }

  return new Response('Method not allowed', { status: 405, headers });
}