# Rooster App

Webapp voor het plannen van diensten en het doorgeven van beschikbaarheid.
Gebouwd met Next.js 16, React 19, Tailwind 4 en Supabase. Werkt als PWA, dus
collega's kunnen de app op hun telefoon zetten als een gewone app.

## Hoe het in elkaar zit

Medewerkers loggen in met een gebruikersnaam en zien hun rooster, het rooster
van het team en geven hun beschikbaarheid door. Beheerders plannen diensten in
en beheren de accounts.

Authenticatie loopt via Supabase Auth. Omdat Supabase met e-mailadressen werkt
en collega's met een gebruikersnaam inloggen, wordt elke gebruikersnaam
deterministisch omgezet naar een intern adres (`jan.jansen@rooster.intern`). Dat
adres is puur een sleutel voor Supabase; er gaat nooit post naartoe en de
gebruiker ziet het niet. Zie [lib/auth.ts](lib/auth.ts).

De sessie staat in cookies, niet in `localStorage`. Daardoor kan `proxy.ts`
server-side controleren of iemand is ingelogd en of hij admin is, voordat er
ook maar een pagina wordt gerenderd.

Alle tabellen hebben Row Level Security. Een ingelogde medewerker kan dus ook
via de browserconsole niet meer opvragen dan hij mag zien:

| Tabel | Lezen | Schrijven |
| --- | --- | --- |
| `users` | eigen profiel, admins alles | alleen admins |
| `shifts` | iedereen die is ingelogd | alleen admins |
| `availability` | eigen rijen, admins alles | eigen rijen en admins |

Accounts aanmaken vereist de service role key, die RLS omzeilt. Dat gebeurt
daarom uitsluitend server-side in [app/api/admin/users](app/api/admin/users),
waar elke route eerst controleert of de aanroeper echt admin is.

## Opzetten

### 1. Supabase-project

