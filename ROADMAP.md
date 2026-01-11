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

### Vaihe 5: Päiväkohtaiset muistiinpanot - VALMIS v0.3.1
Vapaamuotoinen teksti päivälle.

**Käyttötapaukset:**
- "Tänään oli hyvä päivä koska..."
- "Huomioita: ..."

**Toteutus:**
- [x] DayEntry-tyypille: `notes?`: string
- [x] Päivänäkymään tekstikenttä
- [x] Sininen piste kalenterissa päiville joilla on muistiinpano

### Vaihe 3: Aikasidonnaiset tavoitteet - VALMIS v0.4.0
Tavoitteet jotka ovat aktiivisia vain tietyllä aikavälillä.

**Käyttötapaukset:**
- "Laskettelu" vain tammi-maaliskuu
- "Uinti" vain kesä-elokuu
- "Projekti X" vain Q1

**Toteutus:**
- [x] Goal-tyypille lisäkentät: `startDate?`, `endDate?`
- [x] Päivänäkymä näyttää vain aktiiviset tavoitteet
- [x] Värilaskenta huomioi vain aktiiviset tavoitteet
- [x] Asetuksissa aikavälien hallinta

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

---

## Tietokantamuutokset

### Nykyinen tyypit (v0.4.0)
```typescript
interface Goal {
  id: string
  name: string
  startDate?: string // "2026-01-01"
  endDate?: string   // "2026-03-31"
}

interface DayEntry {
  calendarId: string
  date: string // "2026-01-15"
  goals: Record<string, boolean>
  trackables?: Record<string, boolean | number>
  notes?: string
  updatedAt: string
}
```

### Tuleva (v0.5+)
```typescript

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

1. ~~**Trackables** - Helpoin toteuttaa, heti hyödyllinen~~ VALMIS
2. ~~**Muistiinpanot** - Yksinkertainen lisäys~~ VALMIS
3. ~~**Aikasidonnaiset** - Vaatii UI-työtä asetuksiin~~ VALMIS
4. **Vuositavoitteet** - Vaatii uuden näkymän

---

## PWA-parannukset (myöhemmin)

- [ ] Service worker offline-tukeen
- [ ] manifest.json kotiruudulle lisäämiseen
- [ ] Push-notifikaatiot muistutuksiin
