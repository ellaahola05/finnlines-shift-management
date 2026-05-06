# Finnlines vuorohallinta — toteutussuunnitelma (demo)

> **Huom:** Tämä on demosovellus. Käytetään pelkkää HTML/CSS/JS:ää ja `localStorage`a. Ei oikeaa tietokantaa eikä kirjautumista. "Testaus" tehdään käsin selaimessa avaamalla `index.html`.

**Tavoite:** Selainpohjainen demo, joka osoittaa miten Finnlinesin asiakaspalvelun vuorot voi luoda automaattisesti ja jakaa työntekijöille omilla rooleilla.

**Arkkitehtuuri:** Yhden sivun sovellus (SPA), jossa JavaScript vaihtaa näkymiä DOM:issa. Data tallentuu selaimen `localStorage`en. Tiedostot jaettu vastuun mukaan: `data/` (alkudata), `js/` (logiikka), `css/` (tyylit).

**Tekniikkapino:** HTML5, CSS3, vanilla JavaScript (ei kirjastoja).

---

## Tiedostorakenne

```
finnlines-shift-management/
├── index.html              # ainoa HTML-sivu, sisältää kaikki näkymät
├── css/
│   └── style.css           # kaikki tyylit
├── js/
│   ├── app.js              # pääohjain — käynnistys, näkymien vaihto
│   ├── auth.js             # "kirjautuminen" (kuka on aktiivinen käyttäjä)
│   ├── storage.js          # localStorage-apurit (tallenna/lue)
│   ├── data.js             # alkudata: työntekijät, säännöt
│   ├── shifts.js           # vuorologiikka + automaattinen luonti
│   ├── leave.js            # lomapyynnöt + sairasilmoitukset
│   ├── exceptions.js       # poikkeuspäivät (laiva ei lähde)
│   └── views/
│       ├── login.js        # aloitusnäkymä
│       ├── manager.js      # esihenkilön näkymät
│       └── employee.js     # työntekijän näkymät
└── docs/
    └── superpowers/plans/
        └── 2026-04-22-vuorohallinta-demo.md
```

**Vastuut:**
- `index.html` — yksi tyhjä `<div id="app">`, johon JS piirtää sisällön
- `data.js` — vakiot: 15 työntekijää, vuorotyypit, säännöt
- `storage.js` — `save(key, value)` ja `load(key)` localStorage-kääreet
- `auth.js` — pitää muistissa kuka on kirjautunut, tarjoaa `getCurrentUser()`
- `shifts.js` — vuoron luonti, tallennus, automatiikka
- `app.js` — sitoo kaiken yhteen, kuuntelee URL-hashia näkymänvaihdolle

---

## Vaihe 1: Perusta + Aloitusnäkymä

**Tavoite:** Sivu avautuu, näkyy lista 15 työntekijästä, voi "kirjautua" klikkaamalla nimeä.

### Tehtävä 1.1: HTML-runko ja kansiorakenne

**Tiedostot:**
- Muokkaa: `index.html`
- Luo: `css/style.css`, `js/app.js`
- Poista: vanha `style.css` ja `script.js` juuresta

- [ ] **Vaihe 1: Luo kansiot**

```bash
cd /Users/ellaahola/Documents/finnlines-shift-management
mkdir -p css js/views
```

- [ ] **Vaihe 2: Siirrä vanhat tiedostot pois (tai poista)**

```bash
rm style.css script.js
```

- [ ] **Vaihe 3: Päivitä `index.html`**

```html
<!DOCTYPE html>
<html lang="fi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Finnlines vuorohallinta</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="app">Ladataan...</div>
    <script src="js/data.js"></script>
    <script src="js/storage.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/views/login.js"></script>
    <script src="js/views/manager.js"></script>
    <script src="js/views/employee.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Vaihe 4: Luo tyhjä `css/style.css`**

```css
/* Finnlines vuorohallinta - tyylit */
body {
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    margin: 0;
    padding: 20px;
    background: #f5f5f5;
}

#app {
    max-width: 1000px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

- [ ] **Vaihe 5: Luo `js/app.js` -tynkä**

```js
// Pääohjain — käynnistää sovelluksen
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('app').textContent = 'Sovellus käynnistyy...';
});
```

- [ ] **Vaihe 6: Testaa selaimessa**

Avaa `index.html` selaimessa. Pitäisi näkyä teksti "Sovellus käynnistyy...".

- [ ] **Vaihe 7: Commit**

```bash
git add -A
git commit -m "Vaihe 1.1: HTML-runko ja kansiorakenne"
```

---

### Tehtävä 1.2: Työntekijädata

**Tiedostot:**
- Luo: `js/data.js`

- [ ] **Vaihe 1: Luo `js/data.js` työntekijälistalla**

```js
// Alkudata — työntekijät, roolit, säännöt
const TYONTEKIJAT = [
    // Esihenkilö
    { id: 1, nimi: 'Esihenkilö Esimerkki', rooli: 'esihenkilo', tyyppi: 'vakituinen' },

    // Yksilömyynti — vakituiset (7)
    { id: 2, nimi: 'Anna Aalto', rooli: 'yksilomyynti', tyyppi: 'vakituinen' },
    { id: 3, nimi: 'Bertta Berg', rooli: 'yksilomyynti', tyyppi: 'vakituinen' },
    { id: 4, nimi: 'Cecilia Castrén', rooli: 'yksilomyynti', tyyppi: 'vakituinen' },
    { id: 5, nimi: 'Daniel Dahl', rooli: 'yksilomyynti', tyyppi: 'vakituinen' },
    { id: 6, nimi: 'Eeva Eriksson', rooli: 'yksilomyynti', tyyppi: 'vakituinen' },
    { id: 7, nimi: 'Fanny Forsman', rooli: 'yksilomyynti', tyyppi: 'vakituinen' },
    { id: 8, nimi: 'Gustav Granlund', rooli: 'yksilomyynti', tyyppi: 'vakituinen' },

    // Yksilömyynti — kesätyöntekijät (3)
    { id: 9, nimi: 'Helmi Heikkinen', rooli: 'yksilomyynti', tyyppi: 'kesatyontekija' },
    { id: 10, nimi: 'Iida Ihalainen', rooli: 'yksilomyynti', tyyppi: 'kesatyontekija' },
    { id: 11, nimi: 'Joonas Jokinen', rooli: 'yksilomyynti', tyyppi: 'kesatyontekija' },

    // Ryhmämyynti (4)
    { id: 12, nimi: 'Kaisa Kallio', rooli: 'ryhmamyynti', tyyppi: 'vakituinen' },
    { id: 13, nimi: 'Lauri Laine', rooli: 'ryhmamyynti', tyyppi: 'vakituinen' },
    { id: 14, nimi: 'Maria Manninen', rooli: 'ryhmamyynti', tyyppi: 'vakituinen' },
    { id: 15, nimi: 'Niko Niemi', rooli: 'ryhmamyynti', tyyppi: 'vakituinen' },
];

// Vuorotyypit
const VUOROTYYPIT = {
    yksilo_aamu: { alku: '09:00', loppu: '17:00', rooli: 'yksilomyynti' },
    yksilo_lyhyt: { alku: '09:00', loppu: '15:00', rooli: 'yksilomyynti' },
    yksilo_lahtoselvitys_arki: { alku: '12:00', loppu: '14:00', rooli: 'yksilomyynti' },
    yksilo_lahtoselvitys_vkl: { alku: '12:00', loppu: '15:00', rooli: 'yksilomyynti' },
    ryhma: { alku: '08:00', loppu: '16:00', rooli: 'ryhmamyynti' },
    esihenkilo: { alku: '09:00', loppu: '17:00', rooli: 'esihenkilo' },
};

// Säännöt
const SAANNOT = {
    maxPerakkaisetTyopaivat: 5,
    kesakuukaudet: [5, 6, 7, 8], // touko-elokuu
    kesaYksiloMin: 6,
    kesaYksiloMax: 8,
    kesaLahtoselvitysMin: 2,
    kesaLahtoselvitysMax: 3,
    talviYksiloMin: 3,
    talviYksiloMax: 5,
    talviLahtoselvitysMin: 1,
    talviLahtoselvitysMax: 2,
};
```

