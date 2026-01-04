# Goalcal Roadmap

## Valmis (v0.2.x)

### Mobiili-UI (v0.2.10-11)
- [x] BottomNav - alanavigointi (kalenteri/tilastot/asetukset)
- [x] DaySheet - slide-up merkintäruutu mobiililla
- [x] StatsView - täysinäyttötilastot mobiililla
- [x] SettingsView - täysinäyttöasetukset mobiililla
- [x] localStorage session backup - iOS Safari cookie-ongelma ratkaistu
- [x] Näkymävalitsin: "Näkymä: Kuukaudet | Vuosi"

### Aiemmat ominaisuudet
- [x] Dual streakit (merkinnät + vihreät)
- [x] Space Invaders kirjautumissivulla
- [x] Tilastomodaali (tavoitteet, viikonpäivät, streakit)
- [x] Confetti vihreiden päivien juhlintaan
- [x] Värirajat (vihreä/keltainen/punainen)

---

## Tulossa

### Vaihe 2: Trackables (seurattavat) - VALMIS v0.3.0
Asioita joita halutaan kirjata mutta jotka eivät vaikuta väreihin/pisteisiin.

**Käyttötapaukset:**
- "Kävin lenkillä" (ei tavoite, vain kirjaus)
- "Söin makeisia" (seuranta ilman moralisointia)
- "Kuinka monta tuntia nukuin" (numeerinen)

**Toteutus:**
- [x] Uusi tyyppi: `Trackable` (`id`, `name`, `type`: boolean | number)
- [x] Trackables näkyvät päivänäkymässä tavoitteiden alla
- [x] Trackables eivät vaikuta päivän väriin
- [ ] Tilastoissa oma osio trackablesille (myöhemmin)

### Vaihe 3: Aikasidonnaiset tavoitteet
Tavoitteet jotka ovat aktiivisia vain tietyllä aikavälillä.

**Käyttötapaukset:**
- "Laskettelu" vain tammi-maaliskuu
- "Uinti" vain kesä-elokuu
- "Projekti X" vain Q1

**Toteutus:**
- [ ] Goal-tyypille lisäkentät: `startDate?`, `endDate?`
- [ ] Päivänäkymä näyttää vain aktiiviset tavoitteet
- [ ] Värilaskenta huomioi vain aktiiviset tavoitteet
- [ ] Asetuksissa aikavälien hallinta

### Vaihe 4: Vuositavoitteet
Kertaluontoiset tavoitteet koko vuodelle (ei päivittäisiä).

**Käyttötapaukset:**
- "Lue 12 kirjaa"
- "Käy 5 maassa"
- "Suorita sertifikaatti"

**Toteutus:**
- [ ] Uusi tyyppi: `YearlyGoal` (`id`, `name`, `target?`: number, `completed`: boolean | number)
- [ ] Oma näkymä vuositavoitteille (ehkä stats-sivulle?)
- [ ] Edistymispalkki numeerisille tavoitteille

### Vaihe 5: Päiväkohtaiset muistiinpanot
Vapaamuotoinen teksti päivälle.

**Käyttötapaukset:**
- "Tänään oli hyvä päivä koska..."
- "Huomioita: ..."

**Toteutus:**
- [ ] DayEntry-tyypille: `notes?`: string
- [ ] Päivänäkymään tekstikenttä
- [ ] Pitkän tekstin näyttö kalenterissa (ikoni?)

---

## Tietokantamuutokset

### Nykyinen DayEntry
```typescript
interface DayEntry {
  calendarId: string
  date: string // "2026-01-15"
  goals: Record<string, boolean>
  updatedAt: string
}
```

### Tuleva DayEntry (v0.4+)
```typescript
interface DayEntry {
  calendarId: string
  date: string
  goals: Record<string, boolean>
  trackables?: Record<string, boolean | number>
  notes?: string
  updatedAt: string
}
```

### Tuleva CalendarConfig (v0.4+)
```typescript
interface Goal {
  id: string
  name: string
  startDate?: string // "2026-01-01"
  endDate?: string   // "2026-03-31"
}

interface Trackable {
  id: string
  name: string
  type: 'boolean' | 'number'
  unit?: string // "tuntia", "km", etc.
}

interface YearlyGoal {
  id: string
  name: string
  type: 'boolean' | 'count'
  target?: number // jos count-tyyppinen
  completed: boolean | number
}

interface CalendarConfig {
  calendarId: string
  name: string
  year: number
  goals: Goal[]
  trackables?: Trackable[]
  yearlyGoals?: YearlyGoal[]
  colorThreshold: ColorThreshold
}
```

---

## Prioriteetti

1. **Trackables** - Helpoin toteuttaa, heti hyödyllinen
2. **Muistiinpanot** - Yksinkertainen lisäys
3. **Aikasidonnaiset** - Vaatii UI-työtä asetuksiin
4. **Vuositavoitteet** - Vaatii uuden näkymän

---

## PWA-parannukset (myöhemmin)

- [ ] Service worker offline-tukeen
- [ ] manifest.json kotiruudulle lisäämiseen
- [ ] Push-notifikaatiot muistutuksiin
