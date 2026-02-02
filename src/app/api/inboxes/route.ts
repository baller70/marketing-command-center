import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const INBOXES_FILE = path.join(process.env.HOME || '', '.config/clawdbot/email_inboxes.json');

interface EmailInbox {
  id: string;
  name: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'imap';
  himalayanAccount?: string; // Account name in himalaya config
  brand?: string; // Optional brand association
  color: string;
  isActive: boolean;
  createdAt: string;
}

interface InboxConfig {
  inboxes: EmailInbox[];
  defaultInboxId: string | null;
}

function loadInboxes(): InboxConfig {
  try {
    if (fs.existsSync(INBOXES_FILE)) {
      return JSON.parse(fs.readFileSync(INBOXES_FILE, 'utf-8'));
    }
  } catch (e) {}
  
  // Default: Kevin's main inbox
  return {
    inboxes: [
      {
        id: 'main',
        name: 'TBF Main',
        email: 'khouston@thebasketballfactorynj.com',
        provider: 'gmail',
        himalayanAccount: 'default',
        brand: 'tbf',
        color: '#1E3A8A',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ],
    defaultInboxId: 'main'
  };
}

function saveInboxes(config: InboxConfig) {
  try {
    const dir = path.dirname(INBOXES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(INBOXES_FILE, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('Failed to save inboxes:', e);
  }
}

// GET: List all inboxes
export async function GET() {
  const config = loadInboxes();
  
  return NextResponse.json({
    success: true,
    inboxes: config.inboxes,
    defaultInboxId: config.defaultInboxId,
    count: config.inboxes.length
  });
}

// POST: Add or update inbox
export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;
  
  const config = loadInboxes();
  
  switch (action) {
    case 'add': {
      const { name, email, provider, himalayanAccount, brand, color } = body;
      
      if (!name || !email) {
        return NextResponse.json({ success: false, error: 'Name and email required' }, { status: 400 });
      }
      
      const newInbox: EmailInbox = {
        id: `inbox-${Date.now()}`,
        name,
        email,
        provider: provider || 'gmail',
        himalayanAccount: himalayanAccount || email,
        brand,
        color: color || '#666666',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      config.inboxes.push(newInbox);
      saveInboxes(config);
      
      return NextResponse.json({ success: true, inbox: newInbox });
    }
    
    case 'update': {
      const { id, updates } = body;
      const index = config.inboxes.findIndex(i => i.id === id);
      
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'Inbox not found' }, { status: 404 });
      }
      
      config.inboxes[index] = { ...config.inboxes[index], ...updates };
      saveInboxes(config);
      
      return NextResponse.json({ success: true, inbox: config.inboxes[index] });
    }
    
    case 'remove': {
      const { id } = body;
      config.inboxes = config.inboxes.filter(i => i.id !== id);
      
      if (config.defaultInboxId === id) {
        config.defaultInboxId = config.inboxes[0]?.id || null;
      }
      
      saveInboxes(config);
      
      return NextResponse.json({ success: true, removed: id });
    }
    
    case 'set-default': {
      const { id } = body;
      if (!config.inboxes.find(i => i.id === id)) {
        return NextResponse.json({ success: false, error: 'Inbox not found' }, { status: 404 });
      }
      
      config.defaultInboxId = id;
      saveInboxes(config);
      
      return NextResponse.json({ success: true, defaultInboxId: id });
    }
    
    default:
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
}
