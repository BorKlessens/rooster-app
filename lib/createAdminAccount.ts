/**
 * Utility functie om admin account aan te maken
 * 
 * Deze functie zorgt ervoor dat het admin account bestaat in Supabase en localStorage
 */

import { supabase } from './supabaseClient';
import { hashPassword } from './passwordUtils';

// Maak functie beschikbaar in window voor debugging
declare global {
  interface Window {
    createAdminAccount: () => Promise<void>;
    checkUsers: () => void;
  }
}

export async function createAdminAccountIfNeeded() {
  if (typeof window === 'undefined') return;

  // Maak beide admin accounts aan
  await createSingleAdminAccount('bor klessens', 'AdminBor', 'Bor Klessens');
  await createSingleAdminAccount('admin', 'admin', 'Admin');
}

// Helper functie om een enkel admin account aan te maken
async function createSingleAdminAccount(
  username: string,
  password: string,
  fullName: string
) {
  try {
    // Check of admin account al bestaat in Supabase
    const { data: existingAdmins, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1);

    if (checkError) {
      console.error(`Error checking admin "${username}" in Supabase:`, checkError);
      // Fallback naar localStorage
      await createAdminInLocalStorage(username, password, fullName);
      return;
    }

    if (existingAdmins && existingAdmins.length > 0) {
      const admin = existingAdmins[0];
      // Update role naar admin als het nog niet admin is
      if (admin.role !== 'admin') {
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', admin.id);

        if (updateError) {
          console.error(`Error updating admin role for "${username}":`, updateError);
        } else {
          console.log(`✅ Admin role bijgewerkt in Supabase voor: ${username}`);
        }
      }
      // Sla ook lokaal op voor backward compatibility
      await syncAdminToLocalStorage(admin);
      return;
    }

    // Admin bestaat niet, maak aan in Supabase
    const passwordHash = await hashPassword(password);
    
    const { data: newAdmin, error: insertError } = await supabase
      .from('users')
      .insert({
        username: username,
        full_name: fullName,
        password_hash: passwordHash,
        role: 'admin',
      })
      .select()
      .single();

    if (insertError) {
      console.error(`Error creating admin "${username}" in Supabase:`, insertError);
      // Fallback naar localStorage
      await createAdminInLocalStorage(username, password, fullName);
      return;
    }

    console.log(`✅ Admin account aangemaakt in Supabase: ${fullName}`);
    console.log(`Gebruikersnaam: ${username}`);
    console.log(`Wachtwoord: ${password}`);

    // Sla ook lokaal op voor backward compatibility
    await syncAdminToLocalStorage(newAdmin);
  } catch (error) {
    console.error(`❌ Error creating admin account "${username}":`, error);
    // Fallback naar localStorage
    await createAdminInLocalStorage(username, password, fullName);
  }
}

// Helper functie om admin in localStorage te maken (fallback)
async function createAdminInLocalStorage(
  username: string,
  password: string,
  fullName: string
) {
  try {
    const storedUsers = localStorage.getItem('users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];

    const adminExists = users.some(
      (u: { username: string; role?: string }) =>
        u.username.toLowerCase().trim() === username.toLowerCase().trim()
    );

    if (!adminExists) {
      const adminId = `admin_${username.toLowerCase().replace(/\s+/g, '_')}`;
      const adminUser = {
        id: adminId,
        username: username,
        fullName: fullName,
        password: password,
        role: 'admin',
        createdAt: new Date().toISOString(),
      };

      users.push(adminUser);
      localStorage.setItem('users', JSON.stringify(users));
      console.log(`✅ Admin account "${username}" aangemaakt in localStorage (fallback)`);
    }
  } catch (error) {
    console.error(`Error creating admin "${username}" in localStorage:`, error);
  }
}

// Helper functie om admin data te synchroniseren naar localStorage
async function syncAdminToLocalStorage(admin: any) {
  try {
    const storedUsers = localStorage.getItem('users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    
    const existingIndex = users.findIndex(
      (u: { id: string }) => u.id === admin.id
    );

    const adminData = {
      id: admin.id,
      username: admin.username,
      fullName: admin.full_name,
      role: admin.role,
    };

    if (existingIndex !== -1) {
      users[existingIndex] = adminData;
    } else {
      users.push(adminData);
    }

    localStorage.setItem('users', JSON.stringify(users));
  } catch (error) {
    console.error('Error syncing admin to localStorage:', error);
  }
}

// Debug functies voor browser console
if (typeof window !== 'undefined') {
  window.createAdminAccount = async () => {
    await createAdminAccountIfNeeded();
    console.log('Admin account setup uitgevoerd. Check met window.checkUsers()');
  };
  
  window.checkUsers = async () => {
    // Check Supabase
    try {
      const { data: supabaseUsers } = await supabase
        .from('users')
        .select('*');
      console.log('Gebruikers in Supabase:', supabaseUsers);
    } catch (error) {
      console.error('Error fetching users from Supabase:', error);
    }
    
    // Check localStorage
    const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
    console.log('Gebruikers in localStorage:', localUsers);
    
    const admins = localUsers.filter((u: { username: string; role?: string }) => 
      u.role === 'admin'
    );
    if (admins.length > 0) {
      console.log('✅ Admin accounts gevonden in localStorage:', admins);
    } else {
      console.log('❌ Geen admin accounts gevonden in localStorage. Voer window.createAdminAccount() uit');
    }
  };
}

