import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Marketing Engine database...')

  // Clear existing data
  await prisma.performanceMetric.deleteMany()
  await prisma.channelDeployment.deleteMany()
  await prisma.qualityGateReview.deleteMany()
  await prisma.campaignAssembly.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.creativeBrief.deleteMany()
  await prisma.messagingLane.deleteMany()
  await prisma.brandPod.deleteMany()
  await prisma.intelligenceEntry.deleteMany()
  await prisma.learningRule.deleteMany()
  await prisma.funnelAnalysis.deleteMany()
  await prisma.contentFeedback.deleteMany()
  await prisma.seasonalPattern.deleteMany()
  await prisma.tVShowMarketing.deleteMany()
  await prisma.myMemo.deleteMany()
  await prisma.contentAsset.deleteMany()

  // ===== BRAND PODS =====
  const tbf = await prisma.brandPod.create({
    data: {
      brand: 'TBF', name: 'The Basketball Factory',
      audience: 'Parents of youth basketball players ages 6-17 in Northern NJ/NYC metro area. Middle to upper-middle class families seeking elite training.',
      coreOffer: 'Elite youth basketball training programs — skills development, team training, camps, and private sessions.',
      coreMessage: 'Where serious players are made. The Basketball Factory builds fundamentals, confidence, and game IQ through proven training systems.',
      channelMix: { instagram: 35, facebook: 25, google_ads: 20, email: 10, tiktok: 10 },
      kpiTargets: { monthlyLeads: 80, enrollmentRate: 0.25, costPerLead: 15, costPerEnrollment: 60, monthlyRevenue: 25000 },
    }
  })

  const ra1 = await prisma.brandPod.create({
    data: {
      brand: 'RA1', name: 'Rise As One AAU',
      audience: 'Competitive basketball players ages 10-17 and their parents in tri-state area seeking AAU team placement and exposure.',
      coreOffer: 'Elite AAU basketball program with tournament travel, exposure events, and college placement support.',
      coreMessage: 'Rise together, compete everywhere. AAU basketball that opens doors — from local courts to college scouts.',
      channelMix: { instagram: 40, tiktok: 20, email: 15, facebook: 15, youtube: 10 },
      kpiTargets: { monthlyLeads: 50, tryoutSignups: 30, rosterFill: 0.95, costPerLead: 20, seasonRevenue: 120000 },
    }
  })

  const shotiq = await prisma.brandPod.create({
    data: {
      brand: 'ShotIQ', name: 'ShotIQ AI',
      audience: 'Basketball coaches, trainers, and serious players globally seeking AI-powered shot analysis and training optimization.',
      coreOffer: 'AI-powered basketball shot analysis platform — real-time form feedback, progress tracking, and personalized drill recommendations.',
      coreMessage: 'Your shot, decoded by AI. ShotIQ turns every rep into data-driven improvement.',
      channelMix: { google_ads: 30, youtube: 25, twitter: 15, linkedin: 15, tiktok: 15 },
      kpiTargets: { monthlyTrials: 200, trialToPayRate: 0.12, churnRate: 0.05, mrr: 15000, costPerTrial: 8 },
    }
  })

  const hos = await prisma.brandPod.create({
    data: {
      brand: 'HoS', name: 'House of Sports',
      audience: 'Multi-sport families in Northern NJ seeking a premium sports facility for training, leagues, and events.',
      coreOffer: 'Premier multi-sport facility — basketball courts, turf fields, training zones, birthday parties, and league play.',
      coreMessage: 'Every sport. Every age. One home. House of Sports is where athletes and families come together.',
      channelMix: { facebook: 30, instagram: 25, google_ads: 25, email: 10, sms: 10 },
      kpiTargets: { monthlyBookings: 300, facilityUtilization: 0.75, eventRevenue: 40000, memberRetention: 0.85 },
    }
  })

  const bookmark = await prisma.brandPod.create({
    data: {
      brand: 'Bookmark', name: 'Bookmark AI Hub',
      audience: 'Small business owners and entrepreneurs globally seeking AI-powered website creation and digital presence tools.',
      coreOffer: 'AI website builder that creates professional websites in minutes — no coding required. Includes hosting, SEO, and e-commerce.',
      coreMessage: 'Your business deserves a website as smart as you. Bookmark AI builds it in minutes.',
      channelMix: { google_ads: 35, youtube: 20, linkedin: 20, twitter: 15, email: 10 },
      kpiTargets: { monthlyTrials: 500, trialToPayRate: 0.08, churnRate: 0.06, mrr: 45000, costPerTrial: 5 },
    }
  })

  // ===== MESSAGING LANES =====
  const lanes = [
    { brandPodId: tbf.id, lane: 'Fundamentals', message: 'Build an unshakable foundation. Our training system develops the skills that separate good players from great ones.', contentTypes: 'short_video,carousel,testimonial', target: 'Parents of beginners (ages 6-10)' },
    { brandPodId: tbf.id, lane: 'Transformation Stories', message: 'See the results. Real players, real progress, real confidence built through dedicated training at TBF.', contentTypes: 'video_testimonial,before_after,long_video', target: 'Parents on the fence' },
    { brandPodId: tbf.id, lane: 'Elite Development', message: 'For players who want more. Advanced training, competitive prep, and the mindset to dominate.', contentTypes: 'highlight_reel,training_clip,coach_breakdown', target: 'Parents of competitive players (ages 12-17)' },
    { brandPodId: ra1.id, lane: 'Exposure & Opportunity', message: 'Get seen by the right people. Our tournament schedule and coach connections open doors to the next level.', contentTypes: 'tournament_recap,player_highlight,coach_endorsement', target: 'Parents of players seeking college exposure' },
    { brandPodId: ra1.id, lane: 'Team Culture', message: 'Rise As One is more than a team — it is a brotherhood built on hard work, discipline, and collective excellence.', contentTypes: 'team_content,behind_scenes,culture_video', target: 'Players and parents valuing team environment' },
    { brandPodId: shotiq.id, lane: 'AI Innovation', message: 'The future of basketball training is here. AI that watches, learns, and coaches your shot in real-time.', contentTypes: 'product_demo,tech_explainer,data_visualization', target: 'Tech-forward coaches and trainers' },
    { brandPodId: shotiq.id, lane: 'Results-Driven', message: 'Players using ShotIQ improve shooting accuracy by 18% in 90 days. The data speaks for itself.', contentTypes: 'case_study,stat_graphic,testimonial', target: 'Serious players seeking measurable improvement' },
    { brandPodId: hos.id, lane: 'Family Hub', message: 'One stop for the whole family. Multiple sports, all ages, all skill levels — under one roof.', contentTypes: 'facility_tour,family_content,event_promo', target: 'Multi-sport families' },
    { brandPodId: hos.id, lane: 'Event & Party', message: 'Birthdays, team events, and celebrations that score big. Let us handle the fun.', contentTypes: 'event_photo,party_package,booking_promo', target: 'Parents planning events' },
    { brandPodId: bookmark.id, lane: 'AI Simplicity', message: 'Stop overthinking your website. Tell our AI what you need, and watch it build in minutes.', contentTypes: 'product_demo,comparison,tutorial', target: 'Non-technical small business owners' },
    { brandPodId: bookmark.id, lane: 'Business Growth', message: 'Your website should work as hard as you do. SEO, e-commerce, analytics — all built in.', contentTypes: 'case_study,feature_highlight,roi_content', target: 'Growth-focused entrepreneurs' },
  ]
  for (const lane of lanes) {
    await prisma.messagingLane.create({ data: lane })
  }

  // ===== CAMPAIGNS =====
  const campaigns = [
    { brandPodId: tbf.id, name: 'Spring Training Enrollment Push', messagingLane: 'Fundamentals', goal: 'enrollment', targetAudience: 'Parents of youth players ages 6-12 in Bergen County NJ', offer: 'First week free + 20% off spring session', channels: ['instagram', 'facebook', 'google_ads', 'email'], budget: 3500, budgetSpent: 2840, horizon: 'H1', status: 'live', startDate: new Date('2026-02-01'), endDate: new Date('2026-03-15') },
    { brandPodId: tbf.id, name: 'TBF Transformation Video Series', messagingLane: 'Transformation Stories', goal: 'awareness', targetAudience: 'Parents researching basketball training programs', channels: ['instagram', 'tiktok', 'youtube'], budget: 1500, budgetSpent: 890, horizon: 'H2', status: 'live', startDate: new Date('2026-01-15'), endDate: new Date('2026-04-15') },
    { brandPodId: ra1.id, name: 'AAU Tryout Season 2026', messagingLane: 'Exposure & Opportunity', goal: 'lead_gen', targetAudience: 'Competitive basketball players ages 10-17 and parents', offer: 'Open tryout — $25 registration', channels: ['instagram', 'facebook', 'email', 'sms'], budget: 2000, budgetSpent: 1650, horizon: 'H1', status: 'live', startDate: new Date('2026-02-01'), endDate: new Date('2026-03-01') },
    { brandPodId: ra1.id, name: 'RA1 Culture Campaign', messagingLane: 'Team Culture', goal: 'awareness', targetAudience: 'Basketball community in tri-state area', channels: ['instagram', 'tiktok'], budget: 800, budgetSpent: 320, horizon: 'H2', status: 'assembling', startDate: new Date('2026-03-01'), endDate: new Date('2026-05-31') },
    { brandPodId: shotiq.id, name: 'ShotIQ Free Trial Blitz', messagingLane: 'AI Innovation', goal: 'sign_up', targetAudience: 'Basketball coaches and trainers globally', offer: '14-day free trial + onboarding call', channels: ['google_ads', 'youtube', 'twitter', 'linkedin'], budget: 5000, budgetSpent: 3200, horizon: 'H1', status: 'live', startDate: new Date('2026-01-20'), endDate: new Date('2026-03-20') },
    { brandPodId: shotiq.id, name: 'ShotIQ March Madness Tie-In', messagingLane: 'Results-Driven', goal: 'awareness', targetAudience: 'Basketball fans and players during March Madness', channels: ['twitter', 'tiktok', 'youtube'], budget: 3000, budgetSpent: 0, horizon: 'H2', status: 'draft', startDate: new Date('2026-03-15'), endDate: new Date('2026-04-10') },
    { brandPodId: hos.id, name: 'HoS Spring League Registration', messagingLane: 'Family Hub', goal: 'enrollment', targetAudience: 'Families in Northern NJ seeking spring sports leagues', offer: 'Early bird 15% discount', channels: ['facebook', 'instagram', 'google_ads', 'email'], budget: 2500, budgetSpent: 1900, horizon: 'H1', status: 'live', startDate: new Date('2026-02-01'), endDate: new Date('2026-03-10') },
    { brandPodId: hos.id, name: 'Birthday Party Packages Promo', messagingLane: 'Event & Party', goal: 'lead_gen', targetAudience: 'Parents planning birthday parties in Bergen County', offer: 'Book by March 1 — free pizza upgrade', channels: ['facebook', 'google_ads', 'instagram'], budget: 1200, budgetSpent: 780, horizon: 'H2', status: 'live', startDate: new Date('2026-02-01'), endDate: new Date('2026-03-01') },
    { brandPodId: bookmark.id, name: 'Bookmark AI Launch Campaign', messagingLane: 'AI Simplicity', goal: 'sign_up', targetAudience: 'Small business owners without a website or with outdated sites', offer: 'Build your site free — upgrade anytime', channels: ['google_ads', 'youtube', 'linkedin', 'twitter'], budget: 8000, budgetSpent: 5400, horizon: 'H1', status: 'live', startDate: new Date('2026-01-10'), endDate: new Date('2026-04-10') },
    { brandPodId: bookmark.id, name: 'Bookmark SMB Growth Webinar', messagingLane: 'Business Growth', goal: 'lead_gen', targetAudience: 'Entrepreneurs looking to scale their online presence', offer: 'Free webinar + exclusive Bookmark Pro discount', channels: ['linkedin', 'email', 'youtube'], budget: 2000, budgetSpent: 600, horizon: 'H2', status: 'assembling', startDate: new Date('2026-03-01'), endDate: new Date('2026-03-31') },
  ]

  const createdCampaigns = []
  for (const c of campaigns) {
    createdCampaigns.push(await prisma.campaign.create({ data: c }))
  }

  // ===== INTELLIGENCE ENTRIES =====
  const intel = [
    { brand: 'TBF', category: 'audience', source: 'Google Analytics + Meta Insights', insight: 'Parents ages 35-44 with household income $100K+ show 3x higher conversion rate. Bergen County and Passaic County are top-performing geos.', actionable: true, actionRecommended: 'Increase geo-targeting budget for Bergen/Passaic. Create lookalike audience from top converters.', priority: 'high', status: 'actioned' },
    { brand: 'TBF', category: 'competitor', source: 'Manual Research', insight: 'Hoop Group NJ running aggressive spring camp ads at $199/week price point. Their messaging focuses on "college exposure" even for younger kids.', actionable: true, actionRecommended: 'Counter with "fundamentals first" messaging. Emphasize our age-appropriate development approach.', priority: 'high', status: 'actioned' },
    { brand: 'TBF', category: 'seasonal', source: 'Historical Data', insight: 'February is peak enrollment inquiry month — 40% more leads than average. Parents planning spring activities.', actionable: true, actionRecommended: 'Front-load February ad spend. Launch enrollment push by Feb 1.', priority: 'high', status: 'actioned' },
    { brand: 'RA1', category: 'platform', source: 'Instagram Analytics', insight: 'Reels showing game highlights get 5x more saves than static posts. Tournament recap reels average 12K views vs 2K for photos.', actionable: true, actionRecommended: 'Shift content mix to 70% video. Request more game highlight content from Content Division.', priority: 'high', status: 'actioned' },
    { brand: 'RA1', category: 'audience', source: 'Tryout Registration Data', insight: '65% of tryout registrations come from Instagram DMs or bio link. Only 15% from Facebook.', actionable: true, actionRecommended: 'Reallocate budget from Facebook to Instagram for tryout campaigns. Optimize bio link and DM auto-responses.', priority: 'medium', status: 'actioned' },
    { brand: 'ShotIQ', category: 'industry', source: 'Market Research', insight: 'AI sports tech market growing 28% YoY. HomeCourt app raised $25M but focused on general fitness. Basketball-specific AI training is underserved.', actionable: true, actionRecommended: 'Double down on basketball-specific positioning. Create comparison content vs general fitness apps.', priority: 'high', status: 'actioned' },
    { brand: 'ShotIQ', category: 'platform', source: 'Google Ads Data', insight: 'Search terms "basketball training app" and "AI basketball coach" have low competition and $2.10 avg CPC. High intent keywords.', actionable: true, actionRecommended: 'Increase Google Ads budget for these terms. Create dedicated landing pages for each keyword cluster.', priority: 'high', status: 'actioned' },
    { brand: 'HoS', category: 'local_market', source: 'Local Events Calendar', insight: 'Spring break camps March 23-27 have 0 competitors running paid ads. Major opportunity for facility bookings.', actionable: true, actionRecommended: 'Launch spring break camp ads by March 1. Create dedicated landing page with booking.', priority: 'medium', status: 'actioned' },
    { brand: 'Bookmark', category: 'competitor', source: 'G2/Capterra Reviews', insight: 'Wix and Squarespace dominate SMB market but rated 3.8/5 for ease of use. Users complain about complexity. Bookmark AI approach is a clear differentiator.', actionable: true, actionRecommended: 'Create "Bookmark vs Wix" and "Bookmark vs Squarespace" comparison landing pages. Target competitor brand keywords.', priority: 'high', status: 'actioned' },
    { brand: 'Bookmark', category: 'audience', source: 'Trial User Surveys', insight: '72% of trial users are first-time website builders. Top industries: restaurants, consulting, fitness, real estate.', actionable: true, actionRecommended: 'Create industry-specific templates and landing pages. Run targeted campaigns for top 4 verticals.', priority: 'high', status: 'actioned' },
    { brand: 'all', category: 'platform', source: 'Meta Q1 2026 Updates', insight: 'Instagram algorithm now heavily favors Reels with text overlays and trending audio. Carousel reach down 20% across all brands.', actionable: true, actionRecommended: 'Shift content requests to Reels-first. Add text overlays to all short-form video. Brief Content Division.', priority: 'high', status: 'actioned' },
    { brand: 'TBF', category: 'pricing', source: 'Enrollment Data', insight: 'Monthly membership ($249/mo) converts 3x better than session packs ($35/session). Parents prefer predictable costs.', actionable: false, priority: 'medium', status: 'new' },
  ]
  for (const entry of intel) {
    await prisma.intelligenceEntry.create({ data: entry })
  }

  // ===== PERFORMANCE METRICS =====
  const perfData = [
    { campaignId: createdCampaigns[0].id, brand: 'TBF', channel: 'instagram', dateRange: '2026-02-01 to 2026-02-14', impressions: 45000, reach: 28000, frequency: 1.6, clicks: 1800, ctr: 4.0, engagementRate: 6.2, landingPageVisits: 1400, leadsGenerated: 42, leadConversionRate: 3.0, costPerLead: 12.50, enrollments: 11, enrollmentRate: 26.2, costPerEnrollment: 47.70, revenueGenerated: 5478, roas: 10.4, cpa: 47.70, ltvToCpaRatio: 5.2, budgetSpent: 525 },
    { campaignId: createdCampaigns[0].id, brand: 'TBF', channel: 'facebook', dateRange: '2026-02-01 to 2026-02-14', impressions: 32000, reach: 20000, frequency: 1.6, clicks: 960, ctr: 3.0, engagementRate: 3.8, landingPageVisits: 740, leadsGenerated: 18, leadConversionRate: 2.4, costPerLead: 19.40, enrollments: 4, enrollmentRate: 22.2, costPerEnrollment: 87.50, revenueGenerated: 1992, roas: 5.7, cpa: 87.50, ltvToCpaRatio: 2.8, budgetSpent: 350 },
    { campaignId: createdCampaigns[0].id, brand: 'TBF', channel: 'google_ads', dateRange: '2026-02-01 to 2026-02-14', impressions: 18000, reach: 15000, frequency: 1.2, clicks: 720, ctr: 4.0, engagementRate: 2.1, landingPageVisits: 680, leadsGenerated: 34, leadConversionRate: 5.0, costPerLead: 17.60, enrollments: 9, enrollmentRate: 26.5, costPerEnrollment: 66.70, revenueGenerated: 4482, roas: 7.5, cpa: 66.70, ltvToCpaRatio: 3.7, budgetSpent: 600 },
    { campaignId: createdCampaigns[2].id, brand: 'RA1', channel: 'instagram', dateRange: '2026-02-01 to 2026-02-14', impressions: 38000, reach: 25000, frequency: 1.5, clicks: 2100, ctr: 5.5, engagementRate: 8.1, landingPageVisits: 1650, leadsGenerated: 55, leadConversionRate: 3.3, costPerLead: 10.90, enrollments: 0, revenueGenerated: 1375, roas: 2.3, budgetSpent: 600 },
    { campaignId: createdCampaigns[4].id, brand: 'ShotIQ', channel: 'google_ads', dateRange: '2026-01-20 to 2026-02-14', impressions: 95000, reach: 72000, frequency: 1.3, clicks: 4750, ctr: 5.0, engagementRate: 3.2, landingPageVisits: 4200, leadsGenerated: 168, leadConversionRate: 4.0, costPerLead: 8.90, enrollments: 22, enrollmentRate: 13.1, costPerEnrollment: 68.20, revenueGenerated: 4400, roas: 2.9, cpa: 68.20, ltvToCpaRatio: 4.4, budgetSpent: 1500 },
    { campaignId: createdCampaigns[4].id, brand: 'ShotIQ', channel: 'youtube', dateRange: '2026-01-20 to 2026-02-14', impressions: 62000, reach: 48000, frequency: 1.3, videoViews: 31000, clicks: 1860, ctr: 3.0, engagementRate: 5.1, landingPageVisits: 1400, leadsGenerated: 56, leadConversionRate: 4.0, costPerLead: 14.30, enrollments: 8, enrollmentRate: 14.3, costPerEnrollment: 100, revenueGenerated: 1600, roas: 2.0, cpa: 100, ltvToCpaRatio: 3.0, budgetSpent: 800 },
    { campaignId: createdCampaigns[6].id, brand: 'HoS', channel: 'facebook', dateRange: '2026-02-01 to 2026-02-14', impressions: 28000, reach: 18000, frequency: 1.6, clicks: 840, ctr: 3.0, engagementRate: 4.2, landingPageVisits: 650, leadsGenerated: 26, leadConversionRate: 4.0, costPerLead: 23.10, enrollments: 14, enrollmentRate: 53.8, costPerEnrollment: 42.90, revenueGenerated: 4200, roas: 7.0, cpa: 42.90, ltvToCpaRatio: 4.7, budgetSpent: 600 },
    { campaignId: createdCampaigns[7].id, brand: 'HoS', channel: 'google_ads', dateRange: '2026-02-01 to 2026-02-14', impressions: 12000, reach: 9500, frequency: 1.3, clicks: 480, ctr: 4.0, engagementRate: 1.8, landingPageVisits: 420, leadsGenerated: 18, leadConversionRate: 4.3, costPerLead: 16.70, enrollments: 0, revenueGenerated: 0, budgetSpent: 300 },
    { campaignId: createdCampaigns[8].id, brand: 'Bookmark', channel: 'google_ads', dateRange: '2026-01-10 to 2026-02-14', impressions: 280000, reach: 210000, frequency: 1.3, clicks: 14000, ctr: 5.0, engagementRate: 2.8, landingPageVisits: 12600, leadsGenerated: 504, leadConversionRate: 4.0, costPerLead: 5.16, enrollments: 42, enrollmentRate: 8.3, costPerEnrollment: 61.90, revenueGenerated: 12600, roas: 4.8, cpa: 61.90, ltvToCpaRatio: 5.8, budgetSpent: 2600 },
    { campaignId: createdCampaigns[8].id, brand: 'Bookmark', channel: 'youtube', dateRange: '2026-01-10 to 2026-02-14', impressions: 150000, reach: 110000, frequency: 1.4, videoViews: 75000, clicks: 6000, ctr: 4.0, engagementRate: 4.5, landingPageVisits: 4800, leadsGenerated: 144, leadConversionRate: 3.0, costPerLead: 9.70, enrollments: 10, enrollmentRate: 6.9, costPerEnrollment: 140, revenueGenerated: 3000, roas: 2.1, cpa: 140, ltvToCpaRatio: 2.6, budgetSpent: 1400 },
  ]
  for (const p of perfData) {
    await prisma.performanceMetric.create({ data: p })
  }

  // ===== CREATIVE BRIEFS =====
  const briefs = [
    { brand: 'TBF', campaignName: 'Spring Training Enrollment Push', campaignGoal: 'enrollment', targetAudience: 'Parents of youth players ages 6-12', messagingLane: 'Fundamentals', keyMessage: 'Build your game from the ground up. Spring sessions now enrolling — first week free.', cta: 'Claim Your Free Week', assetsNeeded: [{ type: 'short_video', quantity: 3, platform: 'instagram_reels', requirements: 'Show kids in drills, upbeat music, text overlays' }, { type: 'carousel', quantity: 2, platform: 'instagram', requirements: 'Before/after skill progression' }], priority: 'urgent', status: 'delivered', deliveredAssets: ['asset_tbf_001', 'asset_tbf_002', 'asset_tbf_003'] },
    { brand: 'ShotIQ', campaignName: 'ShotIQ Free Trial Blitz', campaignGoal: 'sign_up', targetAudience: 'Basketball coaches and trainers', messagingLane: 'AI Innovation', keyMessage: 'Your players deserve AI-powered coaching. Start your free trial today.', cta: 'Start Free Trial', assetsNeeded: [{ type: 'product_demo', quantity: 1, platform: 'youtube', requirements: '60-90 sec demo showing AI analysis in action' }, { type: 'short_video', quantity: 4, platform: 'tiktok', requirements: 'Quick AI analysis clips with wow factor' }], priority: 'urgent', status: 'in_production' },
    { brand: 'Bookmark', campaignName: 'Bookmark AI Launch Campaign', campaignGoal: 'sign_up', targetAudience: 'Small business owners', messagingLane: 'AI Simplicity', keyMessage: 'Watch AI build your website in under 2 minutes. No coding. No design skills. Just results.', cta: 'Build Your Site Free', assetsNeeded: [{ type: 'product_demo', quantity: 1, platform: 'youtube', requirements: 'Screen recording of AI building a site from prompt' }, { type: 'testimonial', quantity: 3, platform: 'multi', requirements: 'Real SMB owners showing their Bookmark sites' }], priority: 'standard', status: 'delivered', deliveredAssets: ['asset_bm_001', 'asset_bm_002', 'asset_bm_003', 'asset_bm_004'] },
    { brand: 'HoS', campaignName: 'Birthday Party Packages', campaignGoal: 'lead_gen', targetAudience: 'Parents planning parties', messagingLane: 'Event & Party', keyMessage: 'The birthday party they will never forget. Sports, fun, and zero stress for parents.', cta: 'Book Your Party', assetsNeeded: [{ type: 'photo_set', quantity: 1, platform: 'facebook', requirements: '8-10 photos of actual parties at HoS' }, { type: 'short_video', quantity: 2, platform: 'instagram_reels', requirements: 'Happy kids at party, parent testimonial' }], priority: 'standard', status: 'submitted' },
  ]
  for (const b of briefs) {
    await prisma.creativeBrief.create({ data: b })
  }

  // ===== LEARNING RULES =====
  const rules = [
    { brand: 'TBF', dataSource: 'Spring 2025 + Fall 2025 campaigns', rule: 'Video testimonials from current parents outperform all other creative types by 2.5x for enrollment campaigns. Always lead with parent testimonial in ad sequence.', confidence: 'high', appliesTo: 'assembly,creative_briefs', loopType: 'content_feedback' },
    { brand: 'TBF', dataSource: 'Q4 2025 enrollment data', rule: 'Free trial offers convert 3x better than discount offers for new families. Always offer a free session before asking for enrollment.', confidence: 'high', appliesTo: 'campaigns,assembly', loopType: 'campaign_pattern' },
    { brand: 'RA1', dataSource: 'Tryout campaigns 2024-2025', rule: 'Instagram DMs convert to tryout registrations at 4x the rate of bio link clicks. Invest in DM automation and quick response.', confidence: 'high', appliesTo: 'deployments,assembly', loopType: 'funnel_optimization' },
    { brand: 'ShotIQ', dataSource: 'Jan 2026 trial data', rule: 'YouTube product demo videos generate trials at 40% lower CPA than Google Search ads, but take 2x longer to convert. Use YouTube for top-of-funnel, Google for bottom.', confidence: 'medium', appliesTo: 'campaigns,deployments', loopType: 'campaign_pattern' },
    { brand: 'HoS', dataSource: 'Birthday party bookings 2025', rule: 'Facebook ads targeting parents with children ages 5-10 within 10-mile radius outperform broader targeting by 3x for party bookings.', confidence: 'high', appliesTo: 'deployments', loopType: 'campaign_pattern' },
    { brand: 'Bookmark', dataSource: 'Launch campaign A/B tests', rule: 'Landing pages showing the AI building a site in real-time (video hero) convert 65% better than static screenshots.', confidence: 'high', appliesTo: 'assembly,creative_briefs', loopType: 'funnel_optimization' },
    { brand: 'all', dataSource: 'Cross-brand Q4 2025 analysis', rule: 'Email sequences with 3 touchpoints over 7 days have 28% higher conversion than single-send campaigns. Always use drip sequences.', confidence: 'high', appliesTo: 'assembly,deployments', loopType: 'campaign_pattern' },
    { brand: 'all', dataSource: 'Instagram analytics Jan 2026', rule: 'Reels under 15 seconds with text overlays and trending audio get 3x the reach of longer formats. Prioritize short-form.', confidence: 'high', appliesTo: 'creative_briefs,assembly', loopType: 'content_feedback' },
  ]
  for (const r of rules) {
    await prisma.learningRule.create({ data: r })
  }

  // ===== SEASONAL PATTERNS =====
  const seasonal = [
    { brand: 'TBF', observation: 'February is peak enrollment inquiry month — parents planning spring activities. 40% above average lead volume.', action: 'Front-load ad spend in February. Launch spring enrollment campaigns by Feb 1. Increase budget 30%.', months: [2, 3], status: 'active' },
    { brand: 'TBF', observation: 'Summer camp registrations spike in April-May. Late planners convert at lower rates.', action: 'Launch early-bird summer camp campaign in March. Offer discount for early registration.', months: [3, 4, 5], status: 'active' },
    { brand: 'RA1', observation: 'AAU tryout interest peaks January-February for spring/summer season. Must capture early.', action: 'Begin tryout awareness campaign in January. Registration opens Feb 1.', months: [1, 2], status: 'active' },
    { brand: 'ShotIQ', observation: 'March Madness drives 60% spike in basketball-related searches. Massive awareness opportunity.', action: 'Run March Madness tie-in campaign. Create bracket-related content. Boost trial offers.', months: [3], status: 'active' },
    { brand: 'HoS', observation: 'Birthday party bookings peak March-May for spring parties. Fall secondary peak Sept-Oct.', action: 'Launch party promo campaigns 6 weeks before peak periods. Emphasize early booking discounts.', months: [2, 3, 4, 5, 8, 9, 10], status: 'active' },
    { brand: 'Bookmark', observation: 'New Year resolution drives small business website creation interest in January. "New year, new website" messaging resonates.', action: 'Heavy January campaign with resolution-themed messaging. Q1 is strongest quarter.', months: [1, 2], status: 'active' },
    { brand: 'all', observation: 'Social media engagement drops 15-20% during major holidays (Thanksgiving, Christmas, July 4th).', action: 'Reduce ad spend during holiday weeks. Shift budget to pre/post holiday windows.', months: [7, 11, 12], status: 'active' },
  ]
  for (const s of seasonal) {
    await prisma.seasonalPattern.create({ data: s })
  }

  // ===== FUNNEL ANALYSES =====
  const funnels = [
    { brand: 'TBF', funnelName: 'TBF Free Trial Enrollment Funnel', stages: [{ stage: 'Ad Click', conversionRate: 4.0, dropOffReason: null, fix: null }, { stage: 'Landing Page', conversionRate: 45, dropOffReason: 'Page load speed on mobile', fix: 'Optimize images, lazy load below fold' }, { stage: 'Form Submit', conversionRate: 28, dropOffReason: 'Too many form fields', fix: 'Reduce to name, email, phone, child age' }, { stage: 'Trial Booking', conversionRate: 65, dropOffReason: 'Scheduling friction', fix: 'Add inline calendar widget' }, { stage: 'Trial Attended', conversionRate: 72, dropOffReason: 'No-shows', fix: 'SMS reminder 24h + 1h before' }, { stage: 'Enrolled', conversionRate: 40, dropOffReason: 'Price objection', fix: 'Introduce monthly payment option' }], weakestLink: 'Form Submit', improvement: 'Simplified form from 8 fields to 4. Expected 15% conversion lift.' },
    { brand: 'ShotIQ', funnelName: 'ShotIQ SaaS Trial-to-Paid', stages: [{ stage: 'Ad Click', conversionRate: 5.0, dropOffReason: null, fix: null }, { stage: 'Landing Page', conversionRate: 52, dropOffReason: null, fix: null }, { stage: 'Trial Signup', conversionRate: 35, dropOffReason: 'Requires credit card', fix: 'Remove credit card requirement for trial' }, { stage: 'First Session', conversionRate: 60, dropOffReason: 'Onboarding complexity', fix: 'Add guided first-session tutorial' }, { stage: 'Day 7 Active', conversionRate: 45, dropOffReason: 'Feature discovery', fix: 'Drip email showing features days 2-7' }, { stage: 'Paid Conversion', conversionRate: 22, dropOffReason: 'Price vs perceived value', fix: 'Add comparison chart vs manual coaching costs' }], weakestLink: 'Paid Conversion', improvement: 'Adding ROI calculator and coach testimonials to day 10 email. Testing.' },
    { brand: 'Bookmark', funnelName: 'Bookmark Free-to-Pro Upgrade', stages: [{ stage: 'Ad Click', conversionRate: 5.0, dropOffReason: null, fix: null }, { stage: 'Landing Page', conversionRate: 55, dropOffReason: null, fix: null }, { stage: 'Free Signup', conversionRate: 42, dropOffReason: null, fix: null }, { stage: 'Site Created', conversionRate: 78, dropOffReason: null, fix: null }, { stage: 'Custom Domain Interest', conversionRate: 35, dropOffReason: 'Users satisfied with free subdomain', fix: 'Show professional credibility benefits of custom domain' }, { stage: 'Pro Upgrade', conversionRate: 23, dropOffReason: 'Monthly price sensitivity', fix: 'Offer annual plan with 40% savings highlight' }], weakestLink: 'Custom Domain Interest', improvement: 'Testing "Your business deserves its own address" messaging in-app.' },
  ]
  for (const f of funnels) {
    await prisma.funnelAnalysis.create({ data: f })
  }

  // ===== CONTENT FEEDBACK =====
  const feedback = [
    { brand: 'TBF', period: 'January 2026', topPerforming: [{ asset: 'Parent Testimonial Reel - Smith Family', views: 28000, engagement: 8.2, leads: 14 }, { asset: 'Dribbling Drill Breakdown', views: 22000, engagement: 7.1, leads: 8 }], worstPerforming: [{ asset: 'Generic Gym Photo Carousel', views: 1200, engagement: 1.1, leads: 0 }, { asset: 'Schedule Infographic', views: 900, engagement: 0.8, leads: 0 }], contentGaps: ['Need more "day in the life" content showing actual training sessions', 'No coach introduction content — parents want to know who is training their kids'], formatInsights: [{ format: 'Reels', avgEngagement: 7.2, recommendation: 'Keep producing — top performer' }, { format: 'Carousels', avgEngagement: 2.1, recommendation: 'Reduce frequency, shift to Reels' }], sentToContent: true },
    { brand: 'ShotIQ', period: 'January 2026', topPerforming: [{ asset: 'AI Analysis Demo - 60 sec', views: 85000, engagement: 5.4, trials: 42 }, { asset: 'Before/After Shot Form', views: 45000, engagement: 6.8, trials: 18 }], worstPerforming: [{ asset: 'Feature List Graphic', views: 3000, engagement: 0.9, trials: 1 }, { asset: 'Pricing Comparison Table', views: 4500, engagement: 1.2, trials: 2 }], contentGaps: ['Need coach testimonials using ShotIQ with their teams', 'Missing "how it works" explainer for non-technical audience'], formatInsights: [{ format: 'Product Demo Video', avgEngagement: 5.8, recommendation: 'Highest trial conversion — produce more variants' }, { format: 'Static Graphics', avgEngagement: 1.0, recommendation: 'Phase out for product content' }], sentToContent: true },
  ]
  for (const f of feedback) {
    await prisma.contentFeedback.create({ data: f })
  }

  // ===== TV SHOWS =====
  const shows = [
    { brand: 'TBF', showName: 'The Factory Floor', format: '10-12 min deep dive', cadence: '1x/week', marketingRole: 'Top-of-funnel awareness. Each episode showcases training philosophy, player development stories, and behind-the-scenes facility content. Drives YouTube subscribers and email list growth.', episodes: 24, avgWatchDuration: 7.2, leadsPerEpisode: 3.5, status: 'active' },
    { brand: 'RA1', showName: 'Rise & Grind', format: '8-10 min docuseries', cadence: '2x/month', marketingRole: 'Brand building and recruitment. Follows AAU team through tournaments and practices. Creates emotional connection with prospective families.', episodes: 12, avgWatchDuration: 6.8, leadsPerEpisode: 2.1, status: 'active' },
    { brand: 'ShotIQ', showName: 'Shot Science', format: '5-7 min educational', cadence: '1x/week', marketingRole: 'Product education and thought leadership. Breaks down shooting mechanics with AI analysis overlay. Positions ShotIQ as the authority in shot development.', episodes: 18, avgWatchDuration: 5.1, leadsPerEpisode: 8.2, status: 'active' },
    { brand: 'HoS', showName: 'Game Day at the House', format: '3-5 min highlight show', cadence: '1x/week during league season', marketingRole: 'Community engagement and league promotion. Highlights league games, player spotlights, and facility events. Drives league registrations.', episodes: 10, avgWatchDuration: 3.8, leadsPerEpisode: 1.5, status: 'active' },
    { brand: 'Bookmark', showName: 'Built by AI', format: '12-15 min case study', cadence: '2x/month', marketingRole: 'Social proof and product demonstration. Each episode features a real business owner building their site with Bookmark AI. Drives trial signups.', episodes: 8, avgWatchDuration: 9.4, leadsPerEpisode: 12.0, status: 'active' },
  ]
  for (const s of shows) {
    await prisma.tVShowMarketing.create({ data: s })
  }

  // ===== MYMEMO =====
  const memos = [
    { brand: 'TBF', messagingLane: 'Transformation Stories', formatIdea: 'clip_idea', content: 'Parent at pickup said "My son went from barely dribbling to running the offense in 3 months." Get this on camera.', whySaved: 'Perfect testimonial opportunity — real transformation story with specific timeline.', priority: 'use_this_week', status: 'new' },
    { brand: 'ShotIQ', formatIdea: 'ad_concept', content: 'Split screen: left side manual coach giving feedback, right side ShotIQ AI giving same feedback instantly. Speed comparison.', whySaved: 'Visual demonstrates the AI advantage instantly. Great for TikTok and YouTube pre-roll.', priority: 'use_soon', status: 'briefed' },
    { brand: 'Bookmark', formatIdea: 'tweet_swipe', content: 'Thread idea: "I asked AI to build a website for my bakery. Here is what happened in 47 seconds." With screen recording.', whySaved: 'Viral potential — shows speed and quality. Perfect for Twitter/X launch push.', priority: 'use_this_week', status: 'new' },
    { brand: 'RA1', formatIdea: 'design_reference', content: 'Overtime Elite Instagram style — dark backgrounds, bold typography, player silhouettes. Premium AAU aesthetic.', whySaved: 'Benchmark for RA1 visual identity upgrade. Share with Content Division for brand guide.', priority: 'bank_for_later', status: 'new' },
    { brand: 'HoS', formatIdea: 'email_concept', content: 'Birthday party follow-up sequence: Day 1 thank you + photos, Day 7 review request, Day 30 "book your next party" with discount.', whySaved: 'No post-party email sequence exists. Easy revenue from repeat bookings.', priority: 'use_soon', status: 'new' },
  ]
  for (const m of memos) {
    await prisma.myMemo.create({ data: m })
  }

  // ===== CONTENT ASSETS =====
  const assets = [
    { assetId: 'asset_tbf_001', brand: 'TBF', messagingLane: 'Fundamentals', format: 'short_video', platformOptimized: 'ig_reels', dimensions: '9:16', duration: 15, captionText: 'Every champion starts with the basics. Spring enrollment is OPEN 🏀🔥 First week FREE → Link in bio', hashtags: '#basketball #youthsports #basketballtraining #njbasketball', ctaText: 'Claim Your Free Week', status: 'deployed' },
    { assetId: 'asset_tbf_002', brand: 'TBF', messagingLane: 'Fundamentals', format: 'short_video', platformOptimized: 'ig_reels', dimensions: '9:16', duration: 12, captionText: 'Watch this 8-year-old nail the crossover drill after just 4 weeks 👀🏀', hashtags: '#basketballfactory #kidssports #ballislife', ctaText: 'Start Training Today', status: 'deployed' },
    { assetId: 'asset_tbf_003', brand: 'TBF', messagingLane: 'Transformation Stories', format: 'short_video', platformOptimized: 'ig_reels', dimensions: '9:16', duration: 30, captionText: 'From "I can\'t" to "Watch me." The Smith family shares their TBF journey. 💪', hashtags: '#transformation #basketballtraining #parenttestimonial', ctaText: 'Book a Free Trial', status: 'deployed' },
    { assetId: 'asset_bm_001', brand: 'Bookmark', messagingLane: 'AI Simplicity', format: 'mid_video', platformOptimized: 'youtube', dimensions: '16:9', duration: 90, captionText: 'Watch AI build a professional website in under 2 minutes. No coding required.', ctaText: 'Build Yours Free', status: 'deployed' },
    { assetId: 'asset_bm_002', brand: 'Bookmark', messagingLane: 'AI Simplicity', format: 'short_video', platformOptimized: 'tiktok', dimensions: '9:16', duration: 15, captionText: 'POV: You asked AI to build your website and it actually looks good 🤯', hashtags: '#ai #website #smallbusiness #entrepreneur', ctaText: 'Try Bookmark Free', status: 'deployed' },
    { assetId: 'asset_shotiq_001', brand: 'ShotIQ', messagingLane: 'AI Innovation', format: 'short_video', platformOptimized: 'tiktok', dimensions: '9:16', duration: 18, captionText: 'AI just analyzed this player\'s shot form in real-time 🤖🏀 The future of training is here.', hashtags: '#basketball #ai #shotiq #training', ctaText: 'Try ShotIQ Free', status: 'assigned_to_campaign' },
    { assetId: 'asset_ra1_001', brand: 'RA1', messagingLane: 'Exposure & Opportunity', format: 'short_video', platformOptimized: 'ig_reels', dimensions: '9:16', duration: 20, captionText: 'Tournament highlights from last weekend 🔥 These boys came to COMPETE. Tryouts open now.', hashtags: '#aau #basketball #risingstar #tryouts', ctaText: 'Register for Tryouts', status: 'deployed' },
    { assetId: 'asset_hos_001', brand: 'HoS', messagingLane: 'Family Hub', format: 'short_video', platformOptimized: 'ig_reels', dimensions: '9:16', duration: 15, captionText: 'Basketball, soccer, flag football — all under one roof 🏠⚽🏀🏈 Spring leagues now open!', hashtags: '#houseofsports #youthleagues #njsports', ctaText: 'Register Now', status: 'deployed' },
  ]
  for (const a of assets) {
    await prisma.contentAsset.create({ data: a })
  }

  // ===== QUALITY GATE REVIEWS =====
  const reviews = [
    { campaignId: createdCampaigns[0].id, reviewType: 'pre_launch', brandCompliance: { messageOnBrand: true, visualIdentity: true, toneOfVoice: true, approvedOffer: true }, messagingCheck: { ctaClear: true, valueProposition: true, audienceMatch: true }, funnelCheck: { landingPageLive: true, formWorking: true, trackingPixels: true, emailSequenceActive: true }, adCompliance: { platformPolicies: true, imageTextRatio: true, disclaimers: true }, decision: 'pass' },
    { campaignId: createdCampaigns[4].id, reviewType: 'pre_launch', brandCompliance: { messageOnBrand: true, visualIdentity: true, toneOfVoice: true, approvedOffer: true }, messagingCheck: { ctaClear: true, valueProposition: true, audienceMatch: true }, funnelCheck: { landingPageLive: true, formWorking: true, trackingPixels: true, emailSequenceActive: false }, adCompliance: { platformPolicies: true, imageTextRatio: true }, decision: 'revise', revisionNotes: 'Email onboarding sequence not active yet. Must be live before campaign launch.' },
    { campaignId: createdCampaigns[8].id, reviewType: 'pre_launch', brandCompliance: { messageOnBrand: true, visualIdentity: true, toneOfVoice: true }, messagingCheck: { ctaClear: true, valueProposition: true, audienceMatch: true }, funnelCheck: { landingPageLive: true, formWorking: true, trackingPixels: true, emailSequenceActive: true }, adCompliance: { platformPolicies: true, imageTextRatio: true, disclaimers: true }, decision: 'pass' },
  ]
  for (const r of reviews) {
    await prisma.qualityGateReview.create({ data: r })
  }

  // ===== DEPLOYMENTS =====
  const deployments = [
    { campaignId: createdCampaigns[0].id, channel: 'instagram', platform: 'paid', contentAssets: ['asset_tbf_001', 'asset_tbf_002', 'asset_tbf_003'], schedule: { startDate: '2026-02-01', frequency: 'daily', adSets: 3 }, budget: 1200, budgetSpent: 525, status: 'live', launchedAt: new Date('2026-02-01') },
    { campaignId: createdCampaigns[0].id, channel: 'facebook', platform: 'paid', contentAssets: ['asset_tbf_001', 'asset_tbf_003'], schedule: { startDate: '2026-02-01', frequency: 'daily', adSets: 2 }, budget: 800, budgetSpent: 350, status: 'live', launchedAt: new Date('2026-02-01') },
    { campaignId: createdCampaigns[0].id, channel: 'google_ads', platform: 'paid', schedule: { startDate: '2026-02-01', keywords: ['basketball training NJ', 'youth basketball near me', 'basketball camps bergen county'] }, budget: 1000, budgetSpent: 600, status: 'live', launchedAt: new Date('2026-02-01') },
    { campaignId: createdCampaigns[4].id, channel: 'google_ads', platform: 'paid', schedule: { startDate: '2026-01-20', keywords: ['basketball training app', 'AI basketball coach', 'shot analysis app'] }, budget: 2500, budgetSpent: 1500, status: 'live', launchedAt: new Date('2026-01-20') },
    { campaignId: createdCampaigns[4].id, channel: 'youtube', platform: 'paid', contentAssets: ['asset_shotiq_001'], schedule: { startDate: '2026-01-20', adFormat: 'in-stream skippable', targeting: 'basketball content viewers' }, budget: 1500, budgetSpent: 800, status: 'live', launchedAt: new Date('2026-01-20') },
    { campaignId: createdCampaigns[8].id, channel: 'google_ads', platform: 'paid', schedule: { startDate: '2026-01-10', keywords: ['AI website builder', 'free website maker', 'website builder for small business'] }, budget: 4000, budgetSpent: 2600, status: 'live', launchedAt: new Date('2026-01-10') },
    { campaignId: createdCampaigns[8].id, channel: 'youtube', platform: 'paid', contentAssets: ['asset_bm_001'], schedule: { startDate: '2026-01-10', adFormat: 'in-stream skippable', targeting: 'small business content viewers' }, budget: 2500, budgetSpent: 1400, status: 'live', launchedAt: new Date('2026-01-10') },
  ]
  for (const d of deployments) {
    await prisma.channelDeployment.create({ data: d })
  }

  console.log('✅ Seed complete!')
  console.log('  - 5 Brand Pods')
  console.log('  - 11 Messaging Lanes')
  console.log('  - 10 Campaigns')
  console.log('  - 12 Intelligence Entries')
  console.log('  - 10 Performance Metrics')
  console.log('  - 4 Creative Briefs')
  console.log('  - 8 Learning Rules')
  console.log('  - 7 Seasonal Patterns')
  console.log('  - 3 Funnel Analyses')
  console.log('  - 2 Content Feedback Reports')
  console.log('  - 5 TV Shows')
  console.log('  - 5 MyMemo Ideas')
  console.log('  - 8 Content Assets')
  console.log('  - 3 Quality Gate Reviews')
  console.log('  - 7 Channel Deployments')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
