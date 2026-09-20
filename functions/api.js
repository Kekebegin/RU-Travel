export async function onRequest() {
  return new Response('{"test":"ok"}', {
    headers: { 'Content-Type': 'application/json' }
  });
}
