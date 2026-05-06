// Loma- ja sairaspoissaolot.
// Pyyntö: { id, tyyppi: 'loma'|'sairas', tyontekijaId, alku, loppu, tila: 'odottaa'|'hyvaksytty'|'hylatty', luotu }
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
