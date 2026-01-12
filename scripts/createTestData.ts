/**
 * Script om test accounts en diensten aan te maken
 * 
 * Gebruik: npm run create-test-data
 * Of: npx tsx scripts/createTestData.ts
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Laad .env.local bestand als het bestaat
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Test accounts om aan te maken
const testAccounts = [
  { username: 'jan.jansen', fullName: 'Jan Jansen' },
  { username: 'marie.devries', fullName: 'Marie de Vries' },
  { username: 'piet.pietersen', fullName: 'Piet Pietersen' },
  { username: 'sarah.bakker', fullName: 'Sarah Bakker' },
  { username: 'tom.van.berg', fullName: 'Tom van Berg' },
  { username: 'lisa.janssen', fullName: 'Lisa Janssen' },
  { username: 'mike.de.vries', fullName: 'Mike de Vries' },
  { username: 'emma.smit', fullName: 'Emma Smit' },
];

const testPassword = 'Test123';

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function createTestAccounts() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    console.error('❌ Supabase environment variables niet ingesteld!');
    console.error('Zorg dat NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY zijn ingesteld.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const passwordHash = await hashPassword(testPassword);

  console.log('🚀 Start met aanmaken van test accounts...\n');

  const createdUsers: Array<{ id: string; username: string; fullName: string }> = [];

  for (const account of testAccounts) {
    try {
      // Check of account al bestaat
      const { data: existing } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', account.username)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`⏭️  Account "${account.username}" bestaat al, overslaan...`);
        createdUsers.push({
          id: existing[0].id,
          username: account.username,
          fullName: account.fullName,
        });
        continue;
      }

      // Maak account aan
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          username: account.username,
          full_name: account.fullName,
          password_hash: passwordHash,
          role: 'user',
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Fout bij aanmaken van "${account.username}":`, error.message);
        continue;
      }

      console.log(`✅ Account aangemaakt: ${account.fullName} (${account.username})`);
      createdUsers.push({
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.full_name,
      });
    } catch (error: any) {
      console.error(`❌ Error bij "${account.username}":`, error.message);
    }
  }

  console.log(`\n✅ ${createdUsers.length} accounts klaar voor gebruik!\n`);
  return createdUsers;
}

async function createTestShifts(users: Array<{ id: string; username: string; fullName: string }>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase niet geconfigureerd');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('📅 Start met aanmaken van test diensten...\n');

  const roles = ['Bediening', 'Keuken', 'Bar', 'Receptie'];
  const startTimes = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  const durations = [4, 5, 6, 7, 8]; // Uren

  // Maak diensten aan voor de komende 4 weken
  const today = new Date();
  const shifts: Array<{
    user_id: string;
    username: string;
    date: string;
    start_time: string;
    end_time: string;
    role: string | null;
    description: string | null;
  }> = [];

  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(today.getDate() + (week * 7) + day);

      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      // Bepaal hoeveel diensten op deze dag
      let shiftsPerDay = 0;
      if (isWeekend) {
        // Weekend: 1-3 diensten
        shiftsPerDay = Math.floor(Math.random() * 3) + 1;
      } else {
        // Doordeweeks: 2-5 diensten
        shiftsPerDay = Math.floor(Math.random() * 4) + 2;
      }

      // Maak meerdere diensten voor deze dag
      const usedStartTimes = new Set<string>();
      for (let i = 0; i < shiftsPerDay; i++) {
        // Kies een willekeurige gebruiker
        const user = users[Math.floor(Math.random() * users.length)];
        
        // Kies een starttijd die nog niet gebruikt is
        let startTime: string;
        let attempts = 0;
        do {
          startTime = startTimes[Math.floor(Math.random() * startTimes.length)];
          attempts++;
          if (attempts > 20) break; // Voorkom infinite loop
        } while (usedStartTimes.has(startTime));
        
        usedStartTimes.add(startTime);
        
        const duration = durations[Math.floor(Math.random() * durations.length)];
        
        // Bereken eindtijd
        const [startHour, startMin] = startTime.split(':').map(Number);
        const endHour = startHour + duration;
        const endTime = `${endHour.toString().padStart(2, '0')}:00`;
        
        // Zorg dat eindtijd niet na middernacht is
        if (endHour >= 24) continue;
        
        const role = Math.random() > 0.2 ? roles[Math.floor(Math.random() * roles.length)] : null;
        const descriptions = ['Horeca dienst', 'Evenement', 'Lunch dienst', 'Avond dienst', null];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];

        shifts.push({
          user_id: user.id,
          username: user.username,
          date: date.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          role,
          description,
        });
      }
    }
  }

  // Voeg diensten toe in batches van 10
  let created = 0;
  for (let i = 0; i < shifts.length; i += 10) {
    const batch = shifts.slice(i, i + 10);
    
    const { error } = await supabase
      .from('shifts')
      .insert(batch);

    if (error) {
      console.error(`❌ Fout bij batch ${Math.floor(i / 10) + 1}:`, error.message);
    } else {
      created += batch.length;
      console.log(`✅ Batch ${Math.floor(i / 10) + 1}: ${batch.length} diensten toegevoegd`);
    }
  }

  console.log(`\n✅ ${created} diensten aangemaakt voor de komende 4 weken!\n`);
}

async function main() {
  console.log('🎯 Test Data Generator\n');
  console.log('='.repeat(50));
  
  try {
    // Maak accounts aan
    const users = await createTestAccounts();
    
    if (users.length === 0) {
      console.log('⚠️  Geen accounts aangemaakt, stop script.');
      return;
    }

    // Wacht even
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Maak diensten aan
    await createTestShifts(users);

    console.log('='.repeat(50));
    console.log('✨ Klaar! Test data is aangemaakt.');
    console.log(`\n📝 Login gegevens:`);
    console.log(`   Wachtwoord voor alle accounts: ${testPassword}`);
    console.log(`\n👥 Accounts:`);
    users.forEach(user => {
      console.log(`   - ${user.fullName} (${user.username})`);
    });
    console.log('\n');
  } catch (error: any) {
    console.error('❌ Fout:', error.message);
    process.exit(1);
  }
}

// Run script
main().catch(console.error);

export { createTestAccounts, createTestShifts };

