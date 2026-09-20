// functions/api.js
// Cloudflare Pages Functions：处理 /api/records 的 GET / POST / DELETE / OPTIONS 请求

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // ---------- OPTIONS 预检请求 ----------
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // ---------- GET：读取所有记录 ----------
  if (method === 'GET') {
    try {
      if (!env.DB) {
        return new Response(
          JSON.stringify({ error: 'D1 binding "DB" is missing.' }),
          { status: 500, headers }
        );
      }
      const { results } = await env.DB.prepare(
        'SELECT id, datetime, person, amountCNY, note, currency, originalAmount FROM records ORDER BY datetime DESC'
      ).all();
      return new Response(JSON.stringify(results || []), { status: 200, headers });
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e.message || 'Unknown error' }),
        { status: 500, headers }
      );
    }
  }

  // ---------- POST：添加一条记录 ----------
  if (method === 'POST') {
    try {
      if (!env.DB) {
        return new Response(
          JSON.stringify({ error: 'D1 binding "DB" is missing.' }),
          { status: 500, headers }
        );
      }

      let body;
      try {
        body = await request.json();
      } catch (e) {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON body' }),
          { status: 400, headers }
        );
      }

      const { id, datetime, person, amountCNY, note, currency, originalAmount } = body;

      if (!id || !datetime || !person || amountCNY == null) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers }
        );
      }

      await env.DB.prepare(
        'INSERT INTO records (id, datetime, person, amountCNY, note, currency, originalAmount) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        String(id),
        String(datetime),
        String(person),
        Number(amountCNY),
        note ? String(note) : '',
        currency ? String(currency) : 'CNY',
        originalAmount != null ? Number(originalAmount) : Number(amountCNY)
      ).run();

      return new Response(
        JSON.stringify({ ok: true, id: id }),
        { status: 200, headers }
      );
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e.message || 'Unknown error' }),
        { status: 500, headers }
      );
    }
  }

  // ---------- DELETE：删除一条记录 ----------
  if (method === 'DELETE') {
    try {
      if (!env.DB) {
        return new Response(
          JSON.stringify({ error: 'D1 binding "DB" is missing.' }),
          { status: 500, headers }
        );
      }

      const url = new URL(request.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing id parameter' }),
          { status: 400, headers }
        );
      }

      await env.DB.prepare('DELETE FROM records WHERE id = ?').bind(id).run();

      return new Response(
        JSON.stringify({ ok: true, id: id }),
        { status: 200, headers }
      );
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e.message || 'Unknown error' }),
        { status: 500, headers }
      );
    }
  }

  // ---------- 其他方法：返回 405，并附带实际收到的方法名 ----------
  return new Response(
    JSON.stringify({
      error: 'Method not allowed',
      receivedMethod: method,
      receivedUrl: request.url
    }),
    { status: 405, headers }
  );
}