import { prisma } from "@/lib/prisma";

interface ItemForDraft {
  id: string;
  title: string;
  brand: string;
  source: string;
  contentPreview: string | null;
  contentType: string;
  sourceUrl?: string | null;
}

export interface EmailDraft {
  subject: string;
  body: string;
  preheader: string;
  ctaText: string;
  ctaUrl: string;
  templateId: string | null;
  recipientListId: string | null;
  platform: string | null;
  [key: string]: unknown;
}

function sanitizeColor(color: string | null | undefined): string {
  if (!color) return "#1E3A8A";
  const hex = /^#[0-9A-Fa-f]{3,8}$/;
  const rgb = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/;
  if (hex.test(color) || rgb.test(color)) return color;
  return "#1E3A8A";
}

export async function generateEmailDraft(item: ItemForDraft): Promise<EmailDraft | null> {
  if (!item.contentPreview && !item.title) return null;

  const brandConfig = await prisma.brandEmailConfig.findUnique({ where: { brand: item.brand } });
  const brandPod = await prisma.brandPod.findUnique({ where: { brand: item.brand } });

  const brandName = brandPod?.name || item.brand;
  const content = item.contentPreview || item.title;
  const ctaUrl = brandConfig?.ctaUrl || item.sourceUrl || "#";
  const brandColor = sanitizeColor(brandConfig?.brandColor);

  const subject = generateSubject(item.title, content, item.source);
  const preheader = content.substring(0, 120).replace(/\n/g, " ").trim();
  const bodyHtml = generateEmailHtml({
    brandName,
    brandColor,
    content,
    ctaUrl,
    ctaText: item.source === "postiz" ? "See the Full Post" : "Learn More",
    fromName: brandConfig?.emailFromName || brandName,
    sourceType: item.source,
  });

  return {
    subject,
    body: bodyHtml,
    preheader,
    ctaText: item.source === "postiz" ? "See the Full Post" : "Learn More",
    ctaUrl,
    templateId: brandConfig?.emailTemplateId || null,
    recipientListId: brandConfig?.defaultEmailPlatform === "sendfox"
      ? brandConfig.sendfoxListId
      : brandConfig?.acumbamailListId || null,
    platform: brandConfig?.defaultEmailPlatform || null,
  };
}

function generateSubject(title: string, content: string, source: string): string {
  const clean = title.replace(/^\[Recycled\]\s*/i, "").trim();
  if (clean.length > 5 && clean.length < 80) return clean;

  const firstLine = content.split("\n")[0].trim();
  if (firstLine.length > 5 && firstLine.length < 80) return firstLine;

  return `Update: ${clean.substring(0, 60)}`;
}

function generateEmailHtml(opts: {
  brandName: string;
  brandColor: string;
  content: string;
  ctaUrl: string;
  ctaText: string;
  fromName: string;
  sourceType: string;
}): string {
  const paragraphs = opts.content
    .split(/\n\n|\n/)
    .filter(p => p.trim())
    .map(p => `<p style="margin:0 0 16px 0;line-height:1.6;color:#333333;font-size:16px;">${escapeHtml(p.trim())}</p>`)
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
  <tr>
    <td style="background:${opts.brandColor};padding:24px 30px;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;">${escapeHtml(opts.brandName)}</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:30px;">
      ${paragraphs}
      <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr>
          <td style="background:${opts.brandColor};border-radius:6px;padding:12px 28px;">
            <a href="${escapeHtml(opts.ctaUrl)}" style="color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;">${escapeHtml(opts.ctaText)}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 30px;background:#f8f8f8;border-top:1px solid #eeeeee;">
      <p style="margin:0;font-size:12px;color:#999999;">Sent by ${escapeHtml(opts.fromName)}. <a href="{unsubscribe}" style="color:#999999;">Unsubscribe</a></p>
    </td>
  </tr>
</table>
</td></tr></table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
