exports.id=7679,exports.ids=[7679],exports.modules={21619:(a,b,c)=>{"use strict";c.d(b,{V:()=>r});var d=c(93061),e=c(90230),f=c(99123);function g(a){let b=(a.brandColor||"").trim();return/^#[0-9A-Fa-f]{6}$/.test(b)?b:({tbf:"#1E3A8A",ra1:"#CE1126",hos:"#F59E0B",shotiq:"#8B5CF6",kevin:"#059669",bookmark:"#0EA5E9"})[(a.brand||"").toLowerCase()]||"#059669"}function h(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function i(a){return h(a).replace(/\r\n/g,"\n").replace(/\n/g,"<br/>")}function j(a,b){let c=a.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();return i(c.length>b?c.slice(0,b-1).trim()+"…":c)}function k(a,b){if(!a||"object"!=typeof a||Array.isArray(a))return;let c=a[b];return"string"==typeof c?c:void 0}function l(a,b){let c=k(a,b);return c?c.split(/[\s#,]+/).map(a=>a.trim()).filter(Boolean):[]}function m(a,b,c){let d=g(b),e=h(b.brand||"Our brand"),f=h(b.ctaUrl||"#"),i=c?`<div style="display:none;font-size:1px;color:#fefefe;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${h(c)}</div>`:"";return`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${e}</title>
<style type="text/css">@media only screen and (max-width:620px){.stack{display:block!important;width:100%!important;max-width:100%!important;padding-left:0!important;padding-right:0!important;padding-bottom:16px!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
${i}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f5;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr>
          <td style="background-color:${d};height:6px;line-height:6px;font-size:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:20px 24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="left" style="font-size:22px;line-height:1.2;font-weight:700;color:#111827;letter-spacing:-0.02em;">${e}</td>
                <td align="right">
                  <a href="${f}" style="display:inline-block;padding:10px 16px;background-color:${d};color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">Visit</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${a}
        <tr>
          <td style="padding:20px 24px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b7280;border-top:1px solid #e5e7eb;">
            You are receiving this because you subscribed to updates from ${e}.
            <br/><br/>
            <a href="{unsubscribe_url}" style="color:${d};text-decoration:underline;">Unsubscribe</a>
            &nbsp;\xb7&nbsp;
            <a href="${f}" style="color:${d};text-decoration:underline;">Website</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`}function n(a,b){let c=g(b),d=[];for(let e=0;e<a.length;e+=2){let f=a[e],g=a[e+1],i=a=>{let d=a.contentBody?j(a.contentBody,220):"",e=l(a.metadata,"hashtags").concat(l(a.metadata,"tags")),f=e.length?`<div style="margin-top:8px;font-size:11px;color:${c};font-weight:600;">${h(e.map(a=>a.startsWith("#")?a:"#"+a).join(" "))}</div>`:"",g=a.thumbnail?`<a href="${h(a.sourceUrl||b.ctaUrl||"#")}" style="text-decoration:none;"><img src="${h(a.thumbnail)}" alt="" width="100%" style="display:block;border:0;border-radius:10px;max-width:100%;height:auto;"/></a>`:'<div style="height:160px;background:linear-gradient(135deg,#f3f4f6,#e5e7eb);border-radius:10px;"></div>';return`<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:0;">${g}</td></tr>
        <tr><td style="padding:12px 14px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
          <div style="font-size:15px;font-weight:700;color:#111827;line-height:1.35;margin-bottom:6px;">${h(a.title||"Update")}</div>
          <div style="font-size:13px;color:#4b5563;line-height:1.55;">${d}</div>
          ${f}
          <div style="margin-top:12px;"><a href="${h(a.sourceUrl||b.ctaUrl||"#")}" style="display:inline-block;font-size:12px;font-weight:600;color:${c};text-decoration:none;">View post →</a></div>
        </td></tr>
      </table>`};d.push(`<tr><td colspan="2" style="padding:0 24px 16px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
      <td width="50%" valign="top" style="padding:0 8px 0 0;" class="stack">${i(f)}</td>
      ${g?`<td width="50%" valign="top" style="padding:0 0 0 8px;" class="stack">${i(g)}</td>`:'<td width="50%" valign="top" style="padding:0;"></td>'}
    </tr></table></td></tr>`)}return m(`<tr><td style="padding:8px 24px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      <div style="font-size:22px;line-height:1.25;font-weight:800;color:#111827;">This week&apos;s social highlights</div>
      <div style="margin-top:6px;font-size:14px;color:#6b7280;">Fresh repurposed clips and captions.</div>
    </td></tr>
    ${d.join("")}`,b,a.map(a=>a.title).filter(Boolean).slice(0,3).join(" \xb7 "))}function o(a,b){let c=g(b),d=[];for(let c=0;c<a.length;c+=2){let e=a[c],f=a[c+1],g=a=>{let c=a.thumbnail?`<a href="${h(a.sourceUrl||b.ctaUrl||"#")}"><img src="${h(a.thumbnail)}" alt="" width="100%" style="display:block;border:0;border-radius:10px;max-width:100%;height:auto;"/></a>`:'<div style="height:200px;background:#e5e7eb;border-radius:10px;"></div>',d=a.title?`<div style="margin-top:10px;font-size:13px;font-weight:600;color:#111827;">${h(a.title)}</div>`:"";return`<td width="50%" valign="top" style="padding:8px;" class="stack"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${c}${d}</table></td>`};d.push(`<tr>${g(e)}${f?g(f):'<td width="50%"></td>'}</tr>`)}return m(`<tr><td style="padding:20px 24px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      <div style="font-size:24px;line-height:1.2;font-weight:800;color:#111827;">Graphics drop</div>
      <div style="margin-top:6px;font-size:14px;color:#6b7280;">New creative assets for your channels.</div>
    </td></tr>
    <tr><td style="padding:8px 16px 24px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${d.join("")}</table></td></tr>
    <tr><td style="padding:0 24px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;text-align:center;">
      <a href="${h(b.ctaUrl||"#")}" style="display:inline-block;padding:12px 20px;border:2px solid ${c};color:${c};text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;">Open asset library</a>
    </td></tr>`,b)}function p(a,b){let c=g(b),d=a.map(a=>{let b=k(a.metadata,"homeTeam")||k(a.metadata,"home")||"Home",d=k(a.metadata,"awayTeam")||k(a.metadata,"away")||"Away",e=k(a.metadata,"homeScore")||k(a.metadata,"scoreHome")||"—",f=k(a.metadata,"awayScore")||k(a.metadata,"scoreAway")||"—",g=k(a.metadata,"status")||k(a.metadata,"gameStatus")||"Final",i=k(a.metadata,"highlights")||(a.contentBody?j(a.contentBody,280):"");return`<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:16px;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <tr><td style="padding:14px 16px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="left" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${c};">${h(g)}</td>
              <td align="right" style="font-size:12px;color:#6b7280;">${h(a.title||"Game")}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:18px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="font-size:16px;font-weight:700;color:#111827;width:42%;">${h(d)}</td>
              <td align="center" style="font-size:28px;font-weight:800;color:#111827;width:16%;">${h(f)}</td>
              <td align="center" style="font-size:12px;color:#9ca3af;width:6%;">@</td>
              <td align="center" style="font-size:28px;font-weight:800;color:#111827;width:16%;">${h(e)}</td>
              <td align="right" style="font-size:16px;font-weight:700;color:#111827;width:42%;">${h(b)}</td>
            </tr>
          </table>
          ${i?`<div style="margin-top:14px;padding-top:14px;border-top:1px dashed #e5e7eb;font-size:14px;line-height:1.55;color:#374151;">${i}</div>`:""}
          ${a.sourceUrl?`<div style="margin-top:12px;"><a href="${h(a.sourceUrl)}" style="font-size:13px;font-weight:600;color:${c};text-decoration:none;">Box score &amp; recap →</a></div>`:""}
        </td></tr>
      </table>`}).join("");return m(`<tr><td style="padding:20px 24px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      <div style="font-size:24px;line-height:1.2;font-weight:800;color:#111827;">Scoreboard</div>
      <div style="margin-top:6px;font-size:14px;color:#6b7280;">Latest results and highlights.</div>
    </td></tr>
    <tr><td style="padding:8px 24px 24px;">${d}</td></tr>`,b)}let q={repurposed:n,social:n,blog:function(a,b){let c=g(b),d=a[0],e=d?.thumbnail?`<img src="${h(d.thumbnail)}" alt="" width="600" style="display:block;width:100%;max-width:100%;height:auto;border:0;border-bottom:1px solid #e5e7eb;"/>`:'<div style="height:220px;background:linear-gradient(135deg,#1f2937,#374151);"></div>',f=d?.contentBody?j(d.contentBody,380):"We published a new article.",i=h(d?.sourceUrl||b.ctaUrl||"#");return m(`<tr><td style="padding:0;">${e}</td></tr>
    <tr><td style="padding:28px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${c};font-weight:700;">Blog</div>
      <div style="margin-top:10px;font-size:26px;line-height:1.2;font-weight:800;color:#111827;">${h(d?.title||"New post")}</div>
      <div style="margin-top:14px;font-size:16px;line-height:1.65;color:#374151;">${f}</div>
      <div style="margin-top:22px;"><a href="${i}" style="display:inline-block;padding:14px 22px;background-color:${c};color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;">Read more</a></div>
    </td></tr>`,b,d?.title||void 0)},newsletter:function(a,b){let c=g(b),d=a.map(a=>{let b=a.contentBody?i(a.contentBody.replace(/<[^>]+>/g,"")):"";return`<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:18px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
          <div style="font-size:18px;font-weight:800;color:#111827;line-height:1.3;">${h(a.title||"Newsletter")}</div>
          <div style="margin-top:10px;font-size:15px;line-height:1.65;color:#374151;">${b}</div>
        </td></tr>
      </table>`}).join("");return m(`<tr><td style="padding:20px 24px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${c};font-weight:700;">Newsletter</div>
      <div style="margin-top:8px;font-size:24px;line-height:1.2;font-weight:800;color:#111827;">${h(b.brand||"Newsletter")} digest</div>
    </td></tr>
    <tr><td style="padding:8px 24px 24px;">${d}</td></tr>`,b,a[0]?.title||void 0)},graphic:o,graphics:o,game:p,scores:p};async function r(a){var b;let c=await d.z.contentBatch.findUnique({where:{id:a},include:{items:{orderBy:{createdAt:"asc"}}}});if(!c)throw Error("batch not found");if(0===c.items.length)throw Error("batch has no items");let g=await d.z.brandEmailConfig.findUnique({where:{brand:c.brand}});if(!g)throw Error(`missing BrandEmailConfig for ${c.brand}`);let h=c.items.map(a=>({id:a.id,contentType:a.contentType,title:a.title,brand:a.brand,sourceId:a.sourceId,sourceUrl:a.sourceUrl,thumbnail:a.thumbnail,contentBody:a.contentBody,metadata:a.metadata??{}})),i=c.templateHtml||(b=c.contentType,(q[(b||"").toLowerCase().trim()]||n)(h,g)),j=`${c.brand} — ${c.contentType} digest`;await d.z.contentBatch.update({where:{id:c.id},data:{templateHtml:i}});let k=`${c.brand}-${c.contentType}-${c.id}-${Date.now()}`,l=function(a){if(!a||"object"!=typeof a)return null;let b=a.email;if(b&&"object"==typeof b){let a=b.id;if("number"==typeof a&&Number.isFinite(a))return a;if("string"==typeof a){let b=Number(a);return Number.isFinite(b)?b:null}}return null}(await e.m.createEmail({name:k,subject:j,body:i}));if(null==l)throw Error("could not resolve Mautic email id from createEmail response");let m=new Date;return await d.z.$transaction([d.z.contentBatch.update({where:{id:c.id},data:{mauticEmailId:l,status:"sent",sentAt:m}}),d.z.contentBuffer.updateMany({where:{batchId:c.id},data:{status:"sent"}}),d.z.emailAnalytics.create({data:{batchId:c.id,mauticEmailId:l,brand:c.brand,contentType:c.contentType,subject:j,sentAt:m}})]),await f.J.notify("mautic_email_sent",{title:`Email created in Mautic (${c.brand})`,message:`${c.contentType}: ${j} (${c.items.length} items)`,brand:c.brand,details:{batchId:c.id,mauticEmailId:l}}).catch(()=>{}),d.z.contentBatch.findUnique({where:{id:c.id},include:{items:!0}})}},78335:()=>{},90230:(a,b,c)=>{"use strict";c.d(b,{m:()=>h});let d=process.env.MAUTIC_URL||"http://localhost:8088",e=process.env.MAUTIC_API_USER||"",f=process.env.MAUTIC_API_PASS||"";async function g(a,b="GET",c,h=15e3){let i={"Content-Type":"application/json"},j=e?`Basic ${Buffer.from(`${e}:${f}`).toString("base64")}`:"";j&&(i.Authorization=j);let k=await fetch(`${d}/api${a}`,{method:b,headers:i,body:c?JSON.stringify(c):void 0,signal:AbortSignal.timeout(h)});if(!k.ok){let c=await k.text().catch(()=>"");throw Error(`Mautic ${b} ${a}: ${k.status} - ${c}`)}return k.json()}let h={createContact:async a=>g("/contacts/new","POST",a),async listContacts(a,b=30){let c=new URLSearchParams({limit:String(b)});return a&&c.set("search",a),g(`/contacts?${c}`)},addContactToSegment:async(a,b)=>g(`/segments/${b}/contact/${a}/add`,"POST"),createCampaign:async a=>g("/campaigns/new","POST",{campaign:a}),listCampaigns:async(a=30)=>g(`/campaigns?limit=${a}`),createEmail:async a=>g("/emails/new","POST",{name:a.name,subject:a.subject,customHtml:a.body,emailType:a.emailType||"template"}),sendEmail:async(a,b)=>g(`/emails/${a}/contact/${b}/send`,"POST"),listEmails:async(a=30)=>g(`/emails?limit=${a}`),listSegments:async(a=30)=>g(`/segments?limit=${a}`),getContactActivity:async a=>g(`/contacts/${a}/activity`),getCampaignStats:async a=>g(`/campaigns/${a}`),async getEmailStats(a){try{let b=await g(`/emails/${a}`),c=b?.email;if(!c)return null;return{sentCount:c.sentCount??0,readCount:c.readCount??0,clickCount:c.clickCount??0,bounceCount:c.bounceCount??0}}catch{return null}},async getAggregateEmailStats(){try{let a=await g("/emails?limit=100&orderBy=id&orderByDir=DESC"),b=a?.emails?Object.values(a.emails):[];if(0===b.length)return null;return{totalSent:b.reduce((a,b)=>a+(b.sentCount??0),0),totalRead:b.reduce((a,b)=>a+(b.readCount??0),0),totalClicked:b.reduce((a,b)=>a+(b.clickCount??0),0),totalBounced:b.reduce((a,b)=>a+(b.bounceCount??0),0),emailCount:b.length}}catch{return null}},async isHealthy(){try{return(await fetch(`${d}/api`,{method:"GET",signal:AbortSignal.timeout(2e3)})).status>0}catch{try{return(await fetch(d,{method:"HEAD",signal:AbortSignal.timeout(2e3)})).status>0}catch{return!1}}}}},93061:(a,b,c)=>{"use strict";c.d(b,{z:()=>e});var d=c(96330);let e=globalThis.prisma??new d.PrismaClient},96487:()=>{},99123:(a,b,c)=>{"use strict";c.d(b,{J:()=>i});let d=process.env.NOVU_API_URL||"http://localhost:8095",e=process.env.NOVU_API_KEY||"";async function f(a,b={}){let c=await fetch(`${d}/v1${a}`,{...b,headers:{"Content-Type":"application/json",Authorization:`ApiKey ${e}`,...b.headers||{}},signal:AbortSignal.timeout(1e4)});if(!c.ok){let d=await c.text().catch(()=>"");throw Error(`Novu ${b.method||"GET"} ${a}: ${c.status} - ${d}`)}return c.json()}async function g(a,b,c){await f("/events/trigger",{method:"POST",body:JSON.stringify({name:a,to:{subscriberId:b},payload:c})})}async function h(a,b){try{if(!e)return!1;return await g("marketing-pipeline","kevin-admin",{eventType:a,...b,timestamp:new Date().toISOString()}),!0}catch(c){let b=c instanceof Error?c.message:String(c);return console.error(`[NOVU-MKT] Failed to send ${a}: ${b}`),!1}}let i={trigger:g,notify:h,isHealthy:async function(){try{return(await fetch(`${d}/v1/health-check`,{signal:AbortSignal.timeout(5e3)})).ok}catch{return!1}},notifyLeadQualified:async a=>h("lead_qualified",{title:`New qualified lead: ${a.email}`,message:`${a.tier} lead (score: ${a.score}) for ${a.brand}`,brand:a.brand}),notifyCampaignLaunched:async a=>h("campaign_launched",{title:`Campaign launched: ${a.name}`,message:`Channels: ${a.channels.join(", ")}`,brand:a.brand}),notifyStaleCampaign:async a=>h("campaign_stale",{title:`Stale campaign: ${a.name}`,message:`No updates in ${a.daysSinceUpdate} days`,brand:a.brand}),notifySocialScheduled:async a=>h("social_post_scheduled",{title:`${a.postCount} social posts scheduled for ${a.brand}`,message:`Platforms: ${a.platforms.join(", ")}`,brand:a.brand}),notifyContentFeedback:async a=>h("content_feedback_ready",{title:`Content feedback ready for ${a.brand}`,message:`Period: ${a.period}. Top channel: ${a.topChannel}`,brand:a.brand}),notifyHealthWarning:async a=>h("pipeline_health_warning",{title:`Marketing health warning: ${a.service}`,message:a.message})}}};