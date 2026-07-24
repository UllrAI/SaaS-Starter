import { NextResponse } from "next/server";

import { APP_NAME } from "@/lib/config/constants";
import enMessages from "@/messages/en.json";

export const runtime = "nodejs";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

export function GET() {
  const title = escapeHtml(enMessages["20cd73fb1bec"]);
  const description = escapeHtml(enMessages["b1c2f0f90a10"]);
  const homeLabel = escapeHtml(enMessages["12b611abe60d"]);
  const appName = escapeHtml(APP_NAME);
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>${title} | ${appName}</title>
    <meta name="description" content="${description}">
    <style>
      :root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, sans-serif; }
      body { margin: 0; background: Canvas; color: CanvasText; }
      main { min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; box-sizing: border-box; }
      section { max-width: 36rem; text-align: center; }
      strong { display: block; color: #4c83f7; font-size: clamp(5rem, 18vw, 8rem); line-height: 1; opacity: .35; }
      h1 { margin: 1.5rem 0 .75rem; font-size: clamp(1.875rem, 6vw, 2.5rem); }
      p { margin: 0; color: color-mix(in srgb, CanvasText 70%, transparent); font-size: 1.125rem; line-height: 1.6; }
      a { display: inline-flex; margin-top: 2rem; padding: .75rem 1.25rem; border-radius: .5rem; background: #4c83f7; color: white; font-weight: 600; text-decoration: none; }
      a:focus-visible { outline: 3px solid #4c83f7; outline-offset: 3px; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <strong aria-hidden="true">404</strong>
        <h1>${title}</h1>
        <p>${description}</p>
        <a href="/">${homeLabel}</a>
      </section>
    </main>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 404,
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=86400",
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const DELETE = GET;
export const HEAD = GET;
export const OPTIONS = GET;
export const PATCH = GET;
export const POST = GET;
export const PUT = GET;
