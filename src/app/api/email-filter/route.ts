import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PREFS_FILE = path.join(process.env.HOME || '', '.config/clawdbot/email_filter_prefs.json');

interface EmailFilterPrefs {
  trustedSenders: string[];        // Emails you've added to funnel or marked trusted
  trustedDomains: string[];        // Domains always allowed
  blockedSenders: string[];        // Specific emails marked as spam
  blockedDomains: string[];        // Domains always blocked
  blockedPatterns: string[];       // Subject patterns to block
  engagementHistory: {             // Track your interactions
    [email: string]: {
      addedToFunnel: number;       // Times added to funnel
      markedSpam: number;          // Times marked spam
      ignored: number;             // Times seen but not engaged
      lastSeen: string;
    }
  };
  updatedAt: string;
}

function loadPrefs(): EmailFilterPrefs {
  try {
    if (fs.existsSync(PREFS_FILE)) {
      return JSON.parse(fs.readFileSync(PREFS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load email prefs:', e);
  }
  
  // Default prefs
  return {
    trustedSenders: [],
    trustedDomains: [],
    blockedSenders: [],
    blockedDomains: [
      // Pre-populated blocked domains
      'noreply.com', 'no-reply.com', 'mailchimp.com', 'sendgrid.com',
      'constantcontact.com', 'hubspot.com', 'salesforce.com',
      'facebookmail.com', 'linkedin.com', 'twitter.com', 'x.com',
      'pinterest.com', 'tiktok.com', 'instagram.com',
      'amazon.com', 'ebay.com', 'paypal.com', 'stripe.com',
      'shopify.com', 'squarespace.com', 'wix.com',
      'godaddy.com', 'namecheap.com', 'cloudflare.com',
      'zoom.us', 'calendly.com', 'docusign.com',
      'dropbox.com', 'slack.com', 'notion.so', 'asana.com',
      'monday.com', 'trello.com', 'github.com', 'gitlab.com',
      'vercel.com', 'netlify.com', 'heroku.com',
      'bankofamerica.com', 'chase.com', 'wellsfargo.com', 'citi.com',
      'capitalone.com', 'discover.com', 'americanexpress.com',
      'usps.com', 'ups.com', 'fedex.com', 'dhl.com',
      'spotify.com', 'apple.com', 'google.com', 'youtube.com'
    ],
    blockedPatterns: [
      'unsubscribe', '% off', 'sale', 'deal', 'discount',
      'limited time', 'act now', 'don\'t miss', 'exclusive offer',
      'free shipping', 'order confirmation', 'shipping update',
      'delivery notification', 'your receipt', 'payment received',
      'invoice', 'statement', 'security alert', 'verify your',
      'confirm your', 'reset your', 'weekly digest', 'daily digest'
    ],
    engagementHistory: {},
    updatedAt: new Date().toISOString()
  };
}

function savePrefs(prefs: EmailFilterPrefs) {
  try {
    const dir = path.dirname(PREFS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    prefs.updatedAt = new Date().toISOString();
    fs.writeFileSync(PREFS_FILE, JSON.stringify(prefs, null, 2));
  } catch (e) {
    console.error('Failed to save email prefs:', e);
  }
}

// GET: Get current preferences and stats
export async function GET() {
  const prefs = loadPrefs();
  
  // Calculate stats
  const stats = {
    trustedSenders: prefs.trustedSenders.length,
    trustedDomains: prefs.trustedDomains.length,
    blockedSenders: prefs.blockedSenders.length,
    blockedDomains: prefs.blockedDomains.length,
    trackedSenders: Object.keys(prefs.engagementHistory).length
  };
  
  return NextResponse.json({
    success: true,
    prefs,
    stats
  });
}

// POST: Update preferences
export async function POST(request: Request) {
  const body = await request.json();
  const { action, email, domain, pattern } = body;
  
  const prefs = loadPrefs();
  const emailLower = email?.toLowerCase();
  const domainLower = domain?.toLowerCase();
  
  switch (action) {
    case 'trust-sender':
      // Add to trusted, remove from blocked
      if (emailLower && !prefs.trustedSenders.includes(emailLower)) {
        prefs.trustedSenders.push(emailLower);
        prefs.blockedSenders = prefs.blockedSenders.filter(e => e !== emailLower);
        
        // Update engagement history
        if (!prefs.engagementHistory[emailLower]) {
          prefs.engagementHistory[emailLower] = { addedToFunnel: 0, markedSpam: 0, ignored: 0, lastSeen: '' };
        }
        prefs.engagementHistory[emailLower].addedToFunnel++;
        prefs.engagementHistory[emailLower].lastSeen = new Date().toISOString();
      }
      break;
      
    case 'block-sender':
      // Add to blocked, remove from trusted
      if (emailLower && !prefs.blockedSenders.includes(emailLower)) {
        prefs.blockedSenders.push(emailLower);
        prefs.trustedSenders = prefs.trustedSenders.filter(e => e !== emailLower);
        
        // Update engagement history
        if (!prefs.engagementHistory[emailLower]) {
          prefs.engagementHistory[emailLower] = { addedToFunnel: 0, markedSpam: 0, ignored: 0, lastSeen: '' };
        }
        prefs.engagementHistory[emailLower].markedSpam++;
        prefs.engagementHistory[emailLower].lastSeen = new Date().toISOString();
      }
      break;
      
    case 'trust-domain':
      if (domainLower && !prefs.trustedDomains.includes(domainLower)) {
        prefs.trustedDomains.push(domainLower);
        prefs.blockedDomains = prefs.blockedDomains.filter(d => d !== domainLower);
      }
      break;
      
    case 'block-domain':
      if (domainLower && !prefs.blockedDomains.includes(domainLower)) {
        prefs.blockedDomains.push(domainLower);
        prefs.trustedDomains = prefs.trustedDomains.filter(d => d !== domainLower);
      }
      break;
      
    case 'block-pattern':
      if (pattern && !prefs.blockedPatterns.includes(pattern.toLowerCase())) {
        prefs.blockedPatterns.push(pattern.toLowerCase());
      }
      break;
      
    case 'record-ignore':
      // Track that user saw but didn't engage with this email
      if (emailLower) {
        if (!prefs.engagementHistory[emailLower]) {
          prefs.engagementHistory[emailLower] = { addedToFunnel: 0, markedSpam: 0, ignored: 0, lastSeen: '' };
        }
        prefs.engagementHistory[emailLower].ignored++;
        prefs.engagementHistory[emailLower].lastSeen = new Date().toISOString();
      }
      break;
      
    case 'untrust-sender':
      prefs.trustedSenders = prefs.trustedSenders.filter(e => e !== emailLower);
      break;
      
    case 'unblock-sender':
      prefs.blockedSenders = prefs.blockedSenders.filter(e => e !== emailLower);
      break;
      
    default:
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
  
  savePrefs(prefs);
  
  return NextResponse.json({
    success: true,
    action,
    email: emailLower,
    domain: domainLower,
    message: `Action '${action}' completed`
  });
}
