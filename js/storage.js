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
