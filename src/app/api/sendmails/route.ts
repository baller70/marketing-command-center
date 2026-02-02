import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Load SendMails config
function getConfig() {
  const configPath = path.join(process.env.HOME || '', '.config/clawdbot/email_marketing.json');
  try {
    const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return data.sendmails;
  } catch (e) {
    return null;
  }
}

// GET: Fetch lists and stats from SendMails
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'lists';
  
  const config = getConfig();
  if (!config) {
    return NextResponse.json({ success: false, error: 'SendMails not configured' }, { status: 500 });
  }
  
  const baseUrl = config.baseUrl;
  const token = config.apiToken;
  
  try {
    if (action === 'lists') {
      const res = await fetch(`${baseUrl}/lists?api_token=${token}&per_page=50`);
      const lists = await res.json();
      
      // Group by brand based on naming convention
      const brandLists: Record<string, any[]> = {
        tbf: [],
        ra1: [],
        hos: [],
        shotiq: [],
        kevin: [],
        bookmarkai: [],
        other: []
      };
      
      let totalSubscribers = 0;
      
      for (const list of lists) {
        totalSubscribers += parseInt(list.subscribers) || 0;
        
        const name = list.name.toLowerCase();
        if (name.includes('[tbf]')) brandLists.tbf.push(list);
        else if (name.includes('[ra1]')) brandLists.ra1.push(list);
        else if (name.includes('[hos]')) brandLists.hos.push(list);
        else if (name.includes('[shotiq]')) brandLists.shotiq.push(list);
        else if (name.includes('[kevin]')) brandLists.kevin.push(list);
        else if (name.includes('[ai]')) brandLists.bookmarkai.push(list);
        else brandLists.other.push(list);
      }
      
      return NextResponse.json({
        success: true,
        platform: 'sendmails',
        totalLists: lists.length,
        totalSubscribers,
        lists,
        brandLists
      });
    }
    
    if (action === 'campaigns') {
      const res = await fetch(`${baseUrl}/campaigns?api_token=${token}&per_page=50`);
      const campaigns = await res.json();
      
      return NextResponse.json({
        success: true,
        platform: 'sendmails',
        campaigns
      });
    }
    
    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Add subscriber or create campaign
export async function POST(request: Request) {
  const body = await request.json();
  const { action, listId, email, firstName, lastName } = body;
  
  const config = getConfig();
  if (!config) {
    return NextResponse.json({ success: false, error: 'SendMails not configured' }, { status: 500 });
  }
  
  const baseUrl = config.baseUrl;
  const token = config.apiToken;
  
  try {
    if (action === 'add_subscriber') {
      if (!listId || !email) {
        return NextResponse.json({ success: false, error: 'listId and email required' }, { status: 400 });
      }
      
      // Get list UID first
      const listsRes = await fetch(`${baseUrl}/lists?api_token=${token}`);
      const lists = await listsRes.json();
      const list = lists.find((l: any) => l.id === parseInt(listId));
      
      if (!list) {
        return NextResponse.json({ success: false, error: 'List not found' }, { status: 404 });
      }
      
      // Add subscriber
      const res = await fetch(`${baseUrl}/subscribers?api_token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          list_uid: list.uid,
          EMAIL: email,
          FIRST_NAME: firstName || '',
          LAST_NAME: lastName || ''
        })
      });
      
      const result = await res.json();
      
      return NextResponse.json({
        success: result.status === 1,
        message: result.message,
        subscriber: result
      });
    }
    
    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
