/**
 * Utility functies voor wachtwoord hashing en verificatie
 * 
 * Gebruikt bcryptjs voor veilige wachtwoord opslag
 */

import bcrypt from 'bcryptjs';

/**
 * Hash een wachtwoord voor opslag in database
 * @param password - Het plain text wachtwoord
 * @returns Gehasht wachtwoord
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verifieer een wachtwoord tegen een hash
 * @param password - Het plain text wachtwoord
 * @param hash - De opgeslagen hash
 * @returns True als wachtwoord correct is
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}




