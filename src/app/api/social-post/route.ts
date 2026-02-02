import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Load Later API config
function getLaterConfig() {
  const configPath = path.join(process.env.HOME || '', '.config/clawdbot/social-platforms/config.json');
  try {
    const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return data.later;
  } catch (e) {
    return null;
  }
}

// Brand social media profiles mapping
const BRAND_SOCIAL_PROFILES: Record<string, {
  name: string;
  platforms: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  }
}> = {
  tbf: {
    name: 'The Basketball Factory',
    platforms: {
      instagram: 'thebasketballfactorynj',
      tiktok: 'thebasketballfactorynj',
      facebook: 'thebasketballfactorynj',
      twitter: 'tbfnj',
      youtube: '@thebasketballfactorynj'
    }
  },
  ra1: {
    name: 'Rise As One AAU',
    platforms: {
      instagram: 'riseasone_aau',
      tiktok: 'riseasone_aau',
      facebook: 'riseasoneaau',
      twitter: 'riseasone_aau'
    }
  },
  hos: {
    name: 'House of Sports',
    platforms: {
      instagram: 'houseofsportsnj',
      facebook: 'houseofsportsnj'
    }
  },
  shotiq: {
    name: 'ShotIQ',
    platforms: {
      instagram: 'shotiqai',
      tiktok: 'shotiqai',
      twitter: 'shotiqai'
    }
  },
  kevin: {
    name: 'Kevin Houston',
    platforms: {
      instagram: 'kevinhouston_hoops',
      tiktok: 'kevinhouston_hoops',
      twitter: 'kevinhouston',
      linkedin: 'kevinhouston'
    }
  },
  bookmarkai: {
    name: 'BookmarkAI Hub',
    platforms: {
      twitter: 'bookmarkaihub'
    }
  }
};

// Generate announcement text based on content type
function generateAnnouncementText(
  brand: string,
  contentType: string,
  headline: string,
  description?: string
): string {
  const brandData = BRAND_SOCIAL_PROFILES[brand];
  const brandName = brandData?.name || brand.toUpperCase();
  
  const templates: Record<string, string[]> = {
    newsletter: [
      `📰 NEW ${brandName} Newsletter just dropped! ${headline}\n\n${description || ''}\n\n🔗 Link in bio!`,
      `📬 Fresh update from ${brandName}! ${headline}\n\n${description || ''}\n\n#basketball #training`,
    ],
    announcement: [
      `🚨 ANNOUNCEMENT from ${brandName}!\n\n${headline}\n\n${description || ''}\n\n🔗 Link in bio for details!`,
      `📢 Big news! ${headline}\n\n${description || ''}\n\n#${brand.toLowerCase()} #basketball`,
    ],
    'tryout-promo': [
      `🏀 TRYOUTS COMING! ${headline}\n\n${description || ''}\n\nDon't miss your chance! 🔗 Link in bio\n\n#basketball #tryouts #aau`,
      `⚡ Ready to ball? ${brandName} tryouts are here!\n\n${headline}\n\n${description || ''}\n\n#hoops #basketball`,
    ],
    'player-spotlight': [
      `⭐ PLAYER SPOTLIGHT ⭐\n\n${headline}\n\n${description || ''}\n\nProud of our athletes! 🏀\n\n#playerofthemonth #basketball`,
      `🌟 Shoutout to this baller!\n\n${headline}\n\n${description || ''}\n\n#${brand.toLowerCase()} #basketballplayer`,
    ],
    'training-tips': [
      `📚 TRAINING TIP\n\n${headline}\n\n${description || ''}\n\nLevel up your game! 🏀\n\n#basketballtips #training`,
      `💪 Get better every day!\n\n${headline}\n\n${description || ''}\n\n#workout #basketball #skills`,
    ],
    'event-reminder': [
      `⏰ REMINDER: ${headline}\n\n${description || ''}\n\nSee you there! 🏀`,
      `📅 Don't forget! ${headline}\n\n${description || ''}\n\n#${brand.toLowerCase()}`,
    ],
    'game-results': [
      `🏆 GAME RECAP!\n\n${headline}\n\n${description || ''}\n\nGreat effort team! 💪\n\n#gameday #basketball`,
      `📊 Final score is in! ${headline}\n\n${description || ''}\n\n#hoops #${brand.toLowerCase()}`,
    ],
    default: [
      `🏀 ${brandName} Update!\n\n${headline}\n\n${description || ''}\n\n#basketball #${brand.toLowerCase()}`,
    ]
  };
  
  const typeTemplates = templates[contentType] || templates.default;
  return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
}

// Post to Later API
async function postToLater(
  apiKey: string,
  text: string,
  mediaUrl?: string,
  scheduledTime?: string,
  platforms: string[] = ['instagram', 'tiktok', 'facebook']
) {
  // Later API endpoint for creating posts
  const response = await fetch('https://api.later.com/v1/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      caption: text,
      media_url: mediaUrl,
      scheduled_at: scheduledTime || null, // null = add to queue
      platforms: platforms,
      publish_now: !scheduledTime
    })
  });
  
  return response.json();
}

// GET: Get brand social profiles
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  
  if (brand) {
    return NextResponse.json({
      success: true,
      brand,
      profiles: BRAND_SOCIAL_PROFILES[brand] || null
    });
  }
  
  return NextResponse.json({
    success: true,
    brands: BRAND_SOCIAL_PROFILES
  });
}

// POST: Create social announcement
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      brand, 
      contentType, 
      headline, 
      description, 
      mediaUrl,
      scheduledTime,
      platforms,
      customText
    } = body;
    
    if (!brand || !headline) {
      return NextResponse.json({ 
        success: false, 
        error: 'Brand and headline required' 
      }, { status: 400 });
    }
    
    const laterConfig = getLaterConfig();
    if (!laterConfig?.api_key) {
      return NextResponse.json({ 
        success: false, 
        error: 'Later API not configured' 
      }, { status: 500 });
    }
    
    // Generate or use custom announcement text
    const announcementText = customText || generateAnnouncementText(
      brand, 
      contentType || 'default', 
      headline, 
      description
    );
    
    // Get brand platforms if not specified
    const brandProfiles = BRAND_SOCIAL_PROFILES[brand];
    const targetPlatforms = platforms || Object.keys(brandProfiles?.platforms || {});
    
    // Post to Later
    const result = await postToLater(
      laterConfig.api_key,
      announcementText,
      mediaUrl,
      scheduledTime,
      targetPlatforms
    );
    
    return NextResponse.json({
      success: true,
      announcement: {
        brand,
        contentType,
        text: announcementText,
        platforms: targetPlatforms,
        scheduledTime: scheduledTime || 'queued'
      },
      laterResponse: result
    });
    
  } catch (error: any) {
    console.error('Failed to post to social:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
