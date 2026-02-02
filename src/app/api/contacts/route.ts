import { NextResponse } from 'next/server';

// Credentials
const SENDFOX_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5MzciLCJqdGkiOiJmNDE1ZGU4MTkxOWU5YTc0Yzg2Y2RlNWZiYWFiYzY1N2QwMmI5YzMwZTk4MjQ1OWFiOWU5MjkzMzlhYmRiOWJmYjMxYmI3YzhkZjFlOTE1MyIsImlhdCI6MTc2OTYwNDcxMy4xNzkzNjcsIm5iZiI6MTc2OTYwNDcxMy4xNzkzNjksImV4cCI6NDkyNTI3ODMxMy4xNzE0MTUsInN1YiI6IjE1MTUzOSIsInNjb3BlcyI6W119.hdxd37CTiKLeSmFDOOpJHe8F_qwbjiw6bNPOO_ASYGiaTcF_q-e1UxUgtW1ARLPwOLgZTZnZtwuCRmTojuEVzEmC3BpLoGfxQxgUa8an0sKgu6iCVWxRaEoWuxe4IQqwaMA1nD647H4V9zsvXYUuxW53_PdL6mYAiDChLbCpGexkiUysiIVwq-wS9fxOKHnmwfUFoU-telp0cYLYWtkV0rHrJf93lVZTank8nVXZFPV-5OzhJPhCvODcpnr2i6AfvRzfePIGdKJ8YjOp8ceYKmXF6NGGersYpbgNGAsSiDsGHPtV-ZsxcY8RcW3j2a4yke4hTyVkPsbO3kDxVjz0N6GkW0-asewemyYLnI1h9X8rQfKOcIkCj3WMiPKqDJJrd6v3SBYTANKvqj5SpDh5Jw0eQZhCKFNfU3Xsl4bNHZlzCj_EEO4SE_zQSLv93hqOV6TdXa5HvDGHAM9DAqJO4bFH4DOfxielOJnjEOJ0SxJnvn90aWKx6b07UEEVpmfQXIicEd16NXWij0vOMdGKkyU5H5LqYl8Zt0tBO2oa2nlTXJlCsfSJE6eKaU4kzNUhvzhvT8hQlnWztbiKu3lQfzlS0-iNfe16zZ4j49wF9tHxZ4fCpQvSWqEUNFmtIQJr0ncK5eqvNXFD9CdAXo-2k4OjAOATftQbTJVwjdotBY8';
const ACUMBAMAIL_TOKEN = 'f81b6ac2afae4b74b8eb18e2ce3359e2';
const ACUMBAMAIL_LIST_ID = '1090435';

interface UnifiedContact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  sources: string[];
  isReal: boolean;
  engagement: {
    lastOpened?: string;
    lastClicked?: string;
    confirmed: boolean;
    unsubscribed: boolean;
    bounced: boolean;
  };
  lists: string[];
  createdAt: string;
  note?: string;
}

// Filter out system/bot emails
const SYSTEM_PATTERNS = [
  'noreply', 'no-reply', 'donotreply', 'notifications@',
  '@google.com', '@facebook.com', '@stripe.com', '@dropbox.com',
  '@cloudflare.com', '@vonage.com', '@pnc.com', '@indeed.com',
  '@plaid.com', '@optimum.com', '@parentsquare.com', '@telnyx.com',
  '@twilio.com', 'portal@', 'calendar-notification', 'sellersupport@',
  '@applitrack.com', '@espnmail.com', '@email.nfl.com', '@collegeboard.org',
  'customerservice@', 'mailbot@', '@notify.', 'test.registration'
];

