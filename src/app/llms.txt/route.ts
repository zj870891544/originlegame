import { loadToday } from "@/lib/puzzle/load";
import { llmsText } from "@/lib/seo/llms";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return new Response(llmsText(await loadToday()), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
