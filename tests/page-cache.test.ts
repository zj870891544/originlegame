import { describe, expect, it, vi } from "vitest";
import { servePage, type PageCacheStore } from "@/lib/edge/page-cache";

function cacheHarness() {
  let now = new Date("2026-10-25T04:04:20.000Z");
  const entries = new Map<string, { response: Response; expires: number }>();
  const deferred: Promise<unknown>[] = [];
  const store: PageCacheStore = {
    async match(key) {
      const entry = entries.get(key);
      return entry && entry.expires > now.getTime() ? entry.response.clone() : undefined;
    },
    async put(key, response) {
      const seconds = Number(response.headers.get("cache-control")?.match(/s-maxage=(\d+)/)?.[1]);
      entries.set(key, { response: response.clone(), expires: now.getTime() + seconds * 1000 });
    },
  };
  return {
    entries,
    setTime(value: string) { now = new Date(value); },
    async flush() { await Promise.all(deferred.splice(0)); },
    serve(request: Request, render: () => Promise<Response>) {
      return servePage(request, render, store, (work) => deferred.push(work), {
        host: "originlegame.app", version: "test", now,
      });
    },
  };
}

describe("pending daily page cache", () => {
  it.each(["html", "rsc"] as const)("renders the released puzzle immediately after an uncached pending %s response", async (kind) => {
    const cache = cacheHarness();
    const request = new Request(`https://originlegame.app/today${kind === "rsc" ? "?_rsc=day" : ""}`, {
      headers: kind === "rsc" ? { rsc: "1" } : {},
    });
    const pending = kind === "html"
      ? '<div data-originle-pending="" role="status">Pending puzzle</div>'
      : '0:["$","div",null,{"data-originle-pending":"","role":"status","children":"Pending puzzle"}]\n';
    const type = kind === "html" ? "text/html" : "text/x-component";
    const browserPolicy = "private, no-cache, no-store, max-age=0, must-revalidate";
    let released = false;
    const render = vi.fn(async () => new Response(released ? "Released puzzle #21" : pending, {
      headers: { "content-type": type, "cache-control": browserPolicy },
    }));

    const waiting = await cache.serve(request, render);
    expect(waiting.headers.get("cache-control")).toBe(browserPolicy);
    expect(await waiting.text()).toBe(pending);
    await cache.flush();
    released = true;
    cache.setTime("2026-10-25T04:04:23.000Z");
    expect(await (await cache.serve(request, render)).text()).toBe("Released puzzle #21");
    await cache.flush();
    expect(render).toHaveBeenCalledTimes(2);

    expect(await (await cache.serve(request, render)).text()).toBe("Released puzzle #21");
    expect(render).toHaveBeenCalledTimes(2);
  });

  it("streams to the visitor before the cache scan finishes, including a marker split across chunks", async () => {
    const cache = cacheHarness();
    const encoder = new TextEncoder();
    let finish!: () => void;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("<div data-originle-"));
        finish = () => {
          controller.enqueue(encoder.encode('pending="">Pending puzzle</div>'));
          controller.close();
        };
      },
    });
    const response = await cache.serve(new Request("https://originlegame.app/today"), async () =>
      new Response(body, { headers: { "content-type": "text/html" } }));
    const reader = response.body!.getReader();
    expect(new TextDecoder().decode((await reader.read()).value)).toBe("<div data-originle-");
    finish();
    expect(new TextDecoder().decode((await reader.read()).value)).toBe('pending="">Pending puzzle</div>');
    expect((await reader.read()).done).toBe(true);
    await cache.flush();
    expect(cache.entries.size).toBe(0);
  });

  it("keeps the normal 120-second cache lifetime and original response headers", async () => {
    const cache = cacheHarness();
    const request = new Request("https://originlegame.app/today");
    const render = vi.fn(async () => new Response("Released puzzle", { headers: {
      "content-type": "text/html",
      "cache-control": "public, max-age=0, must-revalidate",
      vary: "RSC",
    } }));
    const first = await cache.serve(request, render);
    expect(first.headers.get("x-og-cache")).toBe("miss");
    await cache.flush();
    expect([...cache.entries.values()][0].response.headers.get("cache-control")).toBe("public, s-maxage=120");
    cache.setTime("2026-10-25T04:06:19.000Z");
    const hit = await cache.serve(request, render);
    expect(hit.headers.get("x-og-cache")).toBe("hit");
    expect(hit.headers.get("cache-control")).toBe("public, max-age=0, must-revalidate");
    expect(hit.headers.get("vary")).toBe("RSC");
    expect(render).toHaveBeenCalledTimes(1);

    cache.setTime("2026-10-25T04:06:20.000Z");
    expect((await cache.serve(request, render)).headers.get("x-og-cache")).toBe("miss");
    await cache.flush();
    expect(render).toHaveBeenCalledTimes(2);
  });
});
