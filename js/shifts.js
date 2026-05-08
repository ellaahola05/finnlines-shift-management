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
        // Päätä etätyö automaattisesti jos ei nimenomaisesti annettu
        let etana = lisat.etana;
        if (etana === undefined) {
            etana = this.paatteleEtana(tyontekijaId, paiva, vuorotyyppi);
        }
        const uusi = {
            id: Date.now() + Math.random(),
            paiva,
            tyontekijaId,
            vuorotyyppi,
            ...lisat,
            etana,
        };
        vuorot.push(uusi);
        this.tallenna(vuorot);
        return uusi;
    },

    // Päättelee onko vuoro etänä työntekijän asetuksen + toiveiden perusteella.
    // Lähtöselvitys-vuorot eivät koskaan ole etänä.
    paatteleEtana(tyontekijaId, paivaIso, vuorotyyppi) {
        const tyyppi = vuorotyyppi || '';
        if (tyyppi.includes('lahtoselvitys')) return false;
        const t = TYONTEKIJAT.find(x => x.id === tyontekijaId);
        if (!t) return false;
        if (t.etatyo === 'aina') return true;
        if (t.etatyo === 'voi' && Wishes.toivooEtana(tyontekijaId, paivaIso)) return true;
        return false;
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

    // Vuoron kesto palkallisina tunteina.
    // Lakisääteinen 30 min lounastauko vähennetään ≥ 6 h vuoroista
    // (esim. 9–17 = 8 h brutto → 7.5 h palkka).
    kesto(vuoro) {
        const a = this.aika(vuoro);
        if (!a.alku || !a.loppu) return 0;
        const [ah, am] = a.alku.split(':').map(Number);
        const [lh, lm] = a.loppu.split(':').map(Number);
        const brutto = Math.max(0, ((lh * 60 + lm) - (ah * 60 + am)) / 60);
        return brutto >= 6 ? brutto - 0.5 : brutto;
    },

    // ISO-viikkonumero (ma-su)
    viikonNumero(d) {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    },

    // Yhteenveto työntekijän tunneista yhdessä kuukaudessa
    // Palauttaa: { yhteensa, viikot: [{ vko, tunnit, etanaTunnit }] }
    tunnitKuukaudessa(tyontekijaId, vuosi, kuukausi) {
        const omat = this.tyontekijalle(tyontekijaId).filter(v => {
            const d = new Date(v.paiva);
            return d.getFullYear() === vuosi && d.getMonth() === kuukausi;
        });

        const viikotMap = {};
        let yhteensa = 0;

        for (const v of omat) {
            const kesto = this.kesto(v);
            yhteensa += kesto;
            const wk = this.viikonNumero(new Date(v.paiva));
            if (!viikotMap[wk]) viikotMap[wk] = { tunnit: 0, etanaTunnit: 0 };
            viikotMap[wk].tunnit += kesto;
            if (v.etana) viikotMap[wk].etanaTunnit += kesto;
        }

        const viikot = Object.entries(viikotMap)
            .map(([wk, d]) => ({ vko: parseInt(wk, 10), ...d }))
            .sort((a, b) => a.vko - b.vko);

        return { yhteensa, viikot };
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

        // ==== VIIKONLOPPU: oma erillinen vuoro 12-15 ====
        if (onViikonloppu) {
            const tyyppi = 'asiakaspalvelu_lahtoselvitys_vkl';
            const olemassa = this.paivalle(paivaIso).filter(v => v.vuorotyyppi === tyyppi).length;
            const lisaa = Math.max(0, tarvitaan - olemassa);
            if (lisaa === 0) return;

            const ehdokkaat = TYONTEKIJAT
                .filter(t => t.rooli === 'asiakaspalvelu')
                .filter(t => onKesa || t.tyyppi === 'vakituinen')
                .filter(t => t.etatyo !== 'aina')
                .filter(t => !Wishes.toivooEtana(t.id, paivaIso));

            const valitut = this.valitseTasapuolisesti(ehdokkaat, lisaa, paivaIso);
            valitut.forEach(t => this.lisaa(paivaIso, t.id, tyyppi));
            return;
        }

        // ==== ARKI: merkitään lähtöselvitys olemassa olevaan vuoroon ====
        // (työntekijä tekee sen normaalin vuoronsa aikana 12-14, ei tule vain 2h:ksi)

        // Etsi sopivat vuorot: paikan päällä olevat asiakaspalvelu-vuorot,
        // joissa ei vielä ole lähtöselvitys-merkintää
        const sopivatVuorot = this.paivalle(paivaIso).filter(v =>
            (v.vuorotyyppi === 'asiakaspalvelu_aamu' || v.vuorotyyppi === 'asiakaspalvelu_lyhyt')
            && !v.etana
        );

        // Lasketaan jo merkityt
        const joMerkityt = sopivatVuorot.filter(v => v.lahtoselvitys).length;
        const merkittavaa = Math.max(0, tarvitaan - joMerkityt);
        if (merkittavaa === 0) return;

        // Vapaina (ei vielä merkityt)
        const vapaat = sopivatVuorot.filter(v => !v.lahtoselvitys);

        // Prioriteetti: kesätyöntekijät ensin, sitten muut
        vapaat.sort((a, b) => {
            const ta = TYONTEKIJAT.find(t => t.id === a.tyontekijaId);
            const tb = TYONTEKIJAT.find(t => t.id === b.tyontekijaId);
            const aKesa = ta?.tyyppi === 'kesatyontekija' ? 0 : 1;
            const bKesa = tb?.tyyppi === 'kesatyontekija' ? 0 : 1;
            return aKesa - bKesa;
        });

        // Merkitse N ensimmäistä lähtöselvitykseen
        vapaat.slice(0, merkittavaa).forEach(v => {
            this.paivita(v.id, { lahtoselvitys: true });
        });
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
