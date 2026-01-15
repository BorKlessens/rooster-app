/**
 * Test functie om te checken of Supabase correct is geconfigureerd
 */

import { supabase } from './supabaseClient';

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
  details?: any;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check of env vars zijn ingesteld
    if (!supabaseUrl || !supabaseKey) {
      return {
        connected: false,
        error: 'Environment variables niet ingesteld',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
        },
      };
    }

    // Check of het geen placeholder is
    if (supabaseUrl.includes('placeholder')) {
      return {
        connected: false,
        error: 'Placeholder Supabase URL wordt gebruikt',
        details: { url: supabaseUrl },
      };
    }

    // Test een simpele query
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      return {
        connected: false,
        error: error.message,
        details: {
          code: error.code,
          message: error.message,
          hint: error.hint,
        },
      };
    }

    return {
      connected: true,
      details: {
        url: supabaseUrl,
        canQuery: true,
      },
    };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message || 'Onbekende fout',
      details: error,
    };
  }
}

// Maak beschikbaar in browser console voor debugging
if (typeof window !== 'undefined') {
  (window as any).testSupabase = testSupabaseConnection;
}






