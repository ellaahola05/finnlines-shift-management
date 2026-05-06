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

    // --- AUTOMAATTINEN LUONTI ---

    luoKuukausi(vuosi, kuukausi, poikkeuspaivat = []) {
        // kuukausi: 0-11 (JavaScript-tyyli)
        const paiviaKuussa = new Date(vuosi, kuukausi + 1, 0).getDate();
        const paivat = [];
        for (let p = 1; p <= paiviaKuussa; p++) {
            paivat.push(this.toIso(new Date(vuosi, kuukausi, p)));
        }

        // Poista vanhat vuorot tältä kuukaudelta ennen uusien luontia
        const ilman = this.kaikki().filter(v => !paivat.includes(v.paiva));
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
        const vapaat = ehdokkaat.filter(t =>
            !tanaan.includes(t.id) && !Leave.onkoVapaalla(t.id, paivaIso)
        );

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
};
