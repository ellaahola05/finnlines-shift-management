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
