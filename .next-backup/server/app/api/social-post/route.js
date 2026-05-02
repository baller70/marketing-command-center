(()=>{var a={};a.id=4178,a.ids=[4178],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},78335:()=>{},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},93812:(a,b,c)=>{"use strict";c.d(b,{C:()=>g});let d=process.env.POSTIZ_BACKEND_URL||"http://localhost:8085",e=process.env.POSTIZ_API_TOKEN||"";async function f(a,b="GET",c,g=3e4){let h={"Content-Type":"application/json"};e&&(h.Authorization=e);let i=await fetch(`${d}${a}`,{method:b,headers:h,body:c?JSON.stringify(c):void 0,signal:AbortSignal.timeout(g)});if(!i.ok){let c=await i.text().catch(()=>"");throw Error(`Postiz ${b} ${a}: ${i.status} - ${c}`)}return i.json()}let g={schedulePost:async a=>f("/public/v1/posts","POST",{content:a.content,platforms:a.platforms,scheduledDate:a.scheduledDate||new Date().toISOString(),media:a.mediaUrls||[]}),publishNow:async a=>f("/public/v1/posts","POST",{content:a.content,platforms:a.platforms,publishNow:!0}),async listPosts(a){let b=new URLSearchParams;a?.status&&b.set("status",a.status);let c=new Date;return b.set("startDate",a?.startDate||new Date(c.getFullYear(),0,1).toISOString()),b.set("endDate",a?.endDate||new Date(c.getFullYear(),11,31).toISOString()),f(`/public/v1/posts?${b}`)},getAnalytics:async a=>a?.integration?f(`/public/v1/analytics/${a.integration}`):f("/public/v1/integrations"),getChannels:async()=>f("/public/v1/integrations"),isConnected:async()=>f("/public/v1/is-connected")}},96124:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>F,patchFetch:()=>E,routeModule:()=>A,serverHooks:()=>D,workAsyncStorage:()=>B,workUnitAsyncStorage:()=>C});var d={};c.r(d),c.d(d,{GET:()=>y,POST:()=>z});var e=c(19225),f=c(84006),g=c(8317),h=c(99373),i=c(34775),j=c(24235),k=c(261),l=c(54365),m=c(90771),n=c(73461),o=c(67798),p=c(92280),q=c(62018),r=c(45696),s=c(47929),t=c(86439),u=c(37527),v=c(45592),w=c(93812);let x={tbf:{name:"The Basketball Factory",platforms:{instagram:"thebasketballfactorynj",tiktok:"thebasketballfactorynj",facebook:"thebasketballfactorynj",twitter:"tbfnj",youtube:"@thebasketballfactorynj"}},ra1:{name:"Rise As One AAU",platforms:{instagram:"riseasone_aau",tiktok:"riseasone_aau",facebook:"riseasoneaau",twitter:"riseasone_aau"}},hos:{name:"House of Sports",platforms:{instagram:"houseofsportsnj",facebook:"houseofsportsnj"}},shotiq:{name:"ShotIQ",platforms:{instagram:"shotiqai",tiktok:"shotiqai",twitter:"shotiqai"}},kevin:{name:"Kevin Houston",platforms:{instagram:"kevinhouston_hoops",tiktok:"kevinhouston_hoops",twitter:"kevinhouston",linkedin:"kevinhouston"}},bookmarkai:{name:"BookmarkAI Hub",platforms:{twitter:"bookmarkaihub"}}};async function y(a){let{searchParams:b}=new URL(a.url),c=b.get("brand");return c?v.NextResponse.json({success:!0,brand:c,profiles:x[c]||null}):v.NextResponse.json({success:!0,brands:x})}async function z(a){try{var b;let c,d,e,f,{brand:g,contentType:h,headline:i,description:j,mediaUrl:k,scheduledTime:l,platforms:m,customText:n}=await a.json();if(!g||!i)return v.NextResponse.json({success:!1,error:"Brand and headline required"},{status:400});let o=n||(b=h||"default",c=x[g]?.name||g.toUpperCase(),d=j?`

${j}`:"",(f=(e={newsletter:[`NEW ${c} Newsletter just dropped! ${i}${d}

Link in bio!`,`Fresh update from ${c}! ${i}${d}

#basketball #training`],announcement:[`ANNOUNCEMENT from ${c}!

${i}${d}

Link in bio for details!`,`Big news! ${i}${d}

#${g.toLowerCase()} #basketball`],"tryout-promo":[`TRYOUTS COMING! ${i}${d}

Don't miss your chance! Link in bio

#basketball #tryouts #aau`,`Ready to ball? ${c} tryouts are here!

${i}${d}

#hoops #basketball`],"player-spotlight":[`PLAYER SPOTLIGHT

${i}${d}

Proud of our athletes!

#playerofthemonth #basketball`,`Shoutout to this baller!

${i}${d}

#${g.toLowerCase()} #basketballplayer`],"training-tips":[`TRAINING TIP

${i}${d}

Level up your game!

#basketballtips #training`,`Get better every day!

${i}${d}

#workout #basketball #skills`],"event-reminder":[`REMINDER: ${i}${d}

See you there!`,`Don't forget! ${i}${d}

#${g.toLowerCase()}`],"game-results":[`GAME RECAP!

${i}${d}

Great effort team!

#gameday #basketball`,`Final score is in! ${i}${d}

#hoops #${g.toLowerCase()}`],default:[`${c} Update!

${i}${d}

#basketball #${g.toLowerCase()}`]})[b]||e.default)[Math.floor(Math.random()*f.length)]),p=x[g],q=m||Object.keys(p?.platforms||{}),r=await w.C.schedulePost({content:o,platforms:q,scheduledDate:l,mediaUrls:k?[k]:[]});return v.NextResponse.json({success:!0,announcement:{brand:g,contentType:h,text:o,platforms:q,scheduledTime:l||"queued"},postizResponse:r})}catch(a){return console.error("[social-post] Failed:",a instanceof Error?a.message:"Unknown error",a),v.NextResponse.json({success:!1,error:"Internal server error"},{status:500})}}let A=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/social-post/route",pathname:"/api/social-post",filename:"route",bundlePath:"app/api/social-post/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"/opt/apps/marketing-command-center/src/app/api/social-post/route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:B,workUnitAsyncStorage:C,serverHooks:D}=A;function E(){return(0,g.patchFetch)({workAsyncStorage:B,workUnitAsyncStorage:C})}async function F(a,b,c){A.isDev&&(0,h.addRequestMeta)(a,"devRequestTimingInternalsEnd",process.hrtime.bigint());let d="/api/social-post/route";"/index"===d&&(d="/");let e=await A.prepare(a,b,{srcPage:d,multiZoneDraftMode:!1});if(!e)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:g,params:v,nextConfig:w,parsedUrl:x,isDraftMode:y,prerenderManifest:z,routerServerContext:B,isOnDemandRevalidate:C,revalidateOnlyGenerated:D,resolvedPathname:E,clientReferenceManifest:F,serverActionsManifest:G}=e,H=(0,k.normalizeAppPath)(d),I=!!(z.dynamicRoutes[H]||z.routes[E]),J=async()=>((null==B?void 0:B.render404)?await B.render404(a,b,x,!1):b.end("This page could not be found"),null);if(I&&!y){let a=!!z.routes[E],b=z.dynamicRoutes[H];if(b&&!1===b.fallback&&!a){if(w.experimental.adapterPath)return await J();throw new t.NoFallbackError}}let K=null;!I||A.isDev||y||(K="/index"===(K=E)?"/":K);let L=!0===A.isDev||!I,M=I&&!L;G&&F&&(0,j.setManifestsSingleton)({page:d,clientReferenceManifest:F,serverActionsManifest:G});let N=a.method||"GET",O=(0,i.getTracer)(),P=O.getActiveScopeSpan(),Q={params:v,prerenderManifest:z,renderOpts:{experimental:{authInterrupts:!!w.experimental.authInterrupts},cacheComponents:!!w.cacheComponents,supportsDynamicResponse:L,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:w.cacheLife,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d,e)=>A.onRequestError(a,b,d,e,B)},sharedContext:{buildId:g}},R=new l.NodeNextRequest(a),S=new l.NodeNextResponse(b),T=m.NextRequestAdapter.fromNodeNextRequest(R,(0,m.signalFromNodeResponse)(b));try{let e=async a=>A.handle(T,Q).finally(()=>{if(!a)return;a.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let c=O.getRootSpanAttributes();if(!c)return;if(c.get("next.span_type")!==n.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${c.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=c.get("next.route");if(e){let b=`${N} ${e}`;a.setAttributes({"next.route":e,"http.route":e,"next.span_name":b}),a.updateName(b)}else a.updateName(`${N} ${d}`)}),g=!!(0,h.getRequestMeta)(a,"minimalMode"),j=async h=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!g&&C&&D&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let d=await e(h);a.fetchMetrics=Q.renderOpts.fetchMetrics;let i=Q.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=Q.renderOpts.collectedTags;if(!I)return await (0,p.I)(R,S,d,Q.renderOpts.pendingWaitUntil),null;{let a=await d.blob(),b=(0,q.toNodeOutgoingHttpHeaders)(d.headers);j&&(b[s.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==Q.renderOpts.collectedRevalidate&&!(Q.renderOpts.collectedRevalidate>=s.INFINITE_CACHE)&&Q.renderOpts.collectedRevalidate,e=void 0===Q.renderOpts.collectedExpire||Q.renderOpts.collectedExpire>=s.INFINITE_CACHE?void 0:Q.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:d.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:e}}}}catch(b){throw(null==f?void 0:f.isStale)&&await A.onRequestError(a,b,{routerKind:"App Router",routePath:d,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:M,isOnDemandRevalidate:C})},!1,B),b}},l=await A.handleResponse({req:a,nextConfig:w,cacheKey:K,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:z,isRoutePPREnabled:!1,isOnDemandRevalidate:C,revalidateOnlyGenerated:D,responseGenerator:k,waitUntil:c.waitUntil,isMinimalMode:g});if(!I)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});g||b.setHeader("x-nextjs-cache",C?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),y&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,q.fromNodeOutgoingHttpHeaders)(l.value.headers);return g&&I||m.delete(s.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,r.getCacheControlHeader)(l.cacheControl)),await (0,p.I)(R,S,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};P?await j(P):await O.withPropagatedContext(a.headers,()=>O.trace(n.BaseServerSpan.handleRequest,{spanName:`${N} ${d}`,kind:i.SpanKind.SERVER,attributes:{"http.method":N,"http.target":a.url}},j))}catch(b){if(b instanceof t.NoFallbackError||await A.onRequestError(a,b,{routerKind:"App Router",routePath:H,routeType:"route",revalidateReason:(0,o.c)({isStaticGeneration:M,isOnDemandRevalidate:C})},!1,B),I)throw b;return await (0,p.I)(R,S,new Response(null,{status:500})),null}}},96487:()=>{}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[3445,1813],()=>b(b.s=96124));module.exports=c})();