function isSystemEmail(email: string): boolean {
  const lowered = email.toLowerCase();
  return SYSTEM_PATTERNS.some(p => lowered.includes(p));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'real';
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search')?.toLowerCase();
  
  const contactMap = new Map<string, UnifiedContact>();
  
  // 1. Fetch SendFox contacts (get real leads - those with lists or form submissions)
  try {
    const sfRes = await fetch('https://api.sendfox.com/contacts?per_page=100', {
      headers: { 'Authorization': `Bearer ${SENDFOX_TOKEN}` },
      cache: 'no-store'
    });
    const sfData = await sfRes.json();
    
    if (sfData.data) {
      for (const c of sfData.data) {
        const email = c.email?.toLowerCase();
        if (!email) continue;
        
        // Only include contacts with lists OR form submissions OR notes (real leads)
        const hasLists = c.lists && c.lists.length > 0;
        const hasForm = !!c.form_id;
        const hasNote = c.contact_fields && c.contact_fields.length > 0;
        const isSystemAddr = isSystemEmail(email);
        
        const isRealLead = !isSystemAddr && (hasLists || hasForm || hasNote);
        
        const contact: UnifiedContact = {
          id: `sf-${c.id}`,
          email,
          firstName: c.first_name || '',
          lastName: c.last_name || '',
          fullName: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
          sources: ['SendFox'],
          isReal: isRealLead,
          engagement: {
            lastOpened: c.last_opened_at,
            lastClicked: c.last_clicked_at,
            confirmed: !!c.confirmed_at,
            unsubscribed: !!c.unsubscribed_at,
            bounced: !!c.bounced_at
          },
          lists: c.lists?.map((l: any) => l.name) || [],
          createdAt: c.created_at,
          note: c.contact_fields?.find((f: any) => f.name === 'how_can_we_help_you')?.value
        };
        
        // Always add if it's a real lead, otherwise only if filter is 'all'
        if (isRealLead || filter === 'all') {
          contactMap.set(email, contact);
        }
      }
    }
  } catch (error) {
    console.error('SendFox fetch error:', error);
  }
  
  // 2. Fetch Acumbamail contacts
  try {
    const amRes = await fetch(
      `https://acumbamail.com/api/1/getSubscribers/?auth_token=${ACUMBAMAIL_TOKEN}&list_id=${ACUMBAMAIL_LIST_ID}&response_type=json`,
      { cache: 'no-store' }
    );
    const amData = await amRes.json();
    
    for (const [key, info] of Object.entries(amData)) {
      if (typeof info !== 'object' || !(info as any).email) continue;
      const email = (info as any).email?.toLowerCase();
      if (!email) continue;
      
      const isSystemAddr = isSystemEmail(email);
      const isActive = (info as any).status === 'active';
      
      if (contactMap.has(email)) {
        // Merge sources
        const existing = contactMap.get(email)!;
        if (!existing.sources.includes('Acumbamail')) {
          existing.sources.push('Acumbamail');
          existing.lists.push('1st Verified List (Acumbamail)');
        }
      } else {
        // New contact from Acumbamail
        const contact: UnifiedContact = {
          id: `am-${(info as any).id}`,
          email,
          firstName: '',
          lastName: '',
          fullName: email.split('@')[0],
          sources: ['Acumbamail'],
          isReal: !isSystemAddr && isActive,
          engagement: {
            confirmed: isActive,
            unsubscribed: (info as any).status === 'unsubscribed',
            bounced: (info as any).status === 'bounced'
          },
          lists: ['1st Verified List (Acumbamail)'],
          createdAt: new Date().toISOString()
        };
        
        if (contact.isReal || filter === 'all') {
          contactMap.set(email, contact);
        }
      }
    }
  } catch (error) {
    console.error('Acumbamail fetch error:', error);
  }
  
  // Convert to array and apply filters
  let contacts = Array.from(contactMap.values());
  
  // Apply filter
  if (filter === 'real') {
    contacts = contacts.filter(c => c.isReal && !c.engagement.unsubscribed && !c.engagement.bounced);
  } else if (filter === 'engaged') {
    contacts = contacts.filter(c => 
      c.isReal && 
      (c.engagement.lastOpened || c.engagement.lastClicked || c.engagement.confirmed)
    );
  }
  
  // Search
  if (search) {
    contacts = contacts.filter(c => 
      c.email.includes(search) || 
      c.fullName.toLowerCase().includes(search) ||
      c.note?.toLowerCase().includes(search)
    );
  }
  
  // Sort: SendFox contacts with notes first, then by date
  contacts.sort((a, b) => {
    // Prioritize contacts with notes (real inquiries)
    if (a.note && !b.note) return -1;
    if (!a.note && b.note) return 1;
    // Then by sources (both platforms first)
    if (a.sources.length > b.sources.length) return -1;
    if (a.sources.length < b.sources.length) return 1;
    // Then by date
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Limit results
  contacts = contacts.slice(0, limit);
  
  // Stats
  const stats = {
    total: contacts.length,
    fromSendFox: contacts.filter(c => c.sources.includes('SendFox')).length,
    fromAcumbamail: contacts.filter(c => c.sources.includes('Acumbamail')).length,
    inBothPlatforms: contacts.filter(c => c.sources.length > 1).length,
    engaged: contacts.filter(c => c.engagement.lastOpened || c.engagement.lastClicked).length,
    confirmed: contacts.filter(c => c.engagement.confirmed).length,
    withNotes: contacts.filter(c => c.note).length
  };
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    filter,
    stats,
    contacts
  });
}
