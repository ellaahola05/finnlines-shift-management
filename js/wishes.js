// Työvuorotoiveet — työntekijän toiveet työvuorojen suhteen.
//
// Toive: {
//   id, tyontekijaId, tyyppi, alku, loppu, kommentti, tila, luotu
// }
//   tyyppi: 'ei_kaytettavissa' | 'toivoo_toita' | 'muu'
//   tila:   'odottaa' | 'hyvaksytty' | 'hylatty'
//
// Hyväksyntäsäännöt:
//   - 'ei_kaytettavissa': vakituiset/määräaikaiset → 'odottaa'; kesätyöntekijät → 'hyvaksytty'
//   - 'toivoo_toita':     kaikki → 'hyvaksytty' suoraan
//   - 'muu':              kaikki → 'odottaa' (vapaateksti vaatii aina käsittelyn)
const Wishes = {
    AVAIN: 'wishes',

    kaikki() {
        return Storage.load(this.AVAIN, []);
    },

    tallenna(rivit) {
        Storage.save(this.AVAIN, rivit);
    },

    pyyda(tyontekijaId, tyyppi, alku, loppu, kommentti = '') {
        const tyontekija = TYONTEKIJAT.find(t => t.id === tyontekijaId);
        const tila = this.aloitusTila(tyontekija, tyyppi, alku, loppu);
        const rivit = this.kaikki();
        const uusi = {
            id: Date.now() + Math.random(),
            tyontekijaId,
            tyyppi,
            alku,
            loppu,
            kommentti,
            tila,
            luotu: new Date().toISOString(),
        };
        rivit.push(uusi);
        this.tallenna(rivit);
        return uusi;
    },

    // Päättää aloitustilan tyypin, sopimuksen ja keston perusteella.
    //
    // Säännöt:
    //  - 'toivoo_toita'      → aina 'hyvaksytty'
    //  - 'muu'               → aina 'odottaa' (vapaateksti vaatii käsittelyn)
    //  - 'ei_kaytettavissa':
    //      kiinteä sopimus (min == max)             → 'odottaa'
    //      vaihteleva sopimus, mahtuu joustoon      → 'hyvaksytty'
    //      vaihteleva sopimus, ylittää jouston      → 'odottaa'
    aloitusTila(tyontekija, tyyppi, alku, loppu) {
        if (!tyontekija) return 'odottaa';
        if (tyyppi === 'toivoo_toita') return 'hyvaksytty';
        if (tyyppi === 'muu') return 'odottaa';

        // tyyppi === 'ei_kaytettavissa'
        const sop = tyontekija.sopimus || { viikkotunnit: 37.5 };
        const max = sop.viikkotunnit;
        const min = sop.viikkotunnitMin || max;

        // Kiinteä sopimus (täydet tunnit) — aina esimiehen päätös
        if (min >= max) return 'odottaa';

        // Vaihteleva sopimus — tarkista mahtuuko poissaolo joustoon
        const flexHoursPerWeek = max - min;
        const paivat = this.paivatValilla(alku, loppu);
        const viikot = this.viikotValilla(alku, loppu);
        // Sopimuksen jousto tunneissa, muunnetaan päiviksi (oletus 7.5h/vrk)
        const sallittuJoustoPaivina = (flexHoursPerWeek * viikot) / 7.5;

        return paivat <= sallittuJoustoPaivina ? 'hyvaksytty' : 'odottaa';
    },

    paivatValilla(alkuIso, loppuIso) {
        const a = new Date(alkuIso);
        const l = new Date(loppuIso);
        const ms = l.getTime() - a.getTime();
        return Math.floor(ms / 86400000) + 1;
    },

    // Laskee kuinka montaan eri kalenteriviikkoon (ma-su) ajanjakso osuu
    viikotValilla(alkuIso, loppuIso) {
        const viikot = new Set();
        const d = new Date(alkuIso);
        const end = new Date(loppuIso);
        while (d <= end) {
            const ma = new Date(d);
            const offset = (d.getDay() + 6) % 7;
            ma.setDate(d.getDate() - offset);
            viikot.add(ma.toISOString().substring(0, 10));
            d.setDate(d.getDate() + 1);
        }
        return viikot.size;
    },

    paivita(id, tila) {
        const rivit = this.kaikki().map(r => r.id === id ? { ...r, tila } : r);
        this.tallenna(rivit);
    },

    poista(id) {
        this.tallenna(this.kaikki().filter(r => r.id !== id));
    },

    odottavat() {
        return this.kaikki().filter(r => r.tila === 'odottaa');
    },

    tyontekijalle(tyontekijaId) {
        return this.kaikki().filter(r => r.tyontekijaId === tyontekijaId);
    },

    // Onko työntekijä merkinnyt itsensä ei-käytettäväksi tänä päivänä?
    // (käytetään automatiikassa — sama vaikutus kuin lomalla)
    onkoEiKaytettavissa(tyontekijaId, paivaIso) {
        return this.kaikki().some(r =>
            r.tyontekijaId === tyontekijaId &&
            r.tyyppi === 'ei_kaytettavissa' &&
            r.tila === 'hyvaksytty' &&
            r.alku <= paivaIso && paivaIso <= r.loppu
        );
    },

    // Toivooko tämä työntekijä töitä juuri tähän päivään?
    // (käytetään automatiikassa bonuksena valittaessa)
    toivooToita(tyontekijaId, paivaIso) {
        return this.kaikki().some(r =>
            r.tyontekijaId === tyontekijaId &&
            r.tyyppi === 'toivoo_toita' &&
            r.tila === 'hyvaksytty' &&
            r.alku <= paivaIso && paivaIso <= r.loppu
        );
    },
};

const TOIVE_TYYPPI_NIMI = {
    ei_kaytettavissa: 'En käytettävissä',
    toivoo_toita:     'Toivon töitä',
    muu:              'Muu toive',
};
