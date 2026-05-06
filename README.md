# Finnlines vuorohallinta — demo

Selainpohjainen demo Finnlinesin matkustajaliikenteen asiakaspalvelun
vuorosuunnitteluun. Esihenkilö luo vuorot automaattisesti kuukausi
kerrallaan ja julkaisee ne työntekijöille.

## Käyttö

Avaa `index.html` selaimessa. Ei vaadi serveriä eikä asennusta.

## Roolit

- **Esihenkilö** — luo vuorot, julkaisee kuukauden, hyväksyy lomapyynnöt,
  hallinnoi poikkeuspäiviä
- **Yksilömyynti / Ryhmämyynti** — näkee omat vuoronsa kuukausikalenterissa,
  pyytää lomaa, ilmoittaa sairauspäivät

## Toiminnot

- 🪄 Automaattinen vuorojen luonti sääntöjen mukaan
  (kesä/talvi-sesonki, max 5 perättäistä päivää, lähtöselvitys, viikonloput)
- 📢 Julkaisutila — työntekijät näkevät vain julkaistut kuukaudet
- 🏖️ Lomapyynnöt + esihenkilön hyväksyntä
- 🤒 Sairasilmoitukset
- ⚠️ Poikkeuspäivät (laiva ei lähde) — huomioidaan automaattisesti

## Tekniikka

- Vanilla HTML / CSS / JavaScript (ei kirjastoja)
- Data tallentuu selaimen `localStorage`en
- 15 työntekijää valmiina demoa varten

## Kansiorakenne

```
finnlines-shift-management/
├── index.html              # ainoa HTML-sivu
├── css/style.css           # tyylit
└── js/
    ├── app.js              # pääohjain
    ├── auth.js             # kirjautuminen
    ├── data.js             # alkudata: työntekijät, säännöt
    ├── exceptions.js       # poikkeuspäivät
    ├── leave.js            # lomat ja sairauspoissaolot
    ├── shifts.js           # vuorot + automaattinen luonti
    ├── storage.js          # localStorage-apurit
    └── views/
        ├── employee.js     # työntekijän näkymä
        ├── login.js        # aloitusnäkymä
        └── manager.js      # esihenkilön näkymä
```

## Datan nollaus

Avaa selaimen kehittäjäkonsoli (F12) ja kirjoita:

```js
localStorage.clear()
```

## Rajoitukset

Tämä on demo — data säilyy vain omassa selaimessa. Ei oikeita käyttäjätilejä,
ei jaettua tietokantaa. Tuotantokäyttöön tarvitaan backend
(esim. Firebase tai Supabase).
