// Säännöt — pohja-asetukset + kuukausikohtaiset ylikirjoitukset
// Pohja-asetukset:    miten kesä ja talvi käyttäytyy oletuksena
// Kuukausi-ylikirjoitus: yhden kuukauden omat arvot (esim. "kesäkuu 2026: 7 hlö")

const Rules = {
    AVAIN_OLETUS:    'rules-default',
    AVAIN_KUUKAUSI:  'rules-month-overrides',

    // Lue pohja-asetukset. Jos käyttäjä on tallentanut omat, käytetään niitä;
    // muuten käytetään data.js:n SAANNOT-arvoja.
    oletukset() {
        const tallennettu = Storage.load(this.AVAIN_OLETUS, null);
        return { ...SAANNOT, ...(tallennettu || {}) };
    },

    tallennaOletukset(asetukset) {
        // Yhdistetään SAANNOT:in päälle, jotta puuttuvat kentät täydentyvät
        Storage.save(this.AVAIN_OLETUS, { ...SAANNOT, ...asetukset });
    },

    // Palauttaa kaikki kuukausi-ylikirjoitukset objektina:
    // { "2026-06": { asiakaspalveluMin: 7, ... }, "2026-07": {...} }
    kuukausiYlikirjoitukset() {
        return Storage.load(this.AVAIN_KUUKAUSI, {});
    },

    // Avain muodossa "YYYY-MM" (kuukausi 1-12)
    kuukausiAvain(vuosi, kuukausi) {
        return `${vuosi}-${String(kuukausi + 1).padStart(2, '0')}`;
    },

    // Onko tälle kuukaudelle tallennettu omat arvot?
    onYlikirjoitus(vuosi, kuukausi) {
        const all = this.kuukausiYlikirjoitukset();
        return !!all[this.kuukausiAvain(vuosi, kuukausi)];
    },

    // Palauttaa kuukauden voimassa olevat säännöt:
    // { onKesa, asiakaspalveluMin, asiakaspalveluMax, lahtoselvitysMin,
    //   lahtoselvitysMax, maxPerakkaiset }
    // Jos kuukaudelle on override → käytetään niitä, muuten kesä/talvi-oletuksia.
    kuukaudelle(vuosi, kuukausi) {
        const oletukset = this.oletukset();
        const override = this.kuukausiYlikirjoitukset()[this.kuukausiAvain(vuosi, kuukausi)] || {};
        // SAANNOT.kesakuukaudet käyttää 1-12 -indeksointia (touko=5)
        const onKesa = oletukset.kesakuukaudet.includes(kuukausi + 1);

        return {
            onKesa,
            asiakaspalveluMin: override.asiakaspalveluMin ??
                (onKesa ? oletukset.kesaAsiakaspalveluMin : oletukset.talviAsiakaspalveluMin),
            asiakaspalveluMax: override.asiakaspalveluMax ??
                (onKesa ? oletukset.kesaAsiakaspalveluMax : oletukset.talviAsiakaspalveluMax),
            lahtoselvitysMin: override.lahtoselvitysMin ??
                (onKesa ? oletukset.kesaLahtoselvitysMin : oletukset.talviLahtoselvitysMin),
            lahtoselvitysMax: override.lahtoselvitysMax ??
                (onKesa ? oletukset.kesaLahtoselvitysMax : oletukset.talviLahtoselvitysMax),
            maxPerakkaiset: override.maxPerakkaiset ?? oletukset.maxPerakkaisetTyopaivat,
        };
    },

    // Tallenna yhden kuukauden ylikirjoitus.
    // asetukset: { asiakaspalveluMin, asiakaspalveluMax, lahtoselvitysMin, lahtoselvitysMax, maxPerakkaiset }
    // Vain määritellyt (ei undefined) arvot tallennetaan.
    asetaKuukausi(vuosi, kuukausi, asetukset) {
        const all = this.kuukausiYlikirjoitukset();
        const avain = this.kuukausiAvain(vuosi, kuukausi);
        const puhdistettu = {};
        for (const [k, v] of Object.entries(asetukset)) {
            if (v !== undefined && v !== null && v !== '') {
                puhdistettu[k] = Number(v);
            }
        }
        if (Object.keys(puhdistettu).length === 0) {
            delete all[avain];
        } else {
            all[avain] = puhdistettu;
        }
        Storage.save(this.AVAIN_KUUKAUSI, all);
    },

    // Poista kuukauden ylikirjoitus (palauta oletukseen)
    poistaKuukausi(vuosi, kuukausi) {
        const all = this.kuukausiYlikirjoitukset();
        delete all[this.kuukausiAvain(vuosi, kuukausi)];
        Storage.save(this.AVAIN_KUUKAUSI, all);
    },

    // Palauta KAIKKI tehdasasetukset (poista myös oletukset-tallennus + kaikki kuukaudet)
    palautaOletuksiin() {
        Storage.save(this.AVAIN_OLETUS, null);
        Storage.save(this.AVAIN_KUUKAUSI, {});
    },
};
