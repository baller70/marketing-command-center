import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface Email {
  id: string;
  subject: string;
  from: string;
  fromName?: string;
  date: string;
  snippet?: string;
  isRealPerson: boolean;
  category: 'parent' | 'business' | 'marketing' | 'notification' | 'unknown';
}

// Domains/patterns to EXCLUDE (marketing, notifications, shopping, etc.)
const EXCLUDED_DOMAINS = [
  'noreply',
  'no-reply',
  'donotreply',
  'notifications@',
  'newsletter@',
  'marketing@',
  'promo@',
  'deals@',
  'offers@',
  'info@',
  'support@',
  'help@',
  'mailer-daemon',
  'postmaster',
  '@google.com',
  '@googlemail.com',
  '@facebookmail.com',
  '@linkedin.com',
  '@twitter.com',
  '@x.com',
  '@instagram.com',
  '@youtube.com',
  '@tiktok.com',
  '@pinterest.com',
  '@spotify.com',
  '@apple.com',
  '@amazon.com',
  '@ebay.com',
  '@paypal.com',
  '@stripe.com',
  '@square.com',
  '@shopify.com',
  '@mailchimp.com',
  '@sendfox.com',
  '@sendgrid.com',
  '@constantcontact.com',
  '@hubspot.com',
  '@salesforce.com',
  '@zoom.us',
  '@calendly.com',
  '@docusign.com',
  '@dropbox.com',
  '@slack.com',
  '@notion.so',
  '@trello.com',
  '@asana.com',
  '@monday.com',
  '@github.com',
  '@gitlab.com',
  '@bitbucket.org',
  '@npmjs.com',
  '@vercel.com',
  '@netlify.com',
  '@heroku.com',
  '@aws.amazon.com',
  '@cloudflare.com',
  '@godaddy.com',
  '@namecheap.com',
  '@wix.com',
  '@squarespace.com',
  '@wordpress.com',
  '@canva.com',
  '@adobe.com',
  '@intuit.com',
  '@quickbooks.com',
  '@freshbooks.com',
  '@xero.com',
  '@bankofamerica.com',
  '@chase.com',
  '@wellsfargo.com',
  '@citi.com',
  '@capitalone.com',
  '@discover.com',
  '@americanexpress.com',
  '@usps.com',
  '@ups.com',
  '@fedex.com',
  '@dhl.com',
  'unsubscribe',
  'newsletter',
  'promo',
  'marketing',
  'campaign',
  'digest',
  'weekly',
  'daily',
  'alert@',
  'alerts@',
  'update@',
  'updates@',
  'news@',
  'announce@',
  'team@',
  'hello@',
  'hi@',
  'contact@'
];

// Keywords that indicate a REAL person inquiry (basketball-related)
const REAL_PERSON_KEYWORDS = [
  'basketball',
  'training',
  'tryout',
  'tryouts',
  'practice',
  'coach',
  'player',
  'son',
  'daughter',
  'child',
  'kid',
  'register',
  'registration',
  'sign up',
  'signup',
  'interested',
  'program',
  'session',
  'camp',
  'clinic',
  'schedule',
  'cost',
  'price',
  'fee',
  'how much',
  'information',
  'aau',
  'team',
  'league',
  'tournament',
  'game',
  'class',
  'lesson'
];

function isExcludedEmail(email: string, subject: string = ''): boolean {
  const emailLower = email.toLowerCase();
  const subjectLower = subject.toLowerCase();
  
  // Check domain/pattern exclusions
  for (const pattern of EXCLUDED_DOMAINS) {
    if (emailLower.includes(pattern.toLowerCase())) {
      return true;
    }
  }
  
  // Check subject for marketing indicators
  const marketingSubjectPatterns = [
    'unsubscribe',
    '% off',
    'sale',
    'deal',
    'discount',
    'limited time',
    'act now',
    'don\'t miss',
    'exclusive offer',
    'free shipping',
    'order confirmation',
    'shipping update',
    'delivery notification',
    'your receipt',
    'payment received',
    'invoice',
    'statement',
    'security alert',
    'verify your',
    'confirm your',
    'reset your',
    'weekly digest',
    'daily digest',
    'newsletter'
  ];
  
  for (const pattern of marketingSubjectPatterns) {
    if (subjectLower.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}

function isRealPersonInquiry(subject: string, from: string): boolean {
  const subjectLower = (subject || '').toLowerCase();
  
  for (const keyword of REAL_PERSON_KEYWORDS) {
    if (subjectLower.includes(keyword)) {
      return true;
    }
  }
  
  return false;
}

function categorizeEmail(email: string, subject: string): Email['category'] {
  const subjectLower = (subject || '').toLowerCase();
  
  // Check for parent/player related
  if (isRealPersonInquiry(subject, email)) {
    return 'parent';
  }
  
  // Check for business inquiry
  if (subjectLower.includes('partnership') || 
      subjectLower.includes('collaboration') ||
      subjectLower.includes('sponsor') ||
      subjectLower.includes('proposal') ||
      subjectLower.includes('business')) {
    return 'business';
  }
  
  if (isExcludedEmail(email, subject)) {
    return 'marketing';
  }
  
  return 'unknown';
}

// Get recent emails using himalaya CLI
async function getRecentEmails(folder: string = 'INBOX', limit: number = 50, filterRealOnly: boolean = true): Promise<Email[]> {
  try {
    // Get more emails so we have enough after filtering
    const fetchLimit = filterRealOnly ? limit * 3 : limit;
    
    const { stdout } = await execAsync(
      `himalaya envelope list -f ${folder} -w ${fetchLimit} -o json 2>/dev/null`,
      { timeout: 30000 }
    );
    
    const rawEmails = JSON.parse(stdout);
    
    let emails: Email[] = rawEmails.map((e: any) => {
      const fromEmail = e.from?.addr || 'Unknown';
      const subject = e.subject || '(No Subject)';
      const category = categorizeEmail(fromEmail, subject);
      
      return {
        id: e.id,
        subject,
        from: fromEmail,
        fromName: e.from?.name || '',
        date: e.date,
        isRealPerson: category === 'parent' || category === 'business' || category === 'unknown',
        category
      };
    });
    
    // Filter out marketing if requested
    if (filterRealOnly) {
      emails = emails.filter(e => e.category !== 'marketing' && e.category !== 'notification');
    }
    
    // Sort: real person inquiries first
    emails.sort((a, b) => {
      if (a.category === 'parent' && b.category !== 'parent') return -1;
      if (b.category === 'parent' && a.category !== 'parent') return 1;
      if (a.category === 'business' && b.category !== 'business') return -1;
      if (b.category === 'business' && a.category !== 'business') return 1;
      return 0;
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
