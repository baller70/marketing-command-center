import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const PREFS_FILE = path.join(process.env.HOME || '', '.config/clawdbot/email_filter_prefs.json');

interface EmailFilterPrefs {
  trustedSenders: string[];
  trustedDomains: string[];
  blockedSenders: string[];
  blockedDomains: string[];
  blockedPatterns: string[];
  engagementHistory: {
    [email: string]: {
      addedToFunnel: number;
      markedSpam: number;
      ignored: number;
      lastSeen: string;
    }
  };
}

interface Email {
  id: string;
  subject: string;
  from: string;
  fromName?: string;
  date: string;
  snippet?: string;
  isRealPerson: boolean;
  isTrusted: boolean;
  category: 'parent' | 'business' | 'trusted' | 'marketing' | 'unknown';
  engagementScore: number;
}

// Load filter preferences
function loadPrefs(): EmailFilterPrefs {
  try {
    if (fs.existsSync(PREFS_FILE)) {
      return JSON.parse(fs.readFileSync(PREFS_FILE, 'utf-8'));
    }
  } catch (e) {}
  
  return {
    trustedSenders: [],
    trustedDomains: [],
    blockedSenders: [],
    blockedDomains: [],
    blockedPatterns: [],
    engagementHistory: {}
  };
}

// Keywords that indicate a REAL person inquiry (basketball-related)
const REAL_PERSON_KEYWORDS = [
  'basketball', 'training', 'tryout', 'tryouts', 'practice', 'coach',
  'player', 'son', 'daughter', 'child', 'kid', 'register', 'registration',
  'sign up', 'signup', 'interested', 'program', 'session', 'camp',
  'clinic', 'schedule', 'cost', 'price', 'fee', 'how much', 'information',
  'aau', 'team', 'league', 'tournament', 'game', 'class', 'lesson',
  'skills', 'development', 'youth', 'ages', 'grade', 'school'
];

// Business keywords
const BUSINESS_KEYWORDS = [
  'partnership', 'collaboration', 'sponsor', 'sponsorship', 'proposal',
  'business', 'opportunity', 'marketing', 'advertising', 'media'
];

// System sender patterns (always block)
const SYSTEM_PATTERNS = [
  'noreply', 'no-reply', 'donotreply', 'notifications@', 'notification@',
  'newsletter@', 'news@', 'marketing@', 'promo@', 'promotions@',
  'deals@', 'offers@', 'info@', 'support@', 'help@', 'team@',
  'hello@', 'hi@', 'contact@', 'mailer-daemon', 'postmaster',
  'bounce@', 'alert@', 'alerts@', 'update@', 'updates@', 'announce@',
  'digest@', 'weekly@', 'daily@', 'monthly@', 'auto@', 'automated@',
  'system@', 'admin@', 'billing@', 'invoice@', 'receipt@', 'order@',
  'shipping@', 'delivery@', 'tracking@', 'confirmation@'
];

function getDomain(email: string): string {
  const match = email.match(/@([^>]+)/);
  return match ? match[1].toLowerCase() : '';
}

