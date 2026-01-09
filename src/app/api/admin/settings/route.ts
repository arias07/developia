import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SettingsState {
  general: {
    siteName: string;
    siteUrl: string;
    supportEmail: string;
    timezone: string;
  };
  notifications: {
    emailNotifications: boolean;
    slackNotifications: boolean;
    webhookUrl: string;
    notifyOnNewProject: boolean;
    notifyOnPayment: boolean;
    notifyOnEscalation: boolean;
  };
  integrations: {
    stripeEnabled: boolean;
    stripeTestMode: boolean;
    resendEnabled: boolean;
    githubEnabled: boolean;
    vercelEnabled: boolean;
    openaiEnabled: boolean;
  };
  security: {
    twoFactorRequired: boolean;
    sessionTimeout: number;
    ipWhitelist: string;
  };
}

// GET - Fetch all settings
export async function GET(request: NextRequest) {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('platform_settings')
      .select('category, key, value');

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Transform flat rows into nested structure
    const result: Record<string, Record<string, any>> = {
      general: {},
      notifications: {},
      integrations: {},
      security: {},
    };

    for (const row of settings || []) {
      if (result[row.category]) {
        result[row.category][row.key] = row.value;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/admin/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as SettingsState;

    // Flatten nested structure into rows for upsert
    const rows: { category: string; key: string; value: any }[] = [];

    for (const [category, settings] of Object.entries(body)) {
      for (const [key, value] of Object.entries(settings as Record<string, any>)) {
        rows.push({ category, key, value });
      }
    }

    // Upsert all settings
    const { error } = await supabaseAdmin
      .from('platform_settings')
      .upsert(
        rows.map((row) => ({
          category: row.category,
          key: row.key,
          value: row.value,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'category,key' }
      );

    if (error) {
      console.error('Error saving settings:', error);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/admin/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
