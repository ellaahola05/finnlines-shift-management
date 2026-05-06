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
