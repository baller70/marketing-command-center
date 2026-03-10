import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { count = 20, topic = "General Updates", brand = "tbf", buttons = [] } = body;
    
    // Write config file
    const fs = require('fs');
    const path = require('path');
    const configPath = '/Users/kevinhouston/clawd/marketing/automation/wizard-config.json';
    
    fs.writeFileSync(configPath, JSON.stringify({
      count,
      topic,
      brand,
      buttons,
      fromName: "Kevin Houston",
      fromEmail: "khouston@thebasketballfactorynj.com"
    }, null, 2));

    // Execute the API-driven script
    const command = `node /Users/kevinhouston/clawd/marketing/automation/sendfox_wizard_api.js`;
    const { stdout, stderr } = await execAsync(command);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Wizard completed successfully',
      output: stdout,
      error: stderr
    });
    
  } catch (error: any) {
    console.error('Wizard error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
