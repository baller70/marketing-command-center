import type { JsonValue } from "@prisma/client/runtime/library";

export type BrandEmailConfigShape = {
  brand: string;
  sendfoxListId: string | null;
  acumbamailListId: string | null;
  defaultEmailPlatform: string | null;
  emailTemplateId: string | null;
  emailFromName: string | null;
  emailReplyTo: string | null;
  brandColor: string | null;
  ctaUrl: string | null;
};

export type ContentBufferItem = {
  id: string;
  contentType: string;
  title: string | null;
  brand: string | null;
  sourceId: string | null;
  sourceUrl: string | null;
  thumbnail: string | null;
  contentBody: string | null;
  metadata: JsonValue;
};

const FALLBACK_COLOR = "#059669";

export function brandAccentHex(config: BrandEmailConfigShape): string {
  const c = (config.brandColor || "").trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(c)) return c;
  const b = (config.brand || "").toLowerCase();
  const map: Record<string, string> = {
    tbf: "#1E3A8A",
    ra1: "#CE1126",
    hos: "#F59E0B",
    shotiq: "#8B5CF6",
    kevin: "#059669",
    bookmark: "#0EA5E9",
  };
  return map[b] || FALLBACK_COLOR;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nl2br(text: string): string {
  return esc(text).replace(/\r\n/g, "\n").replace(/\n/g, "<br/>");
}

function stripHtmlForPreview(html: string, maxLen: number): string {
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const cut = plain.length > maxLen ? plain.slice(0, maxLen - 1).trim() + "…" : plain;
  return nl2br(cut);
}

function metaString(meta: JsonValue, key: string): string | undefined {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return undefined;
  const v = (meta as Record<string, unknown>)[key];
  return typeof v === "string" ? v : undefined;
}

