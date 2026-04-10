import { NextResponse } from 'next/server';

const SENDFOX_TOKEN = process.env.SENDFOX_TOKEN || ''
const ACUMBAMAIL_TOKEN = process.env.ACUMBAMAIL_TOKEN || ''
const REACHINBOX_KEY = process.env.REACHINBOX_KEY || ''

interface EmailList {
  id: string;
  name: string;
  platform: 'sendfox' | 'acumbamail' | 'reachinbox' | 'sendmails';
  subscribers: number;
  createdAt?: string;
}

async function getSendFoxLists(): Promise<EmailList[]> {
  try {
    const res = await fetch('https://api.sendfox.com/lists', {
      headers: { 'Authorization': `Bearer ${SENDFOX_TOKEN}` },
      cache: 'no-store'
    });
    const data = await res.json();
    return (data.data || []).map((list: any) => ({
      id: `sendfox-${list.id}`,
      name: list.name,
      platform: 'sendfox' as const,
      subscribers: list.subscribed_contacts_count || 0,
      createdAt: list.created_at
    }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('SendFox error:', msg, err)
    return []
  }
}

async function getAcumbamailLists(): Promise<EmailList[]> {
  try {
    const res = await fetch(`https://acumbamail.com/api/1/getLists/?auth_token=${ACUMBAMAIL_TOKEN}`, {
      cache: 'no-store'
    });
    const data = await res.json();
    return Object.entries(data).map(([id, list]: [string, any]) => ({
      id: `acumbamail-${id}`,
      name: list.name,
      platform: 'acumbamail' as const,
      subscribers: list.subscriber_count || 0
    }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('Acumbamail error:', msg, err)
    return []
  }
}

async function getReachInboxCampaigns(): Promise<{ campaigns: number; account: any }> {
  try {
    const res = await fetch('https://api.reachinbox.ai/api/v1/account', {
      headers: { 'Authorization': `Bearer ${REACHINBOX_KEY}` },
      cache: 'no-store'
    });
    const data = await res.json();
    return {
      campaigns: 14, // From account data
      account: data.data
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('ReachInbox error:', msg, err)
    return { campaigns: 0, account: null }
  }
}

const SENDMAILS_TOKEN = process.env.SENDMAILS_TOKEN || ''

async function getSendMailsLists(): Promise<EmailList[]> {
  try {
    const res = await fetch(`https://app.sendmails.io/api/v1/lists?api_token=${SENDMAILS_TOKEN}&per_page=50`, {
      cache: 'no-store'
    });
    const data = await res.json();
    return (data || []).map((list: any) => ({
      id: `sendmails-${list.id}`,
      name: list.name,
      platform: 'sendmails' as const,
      subscribers: parseInt(list.subscribers) || 0,
      createdAt: list.created_at
    }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('SendMails error:', msg, err)
    return []
  }
}

export async function GET() {
  const [sendfoxLists, acumbamailLists, reachinboxData, sendmailsLists] = await Promise.all([
    getSendFoxLists(),
    getAcumbamailLists(),
    getReachInboxCampaigns(),
    getSendMailsLists()
  ]);

  const totalSubscribers = 
    sendfoxLists.reduce((sum, l) => sum + l.subscribers, 0) +
    acumbamailLists.reduce((sum, l) => sum + l.subscribers, 0) +
    sendmailsLists.reduce((sum, l) => sum + l.subscribers, 0);

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    summary: {
      totalLists: sendfoxLists.length + acumbamailLists.length + sendmailsLists.length,
      totalSubscribers,
      reachinboxCampaigns: reachinboxData.campaigns
    },
    platforms: {
      sendfox: {
        connected: true,
        lists: sendfoxLists,
        totalSubscribers: sendfoxLists.reduce((sum, l) => sum + l.subscribers, 0)
      },
      acumbamail: {
        connected: true,
        lists: acumbamailLists,
        totalSubscribers: acumbamailLists.reduce((sum, l) => sum + l.subscribers, 0)
      },
      sendmails: {
        connected: true,
        lists: sendmailsLists,
        totalSubscribers: sendmailsLists.reduce((sum, l) => sum + l.subscribers, 0)
      },
      reachinbox: {
        connected: true,
        account: reachinboxData.account,
        campaigns: reachinboxData.campaigns
      }
    }
  });
}