- [ ] **Vaihe 2: Testaa selaimessa**

Avaa selaimen kehittäjäkonsoli (F12). Konsolissa kirjoita: `TYONTEKIJAT.length` → vastauksen pitäisi olla `15`.

- [ ] **Vaihe 3: Commit**

```bash
git add js/data.js
git commit -m "Vaihe 1.2: Työntekijädata ja vuorotyypit"
```

---

### Tehtävä 1.3: localStorage-apurit

**Tiedostot:**
- Luo: `js/storage.js`

- [ ] **Vaihe 1: Luo `js/storage.js`**

```js
// localStorage-apurit. Kaikki data tallennetaan JSON-muodossa.
const Storage = {
    save(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    load(key, defaultValue = null) {
        const raw = localStorage.getItem(key);
        if (raw === null) return defaultValue;
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error('Virhe luettaessa localStoragea:', key, e);
            return defaultValue;
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    // Tyhjentää KAIKEN sovelluksen datan (kehitykseen)
    clearAll() {
        localStorage.clear();
    },
};
```

- [ ] **Vaihe 2: Testaa selaimessa konsolista**

```
Storage.save('testi', { nimi: 'Ella' })
Storage.load('testi')   // → { nimi: 'Ella' }
Storage.remove('testi')
Storage.load('testi')   // → null
```

- [ ] **Vaihe 3: Commit**

```bash
git add js/storage.js
git commit -m "Vaihe 1.3: localStorage-apurit"
```

---

### Tehtävä 1.4: Aloitusnäkymä (kirjautuminen)

**Tiedostot:**
- Luo: `js/auth.js`, `js/views/login.js`
- Muokkaa: `js/app.js`

- [ ] **Vaihe 1: Luo `js/auth.js`**

```js
// Pitää muistissa kuka on kirjautunut. localStorageen tallennettu user.id.
const Auth = {
    AVAIN: 'currentUserId',

    login(userId) {
        Storage.save(this.AVAIN, userId);
    },

    logout() {
        Storage.remove(this.AVAIN);
    },

    getCurrentUser() {
        const id = Storage.load(this.AVAIN);
        if (id === null) return null;
        return TYONTEKIJAT.find(t => t.id === id) || null;
    },
};
```

- [ ] **Vaihe 2: Luo `js/views/login.js`**

```js
// Aloitusnäkymä — lista työntekijöistä. Klikkaa nimeä = "kirjaudu".
const LoginView = {
    render(container) {
        const tyontekijatHtml = TYONTEKIJAT.map(t => `
            <li>
                <button data-id="${t.id}" class="login-btn">
                    ${t.nimi}
                    <span class="rooli">(${this.roolinNimi(t.rooli)})</span>
                </button>
            </li>
        `).join('');

        container.innerHTML = `
            <h1>Finnlines vuorohallinta</h1>
            <p>Valitse kuka olet:</p>
            <ul class="login-list">${tyontekijatHtml}</ul>
        `;

        container.querySelectorAll('.login-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id, 10);
                Auth.login(id);
                App.render();
            });
        });
    },

    roolinNimi(rooli) {
        const nimet = {
            esihenkilo: 'Esihenkilö',
            yksilomyynti: 'Yksilömyynti',
            ryhmamyynti: 'Ryhmämyynti',
        };
        return nimet[rooli] || rooli;
    },
};
```

- [ ] **Vaihe 3: Päivitä `js/app.js`**

```js
// Pääohjain
const App = {
    render() {
        const container = document.getElementById('app');
        const user = Auth.getCurrentUser();

        if (!user) {
            LoginView.render(container);
            return;
        }

        // Tilapäinen — vaiheessa 2 tehdään oikeat näkymät
        container.innerHTML = `
            <h1>Tervetuloa, ${user.nimi}!</h1>
            <p>Roolisi: ${user.rooli}</p>
            <button id="logout">Kirjaudu ulos</button>
        `;
        document.getElementById('logout').addEventListener('click', () => {
            Auth.logout();
            App.render();
        });
    },
};

document.addEventListener('DOMContentLoaded', () => App.render());
```

- [ ] **Vaihe 4: Lisää tyylit `css/style.css`hin**

```css
.login-list {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 8px;
}

.login-btn {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    text-align: left;
    font-size: 14px;
}

.login-btn:hover {
    background: #e8f0fe;
    border-color: #4285f4;
}

.rooli {
    color: #666;
    font-size: 12px;
    display: block;
}
```

- [ ] **Vaihe 5: Testaa selaimessa**

Avaa `index.html`. Pitäisi näkyä lista 15 nimestä. Klikkaa yhtä → näkyy "Tervetuloa, [nimi]!" ja "Kirjaudu ulos" -nappi. Klikkaa "Kirjaudu ulos" → palaa listaan.

- [ ] **Vaihe 6: Commit**

```bash
git add -A
git commit -m "Vaihe 1.4: Aloitusnäkymä ja kirjautuminen"
```

---

## Vaihe 2: Vuorokalenteri (näyttää vuorot)

**Tavoite:** Jokainen rooli näkee oman näkymänsä. Esihenkilö näkee kaikki vuorot kalenterissa, työntekijä näkee omansa. Vuorot voi syöttää käsin (automatiikka tehdään vaiheessa 3).

### Tehtävä 2.1: Vuoromalli ja tallennus

**Tiedostot:**
- Luo: `js/shifts.js`
- Muokkaa: `index.html` (lisää `<script src="js/shifts.js"></script>`)

- [ ] **Vaihe 1: Lisää scripti `index.html`iin**

Lisää `data.js`:n jälkeen:
```html
<script src="js/shifts.js"></script>
```

- [ ] **Vaihe 2: Luo `js/shifts.js`**

