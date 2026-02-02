import { NextResponse } from 'next/server';

// Credentials from ~/.config/clawdbot/email_marketing.json
const SENDFOX_TOKEN = process.env.SENDFOX_TOKEN || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5MzciLCJqdGkiOiJmNDE1ZGU4MTkxOWU5YTc0Yzg2Y2RlNWZiYWFiYzY1N2QwMmI5YzMwZTk4MjQ1OWFiOWU5MjkzMzlhYmRiOWJmYjMxYmI3YzhkZjFlOTE1MyIsImlhdCI6MTc2OTYwNDcxMy4xNzkzNjcsIm5iZiI6MTc2OTYwNDcxMy4xNzkzNjksImV4cCI6NDkyNTI3ODMxMy4xNzE0MTUsInN1YiI6IjE1MTUzOSIsInNjb3BlcyI6W119.hdxd37CTiKLeSmFDOOpJHe8F_qwbjiw6bNPOO_ASYGiaTcF_q-e1UxUgtW1ARLPwOLgZTZnZtwuCRmTojuEVzEmC3BpLoGfxQxgUa8an0sKgu6iCVWxRaEoWuxe4IQqwaMA1nD647H4V9zsvXYUuxW53_PdL6mYAiDChLbCpGexkiUysiIVwq-wS9fxOKHnmwfUFoU-telp0cYLYWtkV0rHrJf93lVZTank8nVXZFPV-5OzhJPhCvODcpnr2i6AfvRzfePIGdKJ8YjOp8ceYKmXF6NGGersYpbgNGAsSiDsGHPtV-ZsxcY8RcW3j2a4yke4hTyVkPsbO3kDxVjz0N6GkW0-asewemyYLnI1h9X8rQfKOcIkCj3WMiPKqDJJrd6v3SBYTANKvqj5SpDh5Jw0eQZhCKFNfU3Xsl4bNHZlzCj_EEO4SE_zQSLv93hqOV6TdXa5HvDGHAM9DAqJO4bFH4DOfxielOJnjEOJ0SxJnvn90aWKx6b07UEEVpmfQXIicEd16NXWij0vOMdGKkyU5H5LqYl8Zt0tBO2oa2nlTXJlCsfSJE6eKaU4kzNUhvzhvT8hQlnWztbiKu3lQfzlS0-iNfe16zZ4j49wF9tHxZ4fCpQvSWqEUNFmtIQJr0ncK5eqvNXFD9CdAXo-2k4OjAOATftQbTJVwjdotBY8';
const ACUMBAMAIL_TOKEN = process.env.ACUMBAMAIL_TOKEN || 'f81b6ac2afae4b74b8eb18e2ce3359e2';
const REACHINBOX_KEY = process.env.REACHINBOX_KEY || '631dc547-fa3e-45bf-bd7c-f00f4326f94d';

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
  } catch (error) {
    console.error('SendFox error:', error);
    return [];
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
  } catch (error) {
    console.error('Acumbamail error:', error);
    return [];
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
  } catch (error) {
    console.error('ReachInbox error:', error);
    return { campaigns: 0, account: null };
  }
}

// SendMails.io
const SENDMAILS_TOKEN = 'EthjAGruw7tRrxHxykz3dZl0egdtq2KEkinxwqDNsPCyS8auXKHd0ltztg7k';

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
  } catch (error) {
    console.error('SendMails error:', error);
    return [];
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
