import { handleMarks } from '../pages-api/marks-handler.mjs';

export async function onRequest(context) {
  const host = new URL(context.request.url).host;
  return handleMarks(context.request, context.env, host);
}