```js
// Vuorologiikka. Vuoro = { id, paiva: 'YYYY-MM-DD', tyontekijaId, vuorotyyppi }
const Shifts = {
    AVAIN: 'shifts',

    kaikki() {
        return Storage.load(this.AVAIN, []);
    },

    tallenna(vuorot) {
        Storage.save(this.AVAIN, vuorot);
    },

    lisaa(paiva, tyontekijaId, vuorotyyppi) {
        const vuorot = this.kaikki();
        const uusi = {
            id: Date.now() + Math.random(),
            paiva,
            tyontekijaId,
            vuorotyyppi,
        };
        vuorot.push(uusi);
        this.tallenna(vuorot);
        return uusi;
    },

    poista(id) {
        const vuorot = this.kaikki().filter(v => v.id !== id);
        this.tallenna(vuorot);
    },

    paivalle(paiva) {
        return this.kaikki().filter(v => v.paiva === paiva);
    },

    tyontekijalle(tyontekijaId) {
        return this.kaikki().filter(v => v.tyontekijaId === tyontekijaId);
    },
};
```

- [ ] **Vaihe 3: Testaa konsolissa**

```
Shifts.lisaa('2026-04-22', 2, 'yksilo_aamu')
Shifts.kaikki()       // → [{ id:..., paiva:'2026-04-22', ...}]
Shifts.paivalle('2026-04-22')   // → sama lista
```

- [ ] **Vaihe 4: Commit**

```bash
git add -A
git commit -m "Vaihe 2.1: Vuoromalli ja tallennus"
```

---

### Tehtävä 2.2: Esihenkilön kalenterinäkymä

**Tiedostot:**
- Luo: `js/views/manager.js`
- Muokkaa: `js/app.js`

- [ ] **Vaihe 1: Luo `js/views/manager.js`**

```js
// Esihenkilön päänäkymä — viikkokalenteri
const ManagerView = {
    nykyinenAlkuPaiva: null, // maanantain päivämäärä

    render(container) {
        if (!this.nykyinenAlkuPaiva) {
            this.nykyinenAlkuPaiva = this.viikonAlku(new Date());
        }

        const paivat = this.viikonPaivat(this.nykyinenAlkuPaiva);
        const paivaSarakkeet = paivat.map(p => this.paivaSarakeHtml(p)).join('');

        container.innerHTML = `
            <header class="topbar">
                <h1>Esihenkilön näkymä</h1>
                <button id="logout">Kirjaudu ulos</button>
            </header>
            <div class="viikko-nav">
                <button id="edellinen">← Edellinen viikko</button>
                <strong>${this.viikonOtsikko(paivat)}</strong>
                <button id="seuraava">Seuraava viikko →</button>
            </div>
            <div class="viikko-grid">
                ${paivaSarakkeet}
            </div>
        `;

        document.getElementById('logout').addEventListener('click', () => {
            Auth.logout();
            App.render();
        });
        document.getElementById('edellinen').addEventListener('click', () => {
            this.nykyinenAlkuPaiva = this.lisaaPaivia(this.nykyinenAlkuPaiva, -7);
            this.render(container);
        });
        document.getElementById('seuraava').addEventListener('click', () => {
            this.nykyinenAlkuPaiva = this.lisaaPaivia(this.nykyinenAlkuPaiva, 7);
            this.render(container);
        });
    },

    paivaSarakeHtml(paivaIso) {
        const vuorot = Shifts.paivalle(paivaIso);
        const vuoroHtml = vuorot.map(v => {
            const tyontekija = TYONTEKIJAT.find(t => t.id === v.tyontekijaId);
            const tyyppi = VUOROTYYPIT[v.vuorotyyppi];
            return `<li>${tyontekija?.nimi || '?'} <small>${tyyppi.alku}–${tyyppi.loppu}</small></li>`;
        }).join('');

        const pvm = new Date(paivaIso);
        const viikonpaiva = ['Su','Ma','Ti','Ke','To','Pe','La'][pvm.getDay()];
        return `
            <div class="paiva-sarake">
                <h3>${viikonpaiva} ${pvm.getDate()}.${pvm.getMonth()+1}.</h3>
                <ul>${vuoroHtml || '<li class="tyhja">Ei vuoroja</li>'}</ul>
            </div>
        `;
    },

    viikonAlku(paiva) {
        const d = new Date(paiva);
        const ero = (d.getDay() + 6) % 7; // ma=0
        d.setDate(d.getDate() - ero);
        return this.iso(d);
    },

    viikonPaivat(alku) {
        const tulokset = [];
        for (let i = 0; i < 7; i++) {
            tulokset.push(this.lisaaPaivia(alku, i));
        }
        return tulokset;
    },

    lisaaPaivia(iso, n) {
        const d = new Date(iso);
        d.setDate(d.getDate() + n);
        return this.iso(d);
    },

    iso(d) {
        const v = d.getFullYear();
        const k = String(d.getMonth() + 1).padStart(2, '0');
        const p = String(d.getDate()).padStart(2, '0');
        return `${v}-${k}-${p}`;
    },

    viikonOtsikko(paivat) {
        const a = new Date(paivat[0]);
        const l = new Date(paivat[6]);
        return `${a.getDate()}.${a.getMonth()+1}. – ${l.getDate()}.${l.getMonth()+1}.${l.getFullYear()}`;
    },
};
```

- [ ] **Vaihe 2: Päivitä `js/app.js`**

```js
const App = {
    render() {
        const container = document.getElementById('app');
        const user = Auth.getCurrentUser();

        if (!user) {
            LoginView.render(container);
            return;
        }

        if (user.rooli === 'esihenkilo') {
            ManagerView.render(container);
        } else {
            EmployeeView.render(container);
        }
    },
};

document.addEventListener('DOMContentLoaded', () => App.render());
```

- [ ] **Vaihe 3: Lisää tyylit `css/style.css`hin**

```css
.topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.viikko-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 16px 0;
}

.viikko-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
}

.paiva-sarake {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px;
    min-height: 150px;
}

.paiva-sarake h3 {
    margin: 0 0 8px 0;
    font-size: 13px;
    color: #555;
}

.paiva-sarake ul {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 12px;
}

.paiva-sarake li {
    padding: 4px;
    background: #e8f0fe;
    margin-bottom: 2px;
    border-radius: 2px;
}

.paiva-sarake li.tyhja {
    background: none;
    color: #999;
    font-style: italic;
}
```

- [ ] **Vaihe 4: Testaa selaimessa**

Kirjaudu esihenkilönä (id 1). Näkyy viikkokalenteri jossa 7 saraketta. Edellinen/seuraava viikko -napit toimivat. Lisää konsolista `Shifts.lisaa('2026-04-22', 2, 'yksilo_aamu')` ja päivitä → vuoro pitäisi näkyä oikeassa sarakkeessa.

- [ ] **Vaihe 5: Commit**

```bash
git add -A
git commit -m "Vaihe 2.2: Esihenkilön viikkokalenterinäkymä"
```

---

### Tehtävä 2.3: Työntekijän omat vuorot -näkymä

**Tiedostot:**
- Luo: `js/views/employee.js`

- [ ] **Vaihe 1: Luo `js/views/employee.js`**

