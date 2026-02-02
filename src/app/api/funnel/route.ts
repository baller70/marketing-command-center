import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Load credentials
function getCredentials() {
  const credPath = path.join(process.env.HOME || '', '.config/clawdbot/email_marketing.json');
  try {
    const data = fs.readFileSync(credPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// SendFox Lists (funnel stages)
const FUNNEL_STAGES = {
  // Main funnel stages
  'new-lead': { name: 'New Lead', listId: 534537, platform: 'sendfox' },
  'interested': { name: 'Interested Parent', listId: 522601, platform: 'sendfox' },
  'trial-booked': { name: 'Trial Booked', listId: null, platform: 'sendfox' },
  'active-customer': { name: 'Active Customer', listId: null, platform: 'sendfox' },
  
  // Program-specific lists
  'tbf-training': { name: 'TBF Training Interest', listId: 522601, platform: 'sendfox' },
  'ra1-aau': { name: 'Rise As One AAU Interest', listId: 522601, platform: 'sendfox' },
  'summer-camp': { name: 'Summer Camp Interest', listId: null, platform: 'sendfox' },
  
  // Engagement lists
  'newsletter': { name: 'Kevin Houston Newsletter', listId: null, platform: 'sendfox' },
  
  // SMS lists (Acumbamail)
  'sms-reminders': { name: 'SMS Reminders', listId: null, platform: 'acumbamail' }
};

// Add contact to SendFox list
async function addToSendFox(email: string, firstName: string, lastName: string, listId: number, apiKey: string) {
  const response = await fetch('https://api.sendfox.com/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      email,
      first_name: firstName,
      last_name: lastName,
      lists: [listId]
    })
  });
  
  return response.json();
}

// Add contact to Acumbamail list
async function addToAcumbamail(email: string, name: string, listId: string, authToken: string, customerId: string) {
  const response = await fetch(`https://acumbamail.com/api/1/addSubscriber/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      auth_token: authToken,
      customer_id: customerId,
      list_id: listId,
      merge_fields: JSON.stringify({ email, nombre: name })
    })
  });
  
  return response.json();
}

// GET: List available funnel stages
export async function GET() {
  const stages = Object.entries(FUNNEL_STAGES).map(([key, value]) => ({
    id: key,
    ...value
  }));
  
  return NextResponse.json({
    success: true,
    stages,
    count: stages.length
  });
}

// POST: Add contact to funnel
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, firstName, lastName, stage, notes } = body;
    
    if (!email || !stage) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and stage are required' 
      }, { status: 400 });
    }
    
    const funnelStage = FUNNEL_STAGES[stage as keyof typeof FUNNEL_STAGES];
    if (!funnelStage) {
      return NextResponse.json({ 
        success: false, 
        error: `Invalid stage: ${stage}` 
      }, { status: 400 });
    }
    
    if (!funnelStage.listId) {
      return NextResponse.json({ 
        success: false, 
        error: `List not configured for stage: ${funnelStage.name}. Please set up the list first.` 
      }, { status: 400 });
    }
    
    const creds = getCredentials();
    if (!creds) {
      return NextResponse.json({ 
        success: false, 
        error: 'Credentials not found' 
      }, { status: 500 });
    }
    
    // Parse name into first/last if not provided
    let fName = firstName || '';
    let lName = lastName || '';
    if (!fName && name) {
      const parts = name.split(' ');
      fName = parts[0] || '';
      lName = parts.slice(1).join(' ') || '';
    }
    
    let result;
    
    if (funnelStage.platform === 'sendfox') {
      const sendfoxKey = creds.sendfox?.api_key;
      if (!sendfoxKey) {
        return NextResponse.json({ 
          success: false, 
          error: 'SendFox API key not configured' 
        }, { status: 500 });
      }
      
      result = await addToSendFox(email, fName, lName, funnelStage.listId, sendfoxKey);
      
    } else if (funnelStage.platform === 'acumbamail') {
      const acumba = creds.acumbamail;
      if (!acumba?.auth_token || !acumba?.customer_id) {
        return NextResponse.json({ 
          success: false, 
          error: 'Acumbamail credentials not configured' 
        }, { status: 500 });
      }
      
      result = await addToAcumbamail(email, name || `${fName} ${lName}`, funnelStage.listId.toString(), acumba.auth_token, acumba.customer_id);
    }
    
    return NextResponse.json({
      success: true,
      added: {
        email,
        name: name || `${fName} ${lName}`.trim(),
        stage: funnelStage.name,
        platform: funnelStage.platform,
        listId: funnelStage.listId
      },
      apiResponse: result
    });
    
  } catch (error: any) {
    console.error('Failed to add to funnel:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
