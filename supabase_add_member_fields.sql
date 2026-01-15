-- SQL query om extra velden toe te voegen aan de users tabel in Supabase
-- Voer dit uit in je Supabase Dashboard → SQL Editor

-- Voeg email kolom toe
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Voeg phone kolom toe (telefoonnummer)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Voeg birthday kolom toe (verjaardag - date zonder jaar of met jaar)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS birthday DATE;

-- Optioneel: Maak indexes voor snellere queries
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone) WHERE phone IS NOT NULL;

-- Optioneel: Voeg comments toe voor documentatie
COMMENT ON COLUMN public.users.email IS 'Email adres van de medewerker';
COMMENT ON COLUMN public.users.phone IS 'Telefoonnummer van de medewerker';
COMMENT ON COLUMN public.users.birthday IS 'Verjaardag van de medewerker';





