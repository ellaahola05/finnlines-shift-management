// Työntekijöiden hallinta — alustetaan oletuslistalta, tallennetaan localStorageen.
// Muut tiedostot lukevat globaalia TYONTEKIJAT-taulukkoa kuten ennen.
const Employees = {
    AVAIN: 'tyontekijat',

    // Kutsutaan kerran sovelluksen käynnistyessä — synkronoi data.js:n alkuarvot
    // ja localStoragen sisällön.
    init() {
        const tallennetut = Storage.load(this.AVAIN);
        if (tallennetut && Array.isArray(tallennetut) && tallennetut.length > 0) {
            const migratoidut = tallennetut.map(t => {
                let m = { ...t };
                // Migraatio: yksilomyynti → asiakaspalvelu (vanhempi rooli-nimi)
                if (m.rooli === 'yksilomyynti') m.rooli = 'asiakaspalvelu';
                // Migraatio: lisää sopimustieto jos puuttuu
                if (!m.sopimus) m.sopimus = this.oletusSopimus(m);
                return m;
            });
            TYONTEKIJAT.length = 0;
            TYONTEKIJAT.push(...migratoidut);
            this.tallenna();
        } else {
            // Ensimmäinen käynnistys — tallennetaan oletukset
            this.tallenna();
        }

        // Migratoi myös tallennetut vuorot
        this.migratoiVuorot();
    },

    // Päättelee oletussopimuksen tyypin perusteella (käytetään migraatioon
    // ja jos lomakkeessa ei ole vielä sopimusvalintaa)
    oletusSopimus(t) {
        if (t.tyyppi === 'kesatyontekija' || t.tyyppi === 'maaraaikainen') {
            return { viikkotunnit: 37.5, viikkotunnitMin: 20 };
        }
        return { viikkotunnit: 37.5 };
    },

    migratoiVuorot() {
        const vuorot = Storage.load('shifts', []);
        if (!vuorot.length) return;
        const kartta = {
            yksilo_aamu: 'asiakaspalvelu_aamu',
            yksilo_lyhyt: 'asiakaspalvelu_lyhyt',
            yksilo_lahtoselvitys_arki: 'asiakaspalvelu_lahtoselvitys_arki',
            yksilo_lahtoselvitys_vkl: 'asiakaspalvelu_lahtoselvitys_vkl',
        };
        let muutoksia = false;
        const paivitetyt = vuorot.map(v => {
            if (kartta[v.vuorotyyppi]) {
                muutoksia = true;
                return { ...v, vuorotyyppi: kartta[v.vuorotyyppi] };
            }
            return v;
        });
        if (muutoksia) Storage.save('shifts', paivitetyt);
    },

    tallenna() {
        Storage.save(this.AVAIN, TYONTEKIJAT);
    },

    lisaa(nimi, rooli, tyyppi, sopimus) {
        const id = TYONTEKIJAT.length === 0
            ? 1
            : Math.max(...TYONTEKIJAT.map(t => t.id)) + 1;
        const uusi = { id, nimi, rooli, tyyppi, sopimus: sopimus || this.oletusSopimus({ tyyppi }) };
        TYONTEKIJAT.push(uusi);
        this.tallenna();
        return uusi;
    },

    // Päivitä olemassaolevan työntekijän sopimustiedot
    paivitaSopimus(id, sopimus) {
        const t = TYONTEKIJAT.find(x => x.id === id);
        if (!t) return false;
        t.sopimus = sopimus;
        this.tallenna();
        return true;
    },

    poista(id) {
        // Esihenkilöä (id 1) ei voi poistaa, jotta automatiikka toimii
        if (id === 1) return false;
        const idx = TYONTEKIJAT.findIndex(t => t.id === id);
        if (idx < 0) return false;
        TYONTEKIJAT.splice(idx, 1);
        this.tallenna();
        return true;
    },

    // Palauttaa true jos kyseessä on esihenkilö (joka on aina id 1)
    onkoEsihenkilo(id) {
        return id === 1;
    },
};