function classifyEmail(email: string, subject: string, prefs: EmailFilterPrefs): {
  category: Email['category'];
  isTrusted: boolean;
  isBlocked: boolean;
  engagementScore: number;
} {
  const emailLower = email.toLowerCase();
  const subjectLower = (subject || '').toLowerCase();
  const domain = getDomain(emailLower);
  
  // Check engagement history
  const history = prefs.engagementHistory[emailLower];
  let engagementScore = 0;
  if (history) {
    engagementScore = (history.addedToFunnel * 10) - (history.markedSpam * 20) - (history.ignored * 1);
  }
  
  // 1. Check if explicitly trusted
  if (prefs.trustedSenders.includes(emailLower)) {
    return { category: 'trusted', isTrusted: true, isBlocked: false, engagementScore: 100 };
  }
  
  // 2. Check if domain is trusted
  if (prefs.trustedDomains.some(d => domain.includes(d))) {
    return { category: 'trusted', isTrusted: true, isBlocked: false, engagementScore: 50 };
  }
  
  // 3. Check if explicitly blocked
  if (prefs.blockedSenders.includes(emailLower)) {
    return { category: 'marketing', isTrusted: false, isBlocked: true, engagementScore: -100 };
  }
  
  // 4. Check if domain is blocked
  if (prefs.blockedDomains.some(d => domain.includes(d))) {
    return { category: 'marketing', isTrusted: false, isBlocked: true, engagementScore: -50 };
  }
  
  // 5. Check system patterns (always block)
  for (const pattern of SYSTEM_PATTERNS) {
    if (emailLower.includes(pattern)) {
      return { category: 'marketing', isTrusted: false, isBlocked: true, engagementScore: -50 };
    }
  }
  
  // 6. Check subject for blocked patterns
  for (const pattern of prefs.blockedPatterns) {
    if (subjectLower.includes(pattern)) {
      return { category: 'marketing', isTrusted: false, isBlocked: true, engagementScore: -30 };
    }
  }
  
  // 7. Check for basketball/parent keywords (positive)
  for (const keyword of REAL_PERSON_KEYWORDS) {
    if (subjectLower.includes(keyword)) {
      return { category: 'parent', isTrusted: false, isBlocked: false, engagementScore: engagementScore + 20 };
    }
  }
  
  // 8. Check for business keywords
  for (const keyword of BUSINESS_KEYWORDS) {
    if (subjectLower.includes(keyword)) {
      return { category: 'business', isTrusted: false, isBlocked: false, engagementScore: engagementScore + 10 };
    }
  }
  
  // 9. Check engagement history for repeat senders
  if (history && history.addedToFunnel > 0) {
    return { category: 'trusted', isTrusted: true, isBlocked: false, engagementScore };
  }
  
  if (history && history.markedSpam > 0) {
    return { category: 'marketing', isTrusted: false, isBlocked: true, engagementScore };
  }
  
  // 10. Default: unknown but show it
  return { category: 'unknown', isTrusted: false, isBlocked: false, engagementScore };
}

// Get recent emails using himalaya CLI
async function getRecentEmails(folder: string = 'INBOX', limit: number = 50, filterRealOnly: boolean = true): Promise<Email[]> {
  const prefs = loadPrefs();
  
  try {
    // Fetch more emails to have enough after filtering
    const fetchLimit = filterRealOnly ? limit * 4 : limit;
    
    const { stdout } = await execAsync(
      `himalaya envelope list -f ${folder} -w ${fetchLimit} -o json 2>/dev/null`,
      { timeout: 30000 }
    );
    
    const rawEmails = JSON.parse(stdout);
    
    let emails: Email[] = rawEmails.map((e: any) => {
      const fromEmail = e.from?.addr || 'Unknown';
      const subject = e.subject || '(No Subject)';
      const classification = classifyEmail(fromEmail, subject, prefs);
      
      return {
        id: e.id,
        subject,
        from: fromEmail,
        fromName: e.from?.name || '',
        date: e.date,
        isRealPerson: !classification.isBlocked,
        isTrusted: classification.isTrusted,
        category: classification.category,
        engagementScore: classification.engagementScore
      };
    });
    
    // Filter out marketing/blocked if requested
    if (filterRealOnly) {
      emails = emails.filter(e => e.category !== 'marketing');
    }
    
    // Sort: trusted first, then parents, then business, then by engagement score
    emails.sort((a, b) => {
      const categoryOrder = { trusted: 0, parent: 1, business: 2, unknown: 3, marketing: 4 };
      const catDiff = categoryOrder[a.category] - categoryOrder[b.category];
      if (catDiff !== 0) return catDiff;
      return b.engagementScore - a.engagementScore;
    });
    
    return emails.slice(0, limit);
  } catch (error) {
    console.error('Failed to get emails:', error);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folder = searchParams.get('folder') || 'INBOX';
  const limit = parseInt(searchParams.get('limit') || '30');
  const filter = searchParams.get('filter') || 'real'; // 'real' or 'all'

  const filterRealOnly = filter === 'real';
  const emails = await getRecentEmails(folder, limit, filterRealOnly);
  
  // Stats
  const stats = {
    total: emails.length,
    trusted: emails.filter(e => e.category === 'trusted').length,
    parents: emails.filter(e => e.category === 'parent').length,
    business: emails.filter(e => e.category === 'business').length,
    unknown: emails.filter(e => e.category === 'unknown').length
  };
  
  return NextResponse.json({
    success: true,
    folder,
    filter,
    count: emails.length,
    stats,
    emails,
    account: 'khouston@thebasketballfactorynj.com'
  });
}
