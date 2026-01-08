/**
 * Utility functie om admin account aan te maken
 * 
 * Deze functie zorgt ervoor dat het admin account bestaat in localStorage
 */

// Maak functie beschikbaar in window voor debugging
declare global {
  interface Window {
    createAdminAccount: () => void;
    checkUsers: () => void;
  }
}

export function createAdminAccountIfNeeded() {
  if (typeof window === 'undefined') return;

  try {
    const storedUsers = localStorage.getItem('users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];

    // Check of admin account al bestaat (zoek op exacte username of admin role)
    const adminExists = users.some(
      (u: { username: string; role?: string }) =>
        u.username.toLowerCase().trim() === 'bor klessens' || 
        (u.role === 'admin' && u.username.toLowerCase().trim() === 'bor klessens')
    );

    if (!adminExists) {
      // Verwijder eventuele oude admin accounts met dezelfde username maar zonder role
      const filteredUsers = users.filter(
        (u: { username: string }) => u.username.toLowerCase().trim() !== 'bor klessens'
      );

      // Maak admin account aan
      const adminUser = {
        id: 'admin_bor_klessens',
        username: 'Bor Klessens',
        fullName: 'Bor Klessens',
        password: 'AdminBor',
        role: 'admin',
        createdAt: new Date().toISOString(),
      };

      filteredUsers.push(adminUser);
      localStorage.setItem('users', JSON.stringify(filteredUsers));
      console.log('✅ Admin account aangemaakt: Bor Klessens');
      console.log('Gebruikersnaam: Bor Klessens');
      console.log('Wachtwoord: AdminBor');
    } else {
      // Update bestaand account naar admin als het nog geen admin is
      const existingUserIndex = users.findIndex(
        (u: { username: string }) => u.username.toLowerCase().trim() === 'bor klessens'
      );
      
      if (existingUserIndex !== -1 && users[existingUserIndex].role !== 'admin') {
        users[existingUserIndex].role = 'admin';
        users[existingUserIndex].password = 'AdminBor'; // Update wachtwoord
        localStorage.setItem('users', JSON.stringify(users));
        console.log('✅ Bestaand account bijgewerkt naar admin: Bor Klessens');
      }
    }
  } catch (error) {
      console.error('❌ Error creating admin account:', error);
  }
}

// Debug functies voor browser console
if (typeof window !== 'undefined') {
  window.createAdminAccount = () => {
    createAdminAccountIfNeeded();
    console.log('Admin account setup uitgevoerd. Check met window.checkUsers()');
  };
  
  window.checkUsers = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    console.log('Alle gebruikers:', users);
    const admin = users.find((u: { username: string; role?: string }) => 
      u.username.toLowerCase().trim() === 'bor klessens'
    );
    if (admin) {
      console.log('✅ Admin account gevonden:', admin);
    } else {
      console.log('❌ Admin account niet gevonden. Voer window.createAdminAccount() uit');
    }
  };
}

