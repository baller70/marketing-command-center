import { NextResponse } from 'next/server';

const SENDFOX_TOKEN = process.env.SENDFOX_TOKEN || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5MzciLCJqdGkiOiJmNDE1ZGU4MTkxOWU5YTc0Yzg2Y2RlNWZiYWFiYzY1N2QwMmI5YzMwZTk4MjQ1OWFiOWU5MjkzMzlhYmRiOWJmYjMxYmI3YzhkZjFlOTE1MyIsImlhdCI6MTc2OTYwNDcxMy4xNzkzNjcsIm5iZiI6MTc2OTYwNDcxMy4xNzkzNjksImV4cCI6NDkyNTI3ODMxMy4xNzE0MTUsInN1YiI6IjE1MTUzOSIsInNjb3BlcyI6W119.hdxd37CTiKLeSmFDOOpJHe8F_qwbjiw6bNPOO_ASYGiaTcF_q-e1UxUgtW1ARLPwOLgZTZnZtwuCRmTojuEVzEmC3BpLoGfxQxgUa8an0sKgu6iCVWxRaEoWuxe4IQqwaMA1nD647H4V9zsvXYUuxW53_PdL6mYAiDChLbCpGexkiUysiIVwq-wS9fxOKHnmwfUFoU-telp0cYLYWtkV0rHrJf93lVZTank8nVXZFPV-5OzhJPhCvODcpnr2i6AfvRzfePIGdKJ8YjOp8ceYKmXF6NGGersYpbgNGAsSiDsGHPtV-ZsxcY8RcW3j2a4yke4hTyVkPsbO3kDxVjz0N6GkW0-asewemyYLnI1h9X8rQfKOcIkCj3WMiPKqDJJrd6v3SBYTANKvqj5SpDh5Jw0eQZhCKFNfU3Xsl4bNHZlzCj_EEO4SE_zQSLv93hqOV6TdXa5HvDGHAM9DAqJO4bFH4DOfxielOJnjEOJ0SxJnvn90aWKx6b07UEEVpmfQXIicEd16NXWij0vOMdGKkyU5H5LqYl8Zt0tBO2oa2nlTXJlCsfSJE6eKaU4kzNUhvzhvT8hQlnWztbiKu3lQfzlS0-iNfe16zZ4j49wF9tHxZ4fCpQvSWqEUNFmtIQJr0ncK5eqvNXFD9CdAXo-2k4OjAOATftQbTJVwjdotBY8';
const ACUMBAMAIL_TOKEN = process.env.ACUMBAMAIL_TOKEN || 'f81b6ac2afae4b74b8eb18e2ce3359e2';

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
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
