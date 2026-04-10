import { NextResponse } from 'next/server';

const SENDFOX_TOKEN = process.env.SENDFOX_TOKEN || ''
const ACUMBAMAIL_TOKEN = process.env.ACUMBAMAIL_TOKEN || ''

// Add contact to SendFox
async function addToSendFox(email: string, firstName: string, lastName: string, listId: number) {
  const res = await fetch('https://api.sendfox.com/contacts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDFOX_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      first_name: firstName,
      last_name: lastName,
      lists: [listId]
    })
  });
  return res.json();
}

// Add contact to Acumbamail
async function addToAcumbamail(email: string, listId: string, fields?: Record<string, string>) {
  const params = new URLSearchParams({
    auth_token: ACUMBAMAIL_TOKEN,
    list_id: listId,
    email,
    ...fields
  });
  
  const res = await fetch('https://acumbamail.com/api/1/addSubscriber/', {
    method: 'POST',
    body: params
  });
  return res.json();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform, action, data } = body;

    if (action === 'add_contact') {
      const { email, firstName, lastName, listId } = data;

      if (platform === 'sendfox') {
        const result = await addToSendFox(email, firstName, lastName, listId);
        return NextResponse.json({ success: true, platform: 'sendfox', result });
      }

      if (platform === 'acumbamail') {
        const result = await addToAcumbamail(email, listId, { name: `${firstName} ${lastName}` });
        return NextResponse.json({ success: true, platform: 'acumbamail', result });
      }
    }

    if (action === 'create_list') {
      const { name, platform: targetPlatform } = data;

      if (targetPlatform === 'sendfox') {
        const res = await fetch('https://api.sendfox.com/lists', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDFOX_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name })
        });
        const result = await res.json();
        return NextResponse.json({ success: true, platform: 'sendfox', result });
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid action or platform' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('Sync error:', msg, err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