Maak een nieuw project aan op [supabase.com](https://supabase.com). Kies een
regio in de EU (bijvoorbeeld Frankfurt); je slaat personeelsgegevens op, dus dat
is vanuit de AVG de rustigste keuze.

Aan de instellingen onder **Authentication** hoef je niets te wijzigen. De optie
**Confirm email** (onder **Authentication, Sign In / Providers, User Signups**)
geldt alleen voor mensen die zichzelf registreren, en dat kan hier niet. Elk
account wordt server-side aangemaakt met `email_confirm: true`, waardoor het
interne adres direct als bevestigd wordt opgeslagen. Zie
[app/api/admin/users/route.ts](app/api/admin/users/route.ts) en
[scripts/createAdmin.ts](scripts/createAdmin.ts).

### 2. Database

Open **SQL Editor** in het Supabase-dashboard, plak de volledige inhoud van
[supabase/schema.sql](supabase/schema.sql) en voer die uit. Dat bestand is de
enige bron van waarheid voor het schema en is idempotent: je mag het opnieuw
uitvoeren zonder data kwijt te raken.

### 3. Omgevingsvariabelen

```bash
cp .env.example .env.local
```

De project-URL en de sleutels haal je op via de knop **Connect** bovenaan het
dashboard, of compleet onder **Project Settings, API Keys**. Een aparte pagina
**Settings, API** bestaat niet meer, dus oudere handleidingen wijzen je verkeerd.

Een nieuw project laat alleen een publishable key (`sb_publishable_...`) en een
secret key (`sb_secret_...`) zien. De oudere `anon` en `service_role` staan
onder het tabblad **Legacy API Keys** en worden eind 2026 uitgefaseerd. De
variabelenamen in `.env.local` blijven hoe ze zijn: zet de publishable key in
`NEXT_PUBLIC_SUPABASE_ANON_KEY` en de secret key in
`SUPABASE_SERVICE_ROLE_KEY`. De clientlibrary werkt met beide soorten. Krijg je
bij accountbeheer onverwacht een 401, pak dan de legacy `service_role` key.

Let op dat `NEXT_PUBLIC_AUTH_EMAIL_DOMAIN` na het aanmaken van de eerste
accounts niet meer verandert; die waarde bepaalt hoe gebruikersnamen naar
auth-adressen worden afgebeeld, dus een wijziging sluit bestaande gebruikers
buiten.

### 4. Eerste beheerder

```bash
npm install
npm run create-admin
```

Het script vraagt om een gebruikersnaam, naam en wachtwoord. Daarna kun je
inloggen en via **Ledenlijst** de rest van het team toevoegen.

Stopt het script met foutcode `email_address_invalid`, dan weigert Supabase het
interne domein; de documentatie noemt dat "Example and test domains are
currently not supported". Zet `NEXT_PUBLIC_AUTH_EMAIL_DOMAIN` dan op een domein
dat echt bestaat, bijvoorbeeld een subdomein van je werkdomein
(`rooster.jouwbedrijf.nl`), en probeer het opnieuw. Er gaat nog steeds geen post
naartoe en het adres hoeft niet te bestaan: het domein moet alleen door de
validatie van Supabase komen. Doe dit voordat je collega's toevoegt, want zodra
er accounts zijn sluit een wijziging iedereen buiten.

### 5. Lokaal draaien

```bash
npm run dev
```

## Accounts beheren

Er is geen openbare registratie: wie de URL kent kan zichzelf geen account
aanmaken. Alles loopt via **Ledenlijst** in het adminmenu.

Bij een nieuw account mag je het wachtwoordveld leeglaten; dan genereert de app
een tijdelijk wachtwoord dat je eenmalig te zien krijgt en zelf doorgeeft. Omdat
de interne adressen niet bestaan, werkt "wachtwoord vergeten" per mail niet: je
zet als beheerder een nieuw wachtwoord via **Bewerken**.

Een account verwijderen haalt ook de diensten en beschikbaarheid van die
medewerker weg.

## Live zetten op Vercel

Koppel de repository aan Vercel en zet deze omgevingsvariabelen klaar voor
Production en Preview:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_AUTH_EMAIL_DOMAIN`
- `CRON_SECRET` (zelf te kiezen willekeurige waarde)

[vercel.json](vercel.json) laat Vercel Cron dagelijks `/api/keepalive`
aanroepen. Dat is geen overbodige luxe: Supabase pauzeert projecten op de
gratis tier na zeven dagen zonder databaseactiviteit, en je moet ze dan
handmatig hervatten. De dagelijkse aanroep voorkomt dat.

## Backups

De gratis tier heeft geen automatische backups en geen point-in-time recovery.
[.github/workflows/backup.yml](.github/workflows/backup.yml) maakt daarom elke
nacht een dump van het `public`-schema en bewaart die 90 dagen als GitHub
Actions artifact.

Zet daarvoor in de repository het secret `SUPABASE_DB_URL`. Die connection
string vind je achter de knop **Connect** bovenaan het dashboard. Kies de
**session pooler** op poort 5432 en vul je databasewachtwoord in. Dat is hier
geen willekeurige keuze: GitHub Actions draait op IPv4 en de directe verbinding
is op de gratis tier alleen via IPv6 bereikbaar, dus daarmee zou de backup
stilletjes blijven mislukken.

Een backup terugzetten:

```bash
psql "$SUPABASE_DB_URL" -f rooster-2026-09-11.sql
```

De dump bevat `drop`-statements, dus hij overschrijft de huidige inhoud van het
`public`-schema. De accounts zelf staan in `auth.users` en worden door Supabase
beheerd; die vallen buiten deze dump.

Blijf je hierop leunen, dan is Supabase Pro (ongeveer 25 dollar per maand) op
termijn de rustiger keuze: geen pauzes, dagelijkse backups en point-in-time
recovery. Het schema en de code hoeven daar niet voor te veranderen; je kunt dan
alleen de cron uit `vercel.json` halen.

## Projectstructuur

```
app/
  api/admin/users/    accountbeheer, gebruikt de service role key
  api/keepalive/      dagelijkse cron die de database wakker houdt
  admin/              adminpagina's: dashboard, leden, rooster, inplannen
  components/         UserProvider, headers, navigatie, service worker
  login/ welcome/     inloggen en landingspagina
  planning/ dashboard/ beschikbaarheid/
lib/
  auth.ts             gebruikersnaam naar auth-adres, validatie
  supabaseClient.ts   browserclient
  supabase/server.ts  serverclient plus getCurrentUser()
  supabase/admin.ts   service role client, alleen server-side
  supabase/apiAuth.ts requireAdmin() voor de API-routes
proxy.ts              sessie verversen en routes bewaken
supabase/schema.sql   volledig databaseschema met RLS
scripts/createAdmin.ts
```