```js
// Työntekijän näkymä — omat vuorot listana
const EmployeeView = {
    render(container) {
        const user = Auth.getCurrentUser();
        const omatVuorot = Shifts.tyontekijalle(user.id)
            .sort((a, b) => a.paiva.localeCompare(b.paiva));

        const vuoroHtml = omatVuorot.length
            ? omatVuorot.map(v => {
                const t = VUOROTYYPIT[v.vuorotyyppi];
                return `<li><strong>${this.muotoilePvm(v.paiva)}</strong> — ${t.alku}–${t.loppu}</li>`;
            }).join('')
            : '<li class="tyhja">Ei tulevia vuoroja.</li>';

        container.innerHTML = `
            <header class="topbar">
                <h1>Hei, ${user.nimi}!</h1>
                <button id="logout">Kirjaudu ulos</button>
            </header>
            <h2>Omat vuorot</h2>
            <ul class="vuorolista">${vuoroHtml}</ul>
        `;

        document.getElementById('logout').addEventListener('click', () => {
            Auth.logout();
            App.render();
        });
    },

    muotoilePvm(iso) {
        const d = new Date(iso);
        const viikonpaivat = ['su','ma','ti','ke','to','pe','la'];
        return `${viikonpaivat[d.getDay()]} ${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`;
    },
};
```

- [ ] **Vaihe 2: Lisää tyylit**

```css
.vuorolista {
    list-style: none;
    padding: 0;
}

.vuorolista li {
    padding: 12px;
    border-bottom: 1px solid #eee;
}
```

- [ ] **Vaihe 3: Testaa**

Kirjaudu työntekijänä (esim. id 2). Pitäisi näkyä "Omat vuorot" -lista. Lisää konsolista `Shifts.lisaa('2026-04-22', 2, 'yksilo_aamu')`, päivitä → vuoro näkyy.

- [ ] **Vaihe 4: Commit**

```bash
git add -A
git commit -m "Vaihe 2.3: Työntekijän oma näkymä"
```

---

## Vaihe 3: Automaattinen vuorojen luonti

**Tavoite:** Esihenkilö valitsee viikon ja painaa nappia → ohjelma luo vuorot sääntöjen mukaan.

### Tehtävä 3.1: Vuorojen luontilogiikka

**Tiedostot:**
- Muokkaa: `js/shifts.js`

- [ ] **Vaihe 1: Lisää `Shifts`-objektiin `luoViikko`-metodi**

Lisää `Shifts`-objektin loppuun (ennen sulkevaa aaltosulkua):

```js
    // --- AUTOMAATTINEN LUONTI ---

    luoViikko(viikonAlkuIso, poikkeuspaivat = []) {
        const paivat = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(viikonAlkuIso);
            d.setDate(d.getDate() + i);
            const v = d.getFullYear();
            const k = String(d.getMonth()+1).padStart(2,'0');
            const p = String(d.getDate()).padStart(2,'0');
            paivat.push(`${v}-${k}-${p}`);
        }

        // Poista vanhat vuorot näiltä päiviltä ennen uusien luontia
        const ilman = this.kaikki().filter(v => !paivat.includes(v.paiva));
        this.tallenna(ilman);

        for (const paiva of paivat) {
            this.luoPaivanVuorot(paiva, poikkeuspaivat);
        }
    },

    luoPaivanVuorot(paivaIso, poikkeuspaivat) {
        const d = new Date(paivaIso);
        const viikonpaiva = d.getDay(); // 0=su, 6=la
        const onViikonloppu = (viikonpaiva === 0 || viikonpaiva === 6);
        const onPoikkeuspaiva = poikkeuspaivat.includes(paivaIso);

        // Pyhinä ja poikkeuspäivinä ei vuoroja
        if (onPoikkeuspaiva) return;

        // Viikonloppuna vain lähtöselvitys (jos laiva lähtee)
        if (onViikonloppu) {
            this.luoLahtoselvitysVuorot(paivaIso, true);
            return;
        }

        // Arkipäivänä:
        // 1. Esihenkilö
        this.lisaa(paivaIso, 1, 'esihenkilo');

        // 2. Ryhmämyynti — kaikki paikalla aina arkisin
        const ryhma = TYONTEKIJAT.filter(t => t.rooli === 'ryhmamyynti');
        ryhma.forEach(t => this.lisaa(paivaIso, t.id, 'ryhma'));

        // 3. Yksilömyynti — sesonkiriippuvainen määrä
        this.luoYksiloVuorot(paivaIso);

        // 4. Lähtöselvitys arkisin
        this.luoLahtoselvitysVuorot(paivaIso, false);
    },

    luoYksiloVuorot(paivaIso) {
        const kk = parseInt(paivaIso.substring(5,7), 10);
        const onKesa = SAANNOT.kesakuukaudet.includes(kk);
        const tarvitaan = onKesa ? SAANNOT.kesaYksiloMin : SAANNOT.talviYksiloMin;

        // Valitse satunnaisesti yksilömyynnin työntekijöitä, joilla vähiten vuoroja tällä viikolla
        const ehdokkaat = TYONTEKIJAT
            .filter(t => t.rooli === 'yksilomyynti')
            // Talvella vain vakituiset
            .filter(t => onKesa || t.tyyppi === 'vakituinen');

        const valitut = this.valitseTasapuolisesti(ehdokkaat, tarvitaan, paivaIso);
        valitut.forEach(t => this.lisaa(paivaIso, t.id, 'yksilo_aamu'));
    },

    luoLahtoselvitysVuorot(paivaIso, onViikonloppu) {
        const kk = parseInt(paivaIso.substring(5,7), 10);
        const onKesa = SAANNOT.kesakuukaudet.includes(kk);
        const tarvitaan = onKesa ? SAANNOT.kesaLahtoselvitysMin : SAANNOT.talviLahtoselvitysMin;

        const ehdokkaat = TYONTEKIJAT
            .filter(t => t.rooli === 'yksilomyynti')
            .filter(t => onKesa || t.tyyppi === 'vakituinen');

        const valitut = this.valitseTasapuolisesti(ehdokkaat, tarvitaan, paivaIso);
        const tyyppi = onViikonloppu ? 'yksilo_lahtoselvitys_vkl' : 'yksilo_lahtoselvitys_arki';
        valitut.forEach(t => this.lisaa(paivaIso, t.id, tyyppi));
    },

    valitseTasapuolisesti(ehdokkaat, maara, paivaIso) {
        // Älä valitse työntekijää, joka on jo paikalla tänä päivänä
        const tanaan = this.paivalle(paivaIso).map(v => v.tyontekijaId);
        const vapaat = ehdokkaat.filter(t => !tanaan.includes(t.id));

        // Älä valitse, jos olisi 6+ peräkkäistä työpäivää
        const sopivat = vapaat.filter(t => !this.olisiLiikaaPerakkain(t.id, paivaIso));

        // Järjestä vuoromäärän mukaan (vähiten ensin) → tasapuolinen jako
        const jarjestetyt = sopivat.sort((a, b) => {
            return this.tyontekijalle(a.id).length - this.tyontekijalle(b.id).length;
        });

        return jarjestetyt.slice(0, maara);
    },

    olisiLiikaaPerakkain(tyontekijaId, paivaIso) {
        // Lasketaan montako peräkkäistä työpäivää tulisi jos lisätään tämä päivä
        const omat = this.tyontekijalle(tyontekijaId).map(v => v.paiva);
        const setti = new Set([...omat, paivaIso]);

        const d = new Date(paivaIso);
        let perakkain = 1;

        // Taaksepäin
        for (let i = 1; i <= SAANNOT.maxPerakkaisetTyopaivat; i++) {
            const edellinen = new Date(d);
            edellinen.setDate(d.getDate() - i);
            const iso = this.toIso(edellinen);
            if (setti.has(iso)) perakkain++;
            else break;
        }

        // Eteenpäin
        for (let i = 1; i <= SAANNOT.maxPerakkaisetTyopaivat; i++) {
            const seuraava = new Date(d);
            seuraava.setDate(d.getDate() + i);
            const iso = this.toIso(seuraava);
            if (setti.has(iso)) perakkain++;
            else break;
        }

        return perakkain > SAANNOT.maxPerakkaisetTyopaivat;
    },

    toIso(d) {
        const v = d.getFullYear();
        const k = String(d.getMonth()+1).padStart(2,'0');
        const p = String(d.getDate()).padStart(2,'0');
        return `${v}-${k}-${p}`;
    },
```

- [ ] **Vaihe 2: Testaa konsolissa**

```js
Storage.clearAll()
Shifts.luoViikko('2026-04-20')   // ma 20.4.2026
Shifts.kaikki().length            // > 0
Shifts.paivalle('2026-04-20')     // pitäisi sisältää esihenkilö, 4 ryhmämyyntiä, 3+ yksilömyyntiä
```

- [ ] **Vaihe 3: Commit**

```bash
git add js/shifts.js
git commit -m "Vaihe 3.1: Automaattinen vuorojen luontilogiikka"
```

---

### Tehtävä 3.2: "Luo vuorot" -nappi esihenkilön näkymään

**Tiedostot:**
- Muokkaa: `js/views/manager.js`

- [ ] **Vaihe 1: Lisää nappi `ManagerView.render`-metodiin**

Korvaa `viikko-nav`-osio:

```js
            <div class="viikko-nav">
                <button id="edellinen">← Edellinen viikko</button>
                <strong>${this.viikonOtsikko(paivat)}</strong>
                <button id="seuraava">Seuraava viikko →</button>
                <button id="luo-vuorot" class="ensisijainen">🪄 Luo vuorot</button>
            </div>
```

Lisää tapahtumakuuntelija muiden joukkoon:

```js
        document.getElementById('luo-vuorot').addEventListener('click', () => {
            if (confirm('Luodaanko vuorot viikolle? Olemassa olevat vuorot tältä viikolta korvataan.')) {
                Shifts.luoViikko(this.nykyinenAlkuPaiva);
                this.render(container);
            }
        });
```

- [ ] **Vaihe 2: Lisää tyyli ensisijaiselle napille**

```css
.ensisijainen {
    background: #4285f4;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
}

.ensisijainen:hover {
    background: #3367d6;
}
```

- [ ] **Vaihe 3: Testaa**

Avaa esihenkilön näkymä. Klikkaa "🪄 Luo vuorot" → vahvistus → vuorot ilmestyvät kalenteriin.

- [ ] **Vaihe 4: Commit**

```bash
git add -A
git commit -m "Vaihe 3.2: Luo vuorot -nappi esihenkilön näkymään"
```

---

## Vaihe 4: Lomapyynnöt ja sairasilmoitukset

**Tavoite:** Työntekijä voi pyytää lomaa ja merkitä sairaspäivän. Esihenkilö hyväksyy/hylkää.

### Tehtävä 4.1: Loma-tiedon malli ja tallennus

**Tiedostot:**
- Luo: `js/leave.js`
- Muokkaa: `index.html`

- [ ] **Vaihe 1: Lisää scripti `index.html`iin**

Lisää `shifts.js`:n jälkeen:
```html
<script src="js/leave.js"></script>
```

- [ ] **Vaihe 2: Luo `js/leave.js`**

```js
// Loma- ja sairaspoissaolot.
// Lomapyyntö: { id, tyyppi: 'loma'|'sairas', tyontekijaId, alku, loppu, tila: 'odottaa'|'hyvaksytty'|'hylatty', luotu }
const Leave = {
    AVAIN: 'leaves',

    kaikki() {
        return Storage.load(this.AVAIN, []);
    },

    tallenna(rivit) {
        Storage.save(this.AVAIN, rivit);
    },

    pyyda(tyontekijaId, alku, loppu) {
        const rivit = this.kaikki();
        const uusi = {
            id: Date.now(),
            tyyppi: 'loma',
            tyontekijaId,
            alku,
            loppu,
            tila: 'odottaa',
            luotu: new Date().toISOString(),
        };
        rivit.push(uusi);
        this.tallenna(rivit);
        return uusi;
    },

    sairasilmoitus(tyontekijaId, paiva) {
        const rivit = this.kaikki();
        const uusi = {
            id: Date.now(),
            tyyppi: 'sairas',
            tyontekijaId,
            alku: paiva,
            loppu: paiva,
            tila: 'hyvaksytty', // sairas hyväksytään automaattisesti
            luotu: new Date().toISOString(),
        };
        rivit.push(uusi);
        this.tallenna(rivit);
        return uusi;
    },

    paivita(id, tila) {
        const rivit = this.kaikki().map(r => r.id === id ? { ...r, tila } : r);
        this.tallenna(rivit);
    },

    odottavat() {
        return this.kaikki().filter(r => r.tila === 'odottaa');
    },

    tyontekijalle(tyontekijaId) {
        return this.kaikki().filter(r => r.tyontekijaId === tyontekijaId);
    },

    onkoVapaalla(tyontekijaId, paivaIso) {
        return this.kaikki().some(r =>
            r.tyontekijaId === tyontekijaId &&
            r.tila === 'hyvaksytty' &&
            r.alku <= paivaIso && paivaIso <= r.loppu
        );
    },
};
```

- [ ] **Vaihe 3: Testaa konsolissa**

```js
Leave.pyyda(2, '2026-06-01', '2026-06-07')
Leave.odottavat().length    // 1
Leave.paivita(Leave.odottavat()[0].id, 'hyvaksytty')
Leave.onkoVapaalla(2, '2026-06-03')   // true
```

- [ ] **Vaihe 4: Commit**

```bash
git add -A
git commit -m "Vaihe 4.1: Loma- ja sairauspoissaolojen malli"
```

---

### Tehtävä 4.2: Työntekijän loma- ja sairas-painikkeet

**Tiedostot:**
- Muokkaa: `js/views/employee.js`

- [ ] **Vaihe 1: Lisää lomalomake ja sairasnappi `EmployeeView.render`iin**

Korvaa `EmployeeView.render`:

```js
    render(container) {
        const user = Auth.getCurrentUser();
        const omatVuorot = Shifts.tyontekijalle(user.id)
            .sort((a, b) => a.paiva.localeCompare(b.paiva));
        const omatLomat = Leave.tyontekijalle(user.id)
            .sort((a, b) => b.luotu.localeCompare(a.luotu));

        const vuoroHtml = omatVuorot.length
            ? omatVuorot.map(v => {
                const t = VUOROTYYPIT[v.vuorotyyppi];
                return `<li><strong>${this.muotoilePvm(v.paiva)}</strong> — ${t.alku}–${t.loppu}</li>`;
            }).join('')
            : '<li class="tyhja">Ei tulevia vuoroja.</li>';

        const lomaHtml = omatLomat.length
            ? omatLomat.map(l => `
                <li>
                    <strong>${l.tyyppi === 'loma' ? 'Loma' : 'Sairas'}</strong>
                    ${this.muotoilePvm(l.alku)}${l.alku !== l.loppu ? ' – ' + this.muotoilePvm(l.loppu) : ''}
                    <span class="tila tila-${l.tila}">${this.tilanNimi(l.tila)}</span>
                </li>
            `).join('')
            : '<li class="tyhja">Ei pyyntöjä.</li>';

        container.innerHTML = `
            <header class="topbar">
                <h1>Hei, ${user.nimi}!</h1>
                <button id="logout">Kirjaudu ulos</button>
            </header>

            <h2>Omat vuorot</h2>
            <ul class="vuorolista">${vuoroHtml}</ul>

            <h2>Pyydä lomaa</h2>
            <form id="loma-lomake" class="loma-lomake">
                <label>Alkupäivä: <input type="date" id="loma-alku" required></label>
                <label>Loppupäivä: <input type="date" id="loma-loppu" required></label>
                <button type="submit" class="ensisijainen">Lähetä pyyntö</button>
            </form>

            <h2>Sairasilmoitus</h2>
            <button id="sairas-nappi">Olen sairaana tänään</button>

            <h2>Omat pyynnöt</h2>
            <ul class="lomalista">${lomaHtml}</ul>
        `;

        document.getElementById('logout').addEventListener('click', () => {
            Auth.logout();
            App.render();
        });

        document.getElementById('loma-lomake').addEventListener('submit', (e) => {
            e.preventDefault();
            const alku = document.getElementById('loma-alku').value;
            const loppu = document.getElementById('loma-loppu').value;
            if (alku > loppu) { alert('Alkupäivä ei voi olla loppupäivän jälkeen.'); return; }
            Leave.pyyda(user.id, alku, loppu);
            this.render(container);
        });

        document.getElementById('sairas-nappi').addEventListener('click', () => {
            const tanaan = new Date().toISOString().substring(0, 10);
            Leave.sairasilmoitus(user.id, tanaan);
            alert('Sairasilmoitus tallennettu. Esihenkilö saa tiedon.');
            this.render(container);
        });
    },

    tilanNimi(tila) {
        return { odottaa: 'Odottaa', hyvaksytty: 'Hyväksytty', hylatty: 'Hylätty' }[tila] || tila;
    },
```

- [ ] **Vaihe 2: Lisää tyylit**

```css
.loma-lomake {
    display: flex;
    gap: 12px;
    align-items: end;
    margin-bottom: 16px;
}

.loma-lomake label {
    display: flex;
    flex-direction: column;
    font-size: 13px;
}

.lomalista {
    list-style: none;
    padding: 0;
}

.lomalista li {
    padding: 12px;
    border-bottom: 1px solid #eee;
}

.tila {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    margin-left: 8px;
}

.tila-odottaa { background: #fff4e0; color: #b86200; }
.tila-hyvaksytty { background: #e0f4e0; color: #0a6b0a; }
.tila-hylatty { background: #ffe0e0; color: #a30000; }
```

- [ ] **Vaihe 3: Testaa**

Kirjaudu työntekijänä. Pyydä lomaa → näkyy listassa "Odottaa". Klikkaa sairasnappi → näkyy "Hyväksytty".

- [ ] **Vaihe 4: Commit**

```bash
git add -A
git commit -m "Vaihe 4.2: Työntekijän loma- ja sairas-näkymä"
```

---

### Tehtävä 4.3: Esihenkilön lomapyyntöjen hallinta

**Tiedostot:**
- Muokkaa: `js/views/manager.js`

- [ ] **Vaihe 1: Lisää näkymänvaihtaja ja lomanäkymä `ManagerView`hin**

Lisää `ManagerView`-objektin alkuun:

```js
    nykyinenNakyma: 'kalenteri', // 'kalenteri' | 'lomat'
```

Korvaa `render`-metodin alku (ennen `if (!this.nykyinenAlkuPaiva)`-riviä):

```js
    render(container) {
        const odottavienMaara = Leave.odottavat().length;

        if (this.nykyinenNakyma === 'lomat') {
            this.renderLomat(container);
            return;
        }
```

Korvaa `topbar`-osio `render`-metodissa:

```js
            <header class="topbar">
                <h1>Esihenkilön näkymä</h1>
                <nav>
                    <button id="nakyma-kalenteri" class="ensisijainen">Kalenteri</button>
                    <button id="nakyma-lomat">Lomapyynnöt ${odottavienMaara > 0 ? `(${odottavienMaara})` : ''}</button>
                    <button id="logout">Kirjaudu ulos</button>
                </nav>
            </header>
```

Lisää tapahtumakuuntelijat (`logout`in alle):

```js
        document.getElementById('nakyma-lomat').addEventListener('click', () => {
            this.nykyinenNakyma = 'lomat';
            this.render(container);
        });
        document.getElementById('nakyma-kalenteri').addEventListener('click', () => {
            this.nykyinenNakyma = 'kalenteri';
            this.render(container);
        });
```

Lisää uusi metodi `ManagerView`hin (esim. `render`-metodin jälkeen):

```js
    renderLomat(container) {
        const odottavat = Leave.odottavat();
        const kaikki = Leave.kaikki().sort((a,b) => b.luotu.localeCompare(a.luotu));

        const odottavatHtml = odottavat.length
            ? odottavat.map(l => {
                const t = TYONTEKIJAT.find(x => x.id === l.tyontekijaId);
                return `
                    <li>
                        <strong>${t?.nimi || '?'}</strong>
                        ${this.muotoilePvm(l.alku)}${l.alku !== l.loppu ? ' – ' + this.muotoilePvm(l.loppu) : ''}
                        <button data-id="${l.id}" class="hyvaksy">Hyväksy</button>
                        <button data-id="${l.id}" class="hylkaa">Hylkää</button>
                    </li>
                `;
            }).join('')
            : '<li class="tyhja">Ei odottavia pyyntöjä.</li>';

        const kaikkiHtml = kaikki.map(l => {
            const t = TYONTEKIJAT.find(x => x.id === l.tyontekijaId);
            return `
                <li>
                    <strong>${t?.nimi || '?'}</strong>
                    (${l.tyyppi === 'loma' ? 'loma' : 'sairas'})
                    ${this.muotoilePvm(l.alku)}${l.alku !== l.loppu ? ' – ' + this.muotoilePvm(l.loppu) : ''}
                    <span class="tila tila-${l.tila}">${EmployeeView.tilanNimi(l.tila)}</span>
                </li>
            `;
        }).join('');

        container.innerHTML = `
            <header class="topbar">
                <h1>Lomapyynnöt</h1>
                <nav>
                    <button id="nakyma-kalenteri">Kalenteri</button>
                    <button id="nakyma-lomat" class="ensisijainen">Lomapyynnöt</button>
                    <button id="logout">Kirjaudu ulos</button>
                </nav>
            </header>

            <h2>Odottavat pyynnöt</h2>
            <ul class="lomalista">${odottavatHtml}</ul>

            <h2>Kaikki pyynnöt ja sairauspoissaolot</h2>
            <ul class="lomalista">${kaikkiHtml || '<li class="tyhja">Ei tietoja.</li>'}</ul>
        `;

        document.getElementById('logout').addEventListener('click', () => {
            Auth.logout();
            App.render();
        });
        document.getElementById('nakyma-kalenteri').addEventListener('click', () => {
            this.nykyinenNakyma = 'kalenteri';
            this.render(container);
        });
        document.getElementById('nakyma-lomat').addEventListener('click', () => {
            this.nykyinenNakyma = 'lomat';
            this.render(container);
        });

        container.querySelectorAll('.hyvaksy').forEach(btn => {
            btn.addEventListener('click', () => {
                Leave.paivita(parseInt(btn.dataset.id, 10), 'hyvaksytty');
                this.render(container);
            });
        });
        container.querySelectorAll('.hylkaa').forEach(btn => {
            btn.addEventListener('click', () => {
                Leave.paivita(parseInt(btn.dataset.id, 10), 'hylatty');
                this.render(container);
            });
        });
    },

    muotoilePvm(iso) {
        const d = new Date(iso);
        return `${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`;
    },
```

- [ ] **Vaihe 2: Päivitä `Shifts.valitseTasapuolisesti` ottamaan lomat huomioon**

Muokkaa `js/shifts.js`:n `valitseTasapuolisesti`-metodia. Korvaa rivi:

```js
        const vapaat = ehdokkaat.filter(t => !tanaan.includes(t.id));
```

→

```js
        const vapaat = ehdokkaat.filter(t =>
            !tanaan.includes(t.id) && !Leave.onkoVapaalla(t.id, paivaIso)
        );
```

- [ ] **Vaihe 3: Testaa**

Kirjaudu työntekijänä → pyydä lomaa. Kirjaudu esihenkilönä → näe pyyntö, hyväksy. Aja `Shifts.luoViikko(...)` lomaviikolle → työntekijälle ei tule vuoroja.

- [ ] **Vaihe 4: Commit**

```bash
git add -A
git commit -m "Vaihe 4.3: Esihenkilön lomapyyntöjen hallinta"
```

---

## Vaihe 5: Poikkeuspäivät & viimeistely

**Tavoite:** Esihenkilö merkitsee päivät joina laiva ei lähde. Automatiikka huomioi nämä. Sovellus viimeistellään.

### Tehtävä 5.1: Poikkeuspäivien malli

**Tiedostot:**
- Luo: `js/exceptions.js`
- Muokkaa: `index.html`

- [ ] **Vaihe 1: Lisää scripti `index.html`iin**

```html
<script src="js/exceptions.js"></script>
```

- [ ] **Vaihe 2: Luo `js/exceptions.js`**

```js
// Poikkeuspäivät — päivät joina laiva ei lähde tai on muuten poikkeustila.
// Rakenne: [{ paiva: 'YYYY-MM-DD', kuvaus: 'Joulupäivä' }]
const Exceptions = {
    AVAIN: 'exceptions',

    kaikki() {
        return Storage.load(this.AVAIN, []);
    },

    tallenna(rivit) {
        Storage.save(this.AVAIN, rivit);
    },

    lisaa(paiva, kuvaus) {
        const rivit = this.kaikki();
        if (rivit.some(r => r.paiva === paiva)) return; // ei duplikaatteja
        rivit.push({ paiva, kuvaus });
        rivit.sort((a, b) => a.paiva.localeCompare(b.paiva));
        this.tallenna(rivit);
    },

    poista(paiva) {
        this.tallenna(this.kaikki().filter(r => r.paiva !== paiva));
    },

    onkoPoikkeus(paiva) {
        return this.kaikki().some(r => r.paiva === paiva);
    },

    paivat() {
        return this.kaikki().map(r => r.paiva);
    },
};
```

- [ ] **Vaihe 3: Testaa konsolissa**

```js
Exceptions.lisaa('2026-12-25', 'Joulupäivä')
Exceptions.kaikki()
Exceptions.onkoPoikkeus('2026-12-25')   // true
```

- [ ] **Vaihe 4: Commit**

```bash
git add -A
git commit -m "Vaihe 5.1: Poikkeuspäivien malli"
```

---

### Tehtävä 5.2: Esihenkilön poikkeuspäivien näkymä

**Tiedostot:**
- Muokkaa: `js/views/manager.js`

- [ ] **Vaihe 1: Lisää 'poikkeukset' näkymä `ManagerView`hin**

Lisää uusi nappi sekä `render`- että `renderLomat`-metodien navigaatioon:

```js
<button id="nakyma-poikkeukset">Poikkeuspäivät</button>
```

Lisää tapahtumakuuntelija jokaiseen näkymään:

```js
        document.getElementById('nakyma-poikkeukset').addEventListener('click', () => {
            this.nykyinenNakyma = 'poikkeukset';
            this.render(container);
        });
```

Lisää `render`-metodin alkuun:

```js
        if (this.nykyinenNakyma === 'poikkeukset') {
            this.renderPoikkeukset(container);
            return;
        }
```

Lisää uusi metodi:

```js
    renderPoikkeukset(container) {
        const rivit = Exceptions.kaikki();
        const rivitHtml = rivit.length
            ? rivit.map(r => `
                <li>
                    <strong>${this.muotoilePvm(r.paiva)}</strong>
                    — ${r.kuvaus}
                    <button data-paiva="${r.paiva}" class="poista">Poista</button>
                </li>
            `).join('')
            : '<li class="tyhja">Ei poikkeuspäiviä.</li>';

        container.innerHTML = `
            <header class="topbar">
                <h1>Poikkeuspäivät</h1>
                <nav>
                    <button id="nakyma-kalenteri">Kalenteri</button>
                    <button id="nakyma-lomat">Lomapyynnöt</button>
                    <button id="nakyma-poikkeukset" class="ensisijainen">Poikkeuspäivät</button>
                    <button id="logout">Kirjaudu ulos</button>
                </nav>
            </header>

            <p>Päivät joina laiva ei lähde — vuoroja ei luoda näille päiville.</p>

            <form id="poikkeus-lomake" class="loma-lomake">
                <label>Päivämäärä: <input type="date" id="poikkeus-paiva" required></label>
                <label>Kuvaus: <input type="text" id="poikkeus-kuvaus" placeholder="esim. Joulupäivä" required></label>
                <button type="submit" class="ensisijainen">Lisää</button>
            </form>

            <h2>Poikkeukset</h2>
            <ul class="lomalista">${rivitHtml}</ul>
        `;

        document.getElementById('logout').addEventListener('click', () => {
            Auth.logout();
            App.render();
        });
        document.getElementById('nakyma-kalenteri').addEventListener('click', () => {
            this.nykyinenNakyma = 'kalenteri';
            this.render(container);
        });
        document.getElementById('nakyma-lomat').addEventListener('click', () => {
            this.nykyinenNakyma = 'lomat';
            this.render(container);
        });
        document.getElementById('nakyma-poikkeukset').addEventListener('click', () => {
            this.nykyinenNakyma = 'poikkeukset';
            this.render(container);
        });

        document.getElementById('poikkeus-lomake').addEventListener('submit', (e) => {
            e.preventDefault();
            const paiva = document.getElementById('poikkeus-paiva').value;
            const kuvaus = document.getElementById('poikkeus-kuvaus').value;
            Exceptions.lisaa(paiva, kuvaus);
            this.render(container);
        });

        container.querySelectorAll('.poista').forEach(btn => {
            btn.addEventListener('click', () => {
                Exceptions.poista(btn.dataset.paiva);
                this.render(container);
            });
        });
    },
```

- [ ] **Vaihe 2: Päivitä `luo-vuorot` -nappi käyttämään poikkeuspäiviä**

Etsi `ManagerView`stä:

```js
                Shifts.luoViikko(this.nykyinenAlkuPaiva);
```

→ korvaa:

```js
                Shifts.luoViikko(this.nykyinenAlkuPaiva, Exceptions.paivat());
```

- [ ] **Vaihe 3: Testaa**

Kirjaudu esihenkilönä → "Poikkeuspäivät" → lisää 22.4.2026 "Testipoikkeus" → "Kalenteri" → "Luo vuorot" → 22.4. ei pitäisi näkyä vuoroja.

- [ ] **Vaihe 4: Commit**

```bash
git add -A
git commit -m "Vaihe 5.2: Esihenkilön poikkeuspäivien hallinta"
```

---

### Tehtävä 5.3: Viimeistely — visuaalinen siisti

**Tiedostot:**
- Muokkaa: `css/style.css`, `js/views/manager.js`

- [ ] **Vaihe 1: Lisää viikonloppujen visuaalinen erottelu kalenteriin**

Päivitä `paivaSarakeHtml` metodi `js/views/manager.js`:ssä:

```js
    paivaSarakeHtml(paivaIso) {
        const vuorot = Shifts.paivalle(paivaIso);
        const onPoikkeus = Exceptions.onkoPoikkeus(paivaIso);

        const vuoroHtml = vuorot.map(v => {
            const tyontekija = TYONTEKIJAT.find(t => t.id === v.tyontekijaId);
            const tyyppi = VUOROTYYPIT[v.vuorotyyppi];
            return `<li>${tyontekija?.nimi || '?'} <small>${tyyppi.alku}–${tyyppi.loppu}</small></li>`;
        }).join('');

        const pvm = new Date(paivaIso);
        const onViikonloppu = pvm.getDay() === 0 || pvm.getDay() === 6;
        const luokat = ['paiva-sarake'];
        if (onViikonloppu) luokat.push('viikonloppu');
        if (onPoikkeus) luokat.push('poikkeus');

        const viikonpaiva = ['Su','Ma','Ti','Ke','To','Pe','La'][pvm.getDay()];
        const poikkeusMerkki = onPoikkeus ? ' ⚠️' : '';

        return `
            <div class="${luokat.join(' ')}">
                <h3>${viikonpaiva} ${pvm.getDate()}.${pvm.getMonth()+1}.${poikkeusMerkki}</h3>
                <ul>${vuoroHtml || '<li class="tyhja">Ei vuoroja</li>'}</ul>
            </div>
        `;
    },
```

- [ ] **Vaihe 2: Lisää tyylit**

```css
.paiva-sarake.viikonloppu {
    background: #fafafa;
}

.paiva-sarake.poikkeus {
    background: #fff4e0;
    border-color: #ffb84d;
}

nav {
    display: flex;
    gap: 8px;
}

button {
    padding: 6px 12px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
}

button:hover {
    background: #f0f0f0;
}
```

- [ ] **Vaihe 3: Testaa**

Tarkista että viikonloppu erottuu, poikkeuspäivä näkyy vaalean oranssina ja varoitusmerkillä.

- [ ] **Vaihe 4: Commit**

```bash
git add -A
git commit -m "Vaihe 5.3: Visuaalinen viimeistely — viikonloput ja poikkeuspäivät"
```

---

### Tehtävä 5.4: Lopputestaus ja README

**Tiedostot:**
- Luo: `README.md`

- [ ] **Vaihe 1: Käy läpi koko sovellus**

1. Avaa `index.html` puhtaassa selainikkunassa
2. Konsolissa: `localStorage.clear()` → päivitä
3. Klikkaa "Esihenkilö Esimerkki" → kalenteri auki
4. Klikkaa "🪄 Luo vuorot" → vahvista → vuorot ilmestyvät
5. Vaihda viikkoa edestakaisin
6. "Poikkeuspäivät" → lisää poikkeus → palaa kalenteriin → "Luo vuorot" → poikkeus huomioitu
7. Logout → kirjaudu työntekijänä → näe omat vuorot
8. Pyydä lomaa → näkyy "Odottaa"-tilassa
9. Logout → esihenkilönä → "Lomapyynnöt" → hyväksy → työntekijän puolella muuttuu "Hyväksytty"
10. Aja vuorot uudestaan lomaviikolle → työntekijä ei ole vuoroissa

- [ ] **Vaihe 2: Luo `README.md`**

```markdown
# Finnlines vuorohallinta — demo

Selainpohjainen demo Finnlinesin matkustajaliikenteen asiakaspalvelun
vuorosuunnitteluun. Esihenkilö luo vuorot automaattisesti, työntekijät näkevät
omansa ja voivat pyytää lomaa.

## Käyttö

Avaa `index.html` selaimessa. Ei vaadi serveriä eikä asennusta.

## Roolit

- **Esihenkilö** — luo vuorot, hyväksyy lomapyynnöt, hallinnoi poikkeuspäiviä
- **Yksilömyynti / Ryhmämyynti** — näkee omat vuoronsa, pyytää lomaa, ilmoittaa sairaspäivät

## Tekniikka

- Vanilla HTML / CSS / JavaScript (ei kirjastoja)
- Data tallentuu selaimen `localStorage`en
- 15 työntekijää valmiina demoa varten

## Datan nollaus

Avaa selaimen kehittäjäkonsoli (F12) ja kirjoita: `localStorage.clear()`
```

- [ ] **Vaihe 3: Commit**

```bash
git add -A
git commit -m "Vaihe 5.4: Lopputestaus ja README"
```

- [ ] **Vaihe 4: Push GitHubiin**

```bash
git push
```

---

## Valmis! 🎉

Sinulla on nyt toimiva demo, jossa:
- ✅ 15 työntekijää, 3 roolia, oma näkymä jokaiselle
- ✅ Automaattinen vuorojen luonti sääntöjen mukaan (sesonki, lähtöselvitys, perättäiset päivät)
- ✅ Lomapyynnöt ja niiden hyväksyntä
- ✅ Sairasilmoitukset
- ✅ Poikkeuspäivät (laiva ei lähde)
- ✅ Tieto säilyy selaimen muistissa

**Seuraavat askeleet (jos haluat jatkaa demon jälkeen):**
- Vuoronvaihto kollegan kanssa
- Työtuntien laskenta
- Mobiili-ulkoasu
- Vienti kalenteriin (.ics)
- Oikea backend (Firebase) jos haluat jakaa datan käyttäjien kesken