function metaStrings(meta: JsonValue, key: string): string[] {
  const raw = metaString(meta, key);
  if (!raw) return [];
  return raw
    .split(/[\s#,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function wrapEmail(inner: string, config: BrandEmailConfigShape, preheader?: string): string {
  const accent = brandAccentHex(config);
  const brandName = esc(config.brand || "Our brand");
  const cta = esc(config.ctaUrl || "#");
  const pre = preheader ? `<div style="display:none;font-size:1px;color:#fefefe;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${esc(preheader)}</div>` : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${brandName}</title>
<style type="text/css">@media only screen and (max-width:620px){.stack{display:block!important;width:100%!important;max-width:100%!important;padding-left:0!important;padding-right:0!important;padding-bottom:16px!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
${pre}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f5;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr>
          <td style="background-color:${accent};height:6px;line-height:6px;font-size:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:20px 24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="left" style="font-size:22px;line-height:1.2;font-weight:700;color:#111827;letter-spacing:-0.02em;">${brandName}</td>
                <td align="right">
                  <a href="${cta}" style="display:inline-block;padding:10px 16px;background-color:${accent};color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">Visit</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${inner}
        <tr>
          <td style="padding:20px 24px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b7280;border-top:1px solid #e5e7eb;">
            You are receiving this because you subscribed to updates from ${brandName}.
            <br/><br/>
            <a href="{unsubscribe_url}" style="color:${accent};text-decoration:underline;">Unsubscribe</a>
            &nbsp;·&nbsp;
            <a href="${cta}" style="color:${accent};text-decoration:underline;">Website</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function renderRepurposedBatch(
  items: ContentBufferItem[],
  brandConfig: BrandEmailConfigShape
): string {
  const accent = brandAccentHex(brandConfig);
  const rows: string[] = [];
  for (let i = 0; i < items.length; i += 2) {
    const left = items[i];
    const right = items[i + 1];
    const cell = (it: ContentBufferItem) => {
      const cap = it.contentBody ? stripHtmlForPreview(it.contentBody, 220) : "";
      const tags = metaStrings(it.metadata, "hashtags").concat(metaStrings(it.metadata, "tags"));
      const tagLine = tags.length ? `<div style="margin-top:8px;font-size:11px;color:${accent};font-weight:600;">${esc(tags.map((t) => (t.startsWith("#") ? t : "#" + t)).join(" "))}</div>` : "";
      const thumb = it.thumbnail
        ? `<a href="${esc(it.sourceUrl || brandConfig.ctaUrl || "#")}" style="text-decoration:none;"><img src="${esc(it.thumbnail)}" alt="" width="100%" style="display:block;border:0;border-radius:10px;max-width:100%;height:auto;"/></a>`
        : `<div style="height:160px;background:linear-gradient(135deg,#f3f4f6,#e5e7eb);border-radius:10px;"></div>`;
      return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:0;">${thumb}</td></tr>
        <tr><td style="padding:12px 14px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
          <div style="font-size:15px;font-weight:700;color:#111827;line-height:1.35;margin-bottom:6px;">${esc(it.title || "Update")}</div>
          <div style="font-size:13px;color:#4b5563;line-height:1.55;">${cap}</div>
          ${tagLine}
          <div style="margin-top:12px;"><a href="${esc(it.sourceUrl || brandConfig.ctaUrl || "#")}" style="display:inline-block;font-size:12px;font-weight:600;color:${accent};text-decoration:none;">View post →</a></div>
        </td></tr>
      </table>`;
    };
    rows.push(`<tr><td colspan="2" style="padding:0 24px 16px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
      <td width="50%" valign="top" style="padding:0 8px 0 0;" class="stack">${cell(left)}</td>
      ${right ? `<td width="50%" valign="top" style="padding:0 0 0 8px;" class="stack">${cell(right)}</td>` : `<td width="50%" valign="top" style="padding:0;"></td>`}
    </tr></table></td></tr>`);
  }
  const inner = `<tr><td style="padding:8px 24px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      <div style="font-size:22px;line-height:1.25;font-weight:800;color:#111827;">This week&apos;s social highlights</div>
      <div style="margin-top:6px;font-size:14px;color:#6b7280;">Fresh repurposed clips and captions.</div>
    </td></tr>
    ${rows.join("")}`;
  const pre = items.map((x) => x.title).filter(Boolean).slice(0, 3).join(" · ");
  return wrapEmail(inner, brandConfig, pre);
}

export function renderBlogEmail(items: ContentBufferItem[], brandConfig: BrandEmailConfigShape): string {
  const accent = brandAccentHex(brandConfig);
  const it = items[0];
  const hero = it?.thumbnail
    ? `<img src="${esc(it.thumbnail)}" alt="" width="600" style="display:block;width:100%;max-width:100%;height:auto;border:0;border-bottom:1px solid #e5e7eb;"/>`
    : `<div style="height:220px;background:linear-gradient(135deg,#1f2937,#374151);"></div>`;
  const excerpt = it?.contentBody ? stripHtmlForPreview(it.contentBody, 380) : "We published a new article.";
  const readUrl = esc(it?.sourceUrl || brandConfig.ctaUrl || "#");
  const inner = `<tr><td style="padding:0;">${hero}</td></tr>
    <tr><td style="padding:28px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${accent};font-weight:700;">Blog</div>
      <div style="margin-top:10px;font-size:26px;line-height:1.2;font-weight:800;color:#111827;">${esc(it?.title || "New post")}</div>
      <div style="margin-top:14px;font-size:16px;line-height:1.65;color:#374151;">${excerpt}</div>
      <div style="margin-top:22px;"><a href="${readUrl}" style="display:inline-block;padding:14px 22px;background-color:${accent};color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;">Read more</a></div>
    </td></tr>`;
  return wrapEmail(inner, brandConfig, it?.title || undefined);
}

export function renderNewsletterEmail(items: ContentBufferItem[], brandConfig: BrandEmailConfigShape): string {
  const accent = brandAccentHex(brandConfig);
  const blocks = items
    .map((it) => {
      const body = it.contentBody ? nl2br(it.contentBody.replace(/<[^>]+>/g, "")) : "";
      return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:18px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
          <div style="font-size:18px;font-weight:800;color:#111827;line-height:1.3;">${esc(it.title || "Newsletter")}</div>
          <div style="margin-top:10px;font-size:15px;line-height:1.65;color:#374151;">${body}</div>
        </td></tr>
      </table>`;
    })
    .join("");
  const inner = `<tr><td style="padding:20px 24px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${accent};font-weight:700;">Newsletter</div>
      <div style="margin-top:8px;font-size:24px;line-height:1.2;font-weight:800;color:#111827;">${esc(brandConfig.brand || "Newsletter")} digest</div>
    </td></tr>
    <tr><td style="padding:8px 24px 24px;">${blocks}</td></tr>`;
  return wrapEmail(inner, brandConfig, items[0]?.title || undefined);
}

export function renderGraphicsBatch(items: ContentBufferItem[], brandConfig: BrandEmailConfigShape): string {
  const accent = brandAccentHex(brandConfig);
  const rows: string[] = [];
  for (let i = 0; i < items.length; i += 2) {
    const a = items[i];
    const b = items[i + 1];
    const tile = (x: ContentBufferItem) => {
      const img = x.thumbnail
        ? `<a href="${esc(x.sourceUrl || brandConfig.ctaUrl || "#")}"><img src="${esc(x.thumbnail)}" alt="" width="100%" style="display:block;border:0;border-radius:10px;max-width:100%;height:auto;"/></a>`
        : `<div style="height:200px;background:#e5e7eb;border-radius:10px;"></div>`;
      const cap = x.title ? `<div style="margin-top:10px;font-size:13px;font-weight:600;color:#111827;">${esc(x.title)}</div>` : "";
      return `<td width="50%" valign="top" style="padding:8px;" class="stack"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${img}${cap}</table></td>`;
    };
    rows.push(`<tr>${tile(a)}${b ? tile(b) : '<td width="50%"></td>'}</tr>`);
  }
  const inner = `<tr><td style="padding:20px 24px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      <div style="font-size:24px;line-height:1.2;font-weight:800;color:#111827;">Graphics drop</div>
      <div style="margin-top:6px;font-size:14px;color:#6b7280;">New creative assets for your channels.</div>
    </td></tr>
    <tr><td style="padding:8px 16px 24px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${rows.join("")}</table></td></tr>
    <tr><td style="padding:0 24px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;text-align:center;">
      <a href="${esc(brandConfig.ctaUrl || "#")}" style="display:inline-block;padding:12px 20px;border:2px solid ${accent};color:${accent};text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;">Open asset library</a>
    </td></tr>`;
  return wrapEmail(inner, brandConfig);
}

export function renderGameResultsBatch(items: ContentBufferItem[], brandConfig: BrandEmailConfigShape): string {
  const accent = brandAccentHex(brandConfig);
  const cards = items
    .map((it) => {
      const home = metaString(it.metadata, "homeTeam") || metaString(it.metadata, "home") || "Home";
      const away = metaString(it.metadata, "awayTeam") || metaString(it.metadata, "away") || "Away";
      const homeScore = metaString(it.metadata, "homeScore") || metaString(it.metadata, "scoreHome") || "—";
      const awayScore = metaString(it.metadata, "awayScore") || metaString(it.metadata, "scoreAway") || "—";
      const status = metaString(it.metadata, "status") || metaString(it.metadata, "gameStatus") || "Final";
      const highlights = metaString(it.metadata, "highlights") || (it.contentBody ? stripHtmlForPreview(it.contentBody, 280) : "");
      return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:16px;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <tr><td style="padding:14px 16px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="left" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${accent};">${esc(status)}</td>
              <td align="right" style="font-size:12px;color:#6b7280;">${esc(it.title || "Game")}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:18px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="font-size:16px;font-weight:700;color:#111827;width:42%;">${esc(away)}</td>
              <td align="center" style="font-size:28px;font-weight:800;color:#111827;width:16%;">${esc(awayScore)}</td>
              <td align="center" style="font-size:12px;color:#9ca3af;width:6%;">@</td>
              <td align="center" style="font-size:28px;font-weight:800;color:#111827;width:16%;">${esc(homeScore)}</td>
              <td align="right" style="font-size:16px;font-weight:700;color:#111827;width:42%;">${esc(home)}</td>
            </tr>
          </table>
          ${highlights ? `<div style="margin-top:14px;padding-top:14px;border-top:1px dashed #e5e7eb;font-size:14px;line-height:1.55;color:#374151;">${highlights}</div>` : ""}
          ${it.sourceUrl ? `<div style="margin-top:12px;"><a href="${esc(it.sourceUrl)}" style="font-size:13px;font-weight:600;color:${accent};text-decoration:none;">Box score &amp; recap →</a></div>` : ""}
        </td></tr>
      </table>`;
    })
    .join("");
  const inner = `<tr><td style="padding:20px 24px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      <div style="font-size:24px;line-height:1.2;font-weight:800;color:#111827;">Scoreboard</div>
      <div style="margin-top:6px;font-size:14px;color:#6b7280;">Latest results and highlights.</div>
    </td></tr>
    <tr><td style="padding:8px 24px 24px;">${cards}</td></tr>`;
  return wrapEmail(inner, brandConfig);
}

const RENDERERS: Record<
  string,
  (items: ContentBufferItem[], config: BrandEmailConfigShape) => string
> = {
  repurposed: renderRepurposedBatch,
  social: renderRepurposedBatch,
  blog: renderBlogEmail,
  newsletter: renderNewsletterEmail,
  graphic: renderGraphicsBatch,
  graphics: renderGraphicsBatch,
  game: renderGameResultsBatch,
  scores: renderGameResultsBatch,
};

export function renderBatchEmail(
  items: ContentBufferItem[],
  contentType: string,
  brandConfig: BrandEmailConfigShape
): string {
  const key = (contentType || "").toLowerCase().trim();
  const fn = RENDERERS[key] || renderRepurposedBatch;
  return fn(items, brandConfig);
}
