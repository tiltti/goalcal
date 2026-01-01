# 2026.tiltti.net - Tavoitekalenteri

Vuosikalenteri päivittäisten tavoitteiden seurantaan. Jokainen päivä on ympyrä, jonka väri kertoo kuinka moni tavoite täyttyi.

## Arkkitehtuuri

```
┌─────────────────────────────────────────────────────────────────┐
│                         KÄYTTÄJÄ                                │
│                    (selain / PWA)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLOUDFRONT CDN                             │
│                   (2026.tiltti.net)                             │
│              - SSL/TLS terminointi                              │
│              - Staattisten tiedostojen välimuisti               │
│              - Edge-sijainnit globaalisti                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AWS LAMBDA                                  │
│                  (Next.js SSR)                                  │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  /api/auth  │  │  /api/days  │  │ /api/admin  │             │
│  │  Kirjaudu   │  │  CRUD       │  │  Hallinta   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │/api/calendar│  │  SSR pages  │                              │
│  │  Asetukset  │  │  React 19   │                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DYNAMODB                                   │
│                 (Single-table design)                           │
│                                                                 │
│  PK: calendarId    SK: entryType                               │
│  ─────────────────────────────────────────────────────         │
│  "ossi"            "config"        → nimi, tavoitteet, värit   │
│  "ossi"            "day#2026-01-15" → päivän merkinnät         │
│  "anni"            "config"        → ...                        │
│  "anni"            "day#2026-01-15" → ...                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Teknologiat

| Komponentti | Teknologia | Tarkoitus |
|-------------|------------|-----------|
| Frontend | Next.js 16, React 19 | SSR + SPA |
| Tyylitys | Tailwind CSS 4 | Utility-first CSS |
| Tietokanta | DynamoDB | NoSQL, serverless |
| Infra | SST v3 | IaC, deployment |
| Hosting | AWS Lambda + CloudFront | Serverless |
| PWA | Service Worker | Offline, asennettava |

## Tiedostorakenne

```
goalcal/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Kirjautumissivu
│   │   ├── [calendarId]/       # Dynaaminen reitti /ossi, /anni
│   │   │   └── page.tsx
│   │   ├── admin/              # Admin-paneeli
│   │   │   └── page.tsx
│   │   └── api/                # API-reitit
│   │       ├── auth/route.ts   # POST kirjaudu, DELETE kirjaudu ulos
│   │       ├── days/route.ts   # GET päivät, POST tallenna
│   │       ├── calendar/route.ts # PUT asetukset
│   │       └── admin/route.ts  # GET/POST/PUT kalenterit
│   ├── components/
│   │   ├── YearCalendar.tsx    # Päänäkymä
│   │   ├── DayCircle.tsx       # Yksittäinen päivä
│   │   ├── DayModal.tsx        # Päivän muokkaus
│   │   ├── SettingsModal.tsx   # Käyttäjän asetukset
│   │   └── CompactCalendar.tsx # 1-365 näkymä
│   ├── lib/
│   │   ├── dynamodb.ts         # DynamoDB client
│   │   ├── auth.ts             # Session hallinta
│   │   └── types.ts            # TypeScript tyypit
│   └── types/
│       └── credentials.d.ts    # PasswordCredential tyyppi
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service Worker
│   └── icons/                  # PWA ikonit
├── sst.config.ts               # SST infrastruktuuri
├── .env.production.local       # Tuotannon salaisuudet (gitignore)
├── restart_servers.sh          # Lokaali kehitysympäristö
└── deploy_to_aws.sh            # Tuotanto-deploy
```

## DynamoDB Single-Table Design

Kaikki data yhdessä taulussa, partition key + sort key:

| calendarId (PK) | entryType (SK) | data |
|-----------------|----------------|------|
| `ossi` | `config` | `{name, password, goals, colorThreshold, year}` |
| `ossi` | `day#2026-01-15` | `{goals: {goal1: true, goal2: false}}` |
| `ossi` | `day#2026-01-16` | `{goals: {goal1: true, goal2: true}}` |
| `anni` | `config` | `{name, password, goals, colorThreshold, year}` |

**Miksi single-table?**
- Yksi Query hakee kaiken kalenterin datan
- Ei JOIN-operaatioita
- Skaalautuu ilmaiseksi (DynamoDB free tier: 25 GB, 25 WCU, 25 RCU)

## Sessiot ja autentikointi

```
1. Käyttäjä syöttää: kalenteri-id + salasana
2. API tarkistaa: bcrypt.compare(salasana, config.password)
3. Jos OK: Luo session cookie (signed, httpOnly)
4. Seuraavat pyynnöt: Cookie mukana → session validointi
```

Cookie allekirjoitetaan `SESSION_SECRET`:llä estäen väärentämisen.

## Värijärjestelmä

Jokaisen päivän väri määräytyy täytettyjen tavoitteiden mukaan:

| Täytetty % | Väri | Esimerkki (3 tavoitetta) |
|------------|------|--------------------------|
| ≥ greenMin | Vihreä | 3/3 tai 2/3 |
| ≥ yellowMin | Keltainen | 1/3 |
| < yellowMin | Punainen | 0/3 |

Käyttäjä voi säätää rajat asetuksista (esim. "vihreä vasta kun 100%").

## Kehitys

### Lokaali ympäristö

```bash
# Käynnistä DynamoDB Local + Next.js
./restart_servers.sh

# Avaa
http://localhost:3000        # Kirjautuminen
http://localhost:3000/admin  # Admin (salasana: admin123)
```

### Tuotanto-deploy

```bash
# Muokkaa salaisuudet
nano .env.production.local

# Deploy
./deploy_to_aws.sh production
```

## Ympäristömuuttujat

| Muuttuja | Kuvaus | Oletus |
|----------|--------|--------|
| `SESSION_SECRET` | Cookien allekirjoitusavain | - (pakollinen prod) |
| `ADMIN_PASSWORD` | Admin-paneelin salasana | admin123 |
| `DYNAMODB_TABLE` | Taulun nimi | goalcal |
| `DYNAMODB_ENDPOINT` | Lokaali endpoint | http://localhost:8000 |

## PWA-ominaisuudet

- Asennettavissa kotinäytölle (iOS/Android)
- Toimii offline-tilassa (välimuistitetut sivut)
- Päivittyy automaattisesti uuden version julkaisussa
- iOS safe area -tuki (notch, home indicator)
- Salasanan tallennus selaimen Credential Manageriin

## Kustannukset (AWS Free Tier)

| Palvelu | Free Tier | Arvio käytöstä |
|---------|-----------|----------------|
| Lambda | 1M pyyntöä/kk | ~1000 pyyntöä/kk |
| DynamoDB | 25 GB, 25 RCU/WCU | ~1 MB, <1 RCU/WCU |
| CloudFront | 1 TB/kk | ~100 MB/kk |
| **Yhteensä** | | **~0 €/kk** |

## Versiointi

Versio päivittyy automaattisesti git-commitissa (.githooks/pre-commit).
Näkyy sovelluksen alaosassa.
