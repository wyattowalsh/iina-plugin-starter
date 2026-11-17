import { describe, expect, it } from "vitest";
// @ts-expect-error The postprocess helper is a JavaScript module without a declaration file.
import { rewriteWebviewHtml } from "./postprocess-webviews.mjs";

describe("webview HTML postprocess", () => {
  it("drops module scripts and keeps the classic bundle as a relative script", () => {
    const html =
      `<script nomodule defer src=overlay.43ea0122.js></script>` +
      `<script type=module src=overlay.16863b35.js></script>`;
    expect(rewriteWebviewHtml(html)).toBe(`<script src=./overlay.43ea0122.js></script>`);
  });

  it("rewrites a quoted root-absolute nomodule src", () => {
    const html = `<script nomodule src="/sidebar.abc.js"></script>`;
    expect(rewriteWebviewHtml(html)).toBe(`<script src="./sidebar.abc.js"></script>`);
  });

  it("leaves an already relative script URL in place", () => {
    const html = `<script src="./index.js"></script>`;
    expect(rewriteWebviewHtml(html)).toBe(html);
  });

  it("prefixes a bare filename with ./", () => {
    expect(rewriteWebviewHtml(`<script src="overlay.js"></script>`)).toBe(
      `<script src="./overlay.js"></script>`,
    );
  });
});
