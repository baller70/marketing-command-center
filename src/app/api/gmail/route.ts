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
}

// Get recent emails using himalaya CLI
async function getRecentEmails(folder: string = 'INBOX', limit: number = 20): Promise<Email[]> {
  try {
    const { stdout } = await execAsync(
      `himalaya envelope list -f ${folder} -w ${limit} -o json 2>/dev/null`,
      { timeout: 30000 }
    );
    
    const emails = JSON.parse(stdout);
    return emails.map((e: any) => ({
      id: e.id,
      subject: e.subject || '(No Subject)',
      from: e.from?.addr || 'Unknown',
      fromName: e.from?.name || '',
      date: e.date
    }));
  } catch (error) {
    console.error('Failed to get emails:', error);
    return [];
  }
}

// Search emails
async function searchEmails(query: string, limit: number = 20): Promise<Email[]> {
  try {
    const { stdout } = await execAsync(
      `himalaya envelope list -f INBOX -w ${limit} -o json 2>/dev/null`,
      { timeout: 30000 }
    );
    
    const emails = JSON.parse(stdout);
    // Filter client-side for now (himalaya search is limited)
    return emails
      .filter((e: any) => {
        const searchLower = query.toLowerCase();
        return (
          (e.subject || '').toLowerCase().includes(searchLower) ||
          (e.from?.addr || '').toLowerCase().includes(searchLower) ||
          (e.from?.name || '').toLowerCase().includes(searchLower)
        );
      })
      .map((e: any) => ({
        id: e.id,
        subject: e.subject || '(No Subject)',
        from: e.from?.addr || 'Unknown',
        fromName: e.from?.name || '',
        date: e.date
      }));
  } catch (error) {
    console.error('Failed to search emails:', error);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folder = searchParams.get('folder') || 'INBOX';
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search');

  if (search) {
    const emails = await searchEmails(search, limit);
    return NextResponse.json({
      success: true,
      search,
      count: emails.length,
      emails
    });
  }

  const emails = await getRecentEmails(folder, limit);
  
  return NextResponse.json({
    success: true,
    folder,
    count: emails.length,
    emails,
    account: 'khouston@thebasketballfactorynj.com'
  });
}
