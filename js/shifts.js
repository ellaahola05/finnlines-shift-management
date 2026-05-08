// Vuorologiikka. Vuoro = { id, paiva: 'YYYY-MM-DD', tyontekijaId, vuorotyyppi }
const Shifts = {
    AVAIN: 'shifts',

    kaikki() {
        return Storage.load(this.AVAIN, []);
    },

    tallenna(vuorot) {
        Storage.save(this.AVAIN, vuorot);
    },

    lisaa(paiva, tyontekijaId, vuorotyyppi, lisat = {}) {
        const vuorot = this.kaikki();
        const uusi = {
            id: Date.now() + Math.random(),
            paiva,
            tyontekijaId,
            vuorotyyppi,
            ...lisat, // esim. { lukittu: true, alku: '10:00', loppu: '15:00' }
        };
        vuorot.push(uusi);
        this.tallenna(vuorot);
        return uusi;
    },

    poista(id) {
        const vuorot = this.kaikki().filter(v => v.id !== id);
        this.tallenna(vuorot);
    },

    // Päivittää annetut kentät yhteen vuoroon
    paivita(id, paivitykset) {
        const vuorot = this.kaikki().map(v =>
            v.id === id ? { ...v, ...paivitykset } : v
        );
        this.tallenna(vuorot);
    },

    // Palauttaa vuoron efektiivisen alku/loppu-ajan
    // (mukautettu jos asetettu, muuten vuorotyypin oletus)
    aika(vuoro) {
        const tyyppi = VUOROTYYPIT[vuoro.vuorotyyppi] || { alku: '', loppu: '' };
        return {
            alku:  vuoro.alku  || tyyppi.alku,
            loppu: vuoro.loppu || tyyppi.loppu,
        };
    },

    paivalle(paiva) {
        return this.kaikki().filter(v => v.paiva === paiva);
    },

    tyontekijalle(tyontekijaId) {
        return this.kaikki().filter(v => v.tyontekijaId === tyontekijaId);
    },

    // --- AUTOMAATTINEN LUONTI ---

    luoKuukausi(vuosi, kuukausi, poikkeuspaivat = []) {
        // kuukausi: 0-11 (JavaScript-tyyli)
        const paiviaKuussa = new Date(vuosi, kuukausi + 1, 0).getDate();
        const paivat = [];
        for (let p = 1; p <= paiviaKuussa; p++) {
            paivat.push(this.toIso(new Date(vuosi, kuukausi, p)));
        }

        // Poista vain LUKITSEMATTOMAT vuorot tältä kuukaudelta — lukitut säilyvät.
        const ilman = this.kaikki().filter(v =>
            !paivat.includes(v.paiva) || v.lukittu
        );
        this.tallenna(ilman);

        for (const paiva of paivat) {
            this.luoPaivanVuorot(paiva, poikkeuspaivat);
        }
    },

    // --- JULKAISU ---
    // Kuukausi on joko 'luonnos' (oletus) tai 'julkaistu'.
    // Tallennetaan lista julkaistuista kuukausista muodossa 'YYYY-MM'.

    JULKAISTU_AVAIN: 'publishedMonths',

    julkaistut() {
        return Storage.load(this.JULKAISTU_AVAIN, []);
    },

    kuukausiAvain(vuosi, kuukausi) {
        return `${vuosi}-${String(kuukausi + 1).padStart(2, '0')}`;
    },

    onJulkaistu(vuosi, kuukausi) {
        return this.julkaistut().includes(this.kuukausiAvain(vuosi, kuukausi));
    },

    julkaise(vuosi, kuukausi) {
        const avain = this.kuukausiAvain(vuosi, kuukausi);
        const lista = this.julkaistut();
        if (!lista.includes(avain)) {
            lista.push(avain);
            Storage.save(this.JULKAISTU_AVAIN, lista);
        }
    },

    peruJulkaisu(vuosi, kuukausi) {
        const avain = this.kuukausiAvain(vuosi, kuukausi);
        Storage.save(this.JULKAISTU_AVAIN, this.julkaistut().filter(a => a !== avain));
    },

    // Palauttaa työntekijän vuorot vain julkaistuista kuukausista
    julkaistutTyontekijalle(tyontekijaId) {
        return this.tyontekijalle(tyontekijaId).filter(v => {
            const [y, m] = v.paiva.split('-');
            return this.onJulkaistu(parseInt(y, 10), parseInt(m, 10) - 1);
        });
    },

    luoPaivanVuorot(paivaIso, poikkeuspaivat) {
        const d = new Date(paivaIso);
        const viikonpaiva = d.getDay(); // 0=su, 6=la
        const onViikonloppu = (viikonpaiva === 0 || viikonpaiva === 6);
        const onPoikkeuspaiva = poikkeuspaivat.includes(paivaIso);

        // Pyhinä ja poikkeuspäivinä ei vuoroja
        if (onPoikkeuspaiva) return;

        // Onko työntekijällä jo vuoro tänä päivänä? (lukitut huomioidaan)
        const onJoTyontekijalla = (id) => this.paivalle(paivaIso).some(v => v.tyontekijaId === id);

        // Satamavastaava — joka laivapäivä (myös viikonloppu) jollei jo lukittu
        if (!this.paivalle(paivaIso).some(v => v.vuorotyyppi === 'satamavastaava')) {
            this.luoSatamavastaava(paivaIso);
        }

        // Viikonloppuna lisäksi vain lähtöselvitys
        if (onViikonloppu) {
            this.luoLahtoselvitysVuorot(paivaIso, true);
            return;
        }

        // Arkipäivänä:
        // 1. Esihenkilö (jollei jo olemassa)
        if (!onJoTyontekijalla(1)) {
            this.lisaa(paivaIso, 1, 'esihenkilo');
        }

        // 2. Ryhmämyynti — kaikki paikalla aina arkisin (ohita ne jotka jo lukittu)
        const ryhma = TYONTEKIJAT.filter(t => t.rooli === 'ryhmamyynti');
        ryhma.forEach(t => {
            if (!onJoTyontekijalla(t.id)) {
                this.lisaa(paivaIso, t.id, 'ryhma');
            }
        });

        // 3. Asiakaspalvelu — sesonkiriippuvainen määrä
        this.luoAsiakaspalveluVuorot(paivaIso);

        // 4. Lähtöselvitys arkisin
        this.luoLahtoselvitysVuorot(paivaIso, false);
    },

    luoSatamavastaava(paivaIso) {
        const valittu = this.valitseSatamavastaava(paivaIso);
        if (valittu) {
            this.lisaa(paivaIso, valittu.id, 'satamavastaava');
        }
    },

    valitseSatamavastaava(paivaIso) {
        const ehdokkaat = TYONTEKIJAT.filter(t => t.rooli === 'satamahenkilokunta');
        if (ehdokkaat.length === 0) return null;

        // Suodata pois lomalla olevat ja "en käytettävissä" -toiveen lähettäneet
        const vapaat = ehdokkaat.filter(t =>
            !Leave.onkoVapaalla(t.id, paivaIso) &&
            !Wishes.onkoEiKaytettavissa(t.id, paivaIso)
        );
        if (vapaat.length === 0) return null;
        if (vapaat.length === 1) return vapaat[0];

        // Etsi kuka oli satamavastaavana eilen ja kauanko peräkkäin
        const d = new Date(paivaIso);
        const eilen = new Date(d);
        eilen.setDate(d.getDate() - 1);
        const eilenIso = this.toIso(eilen);

        const eilenSatamavastaava = this.paivalle(eilenIso)
            .find(v => v.vuorotyyppi === 'satamavastaava');

        // Jos ei ollut eilen ketään, valitaan se jolla on vähemmän satamavastaavia kaikkiaan
        if (!eilenSatamavastaava) {
            return vapaat.sort((a, b) =>
                this.satamavastaavaMaara(a.id) - this.satamavastaavaMaara(b.id)
            )[0];
        }

        // Lasketaan kuinka monta peräkkäistä päivää sama henkilö on ollut satamavastaava
        let perakkainen = 0;
        for (let i = 1; i <= SAANNOT.satamavastaavaRotaatioPaivat + 1; i++) {
            const ed = new Date(d);
            ed.setDate(d.getDate() - i);
            const v = this.paivalle(this.toIso(ed))
                .find(v => v.vuorotyyppi === 'satamavastaava');
            if (!v || v.tyontekijaId !== eilenSatamavastaava.tyontekijaId) break;
            perakkainen++;
        }

        // Jos sama henkilö on tehnyt jo 5 päivää peräkkäin, vaihdetaan
        if (perakkainen >= SAANNOT.satamavastaavaRotaatioPaivat) {
            const toinen = vapaat.find(t => t.id !== eilenSatamavastaava.tyontekijaId);
            return toinen || vapaat[0];
        }

        // Muutoin sama jatkaa, jos vapaana
        const sama = vapaat.find(t => t.id === eilenSatamavastaava.tyontekijaId);
        return sama || vapaat[0];
    },

    satamavastaavaMaara(tyontekijaId) {
        return this.tyontekijalle(tyontekijaId)
            .filter(v => v.vuorotyyppi === 'satamavastaava').length;
    },

    luoAsiakaspalveluVuorot(paivaIso) {
        const kk = parseInt(paivaIso.substring(5,7), 10);
        const onKesa = SAANNOT.kesakuukaudet.includes(kk);
        const tarvitaan = onKesa ? SAANNOT.kesaAsiakaspalveluMin : SAANNOT.talviAsiakaspalveluMin;

        // Ota huomioon jo olemassa olevat (lukitut) vuorot
        const olemassa = this.paivalle(paivaIso).filter(v => v.vuorotyyppi === 'asiakaspalvelu_aamu').length;
        const lisaa = Math.max(0, tarvitaan - olemassa);
        if (lisaa === 0) return;

        const ehdokkaat = TYONTEKIJAT
            .filter(t => t.rooli === 'asiakaspalvelu')
            // Talvella vain vakituiset
            .filter(t => onKesa || t.tyyppi === 'vakituinen');

        const valitut = this.valitseTasapuolisesti(ehdokkaat, lisaa, paivaIso);
        valitut.forEach(t => this.lisaa(paivaIso, t.id, 'asiakaspalvelu_aamu'));
    },

    luoLahtoselvitysVuorot(paivaIso, onViikonloppu) {
        const kk = parseInt(paivaIso.substring(5,7), 10);
        const onKesa = SAANNOT.kesakuukaudet.includes(kk);
        const tarvitaan = onKesa ? SAANNOT.kesaLahtoselvitysMin : SAANNOT.talviLahtoselvitysMin;
        const tyyppi = onViikonloppu ? 'asiakaspalvelu_lahtoselvitys_vkl' : 'asiakaspalvelu_lahtoselvitys_arki';

        // Ota huomioon jo olemassa olevat (lukitut) vuorot
        const olemassa = this.paivalle(paivaIso).filter(v => v.vuorotyyppi === tyyppi).length;
        const lisaa = Math.max(0, tarvitaan - olemassa);
        if (lisaa === 0) return;

        const ehdokkaat = TYONTEKIJAT
            .filter(t => t.rooli === 'asiakaspalvelu')
            .filter(t => onKesa || t.tyyppi === 'vakituinen');

        const valitut = this.valitseTasapuolisesti(ehdokkaat, lisaa, paivaIso);
        valitut.forEach(t => this.lisaa(paivaIso, t.id, tyyppi));
    },

    valitseTasapuolisesti(ehdokkaat, maara, paivaIso) {
        // Älä valitse työntekijää, joka on jo paikalla tänä päivänä
        const tanaan = this.paivalle(paivaIso).map(v => v.tyontekijaId);
        const vapaat = ehdokkaat.filter(t =>
            !tanaan.includes(t.id) &&
            !Leave.onkoVapaalla(t.id, paivaIso) &&
            !Wishes.onkoEiKaytettavissa(t.id, paivaIso)
        );

        // Älä valitse, jos olisi 6+ peräkkäistä työpäivää
        const sopivat = vapaat.filter(t => !this.olisiLiikaaPerakkain(t.id, paivaIso));

        // Järjestä: 1) töitä toivovat ensin, 2) sitten vuoromäärä (vähiten)
        const jarjestetyt = sopivat.sort((a, b) => {
            const aToivoo = Wishes.toivooToita(a.id, paivaIso) ? 0 : 1;
            const bToivoo = Wishes.toivooToita(b.id, paivaIso) ? 0 : 1;
            if (aToivoo !== bToivoo) return aToivoo - bToivoo;
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
};
