// Säännöt — pohja-asetukset + kuukausikohtaiset ylikirjoitukset
// Pohja-asetukset:    miten kesä ja talvi käyttäytyy oletuksena
// Kuukausi-ylikirjoitus: yhden kuukauden omat arvot (esim. "kesäkuu 2026: 7 hlö")

const Rules = {
    AVAIN_OLETUS:    'rules-default',
    AVAIN_KUUKAUSI:  'rules-month-overrides',
    AVAIN_ERIKOIS:   'rules-special-arrangements',

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

    // ===== ERIKOISJÄRJESTELYT =====
    // Päivämääräväli (esim. Black Friday -viikko) joka YLIKIRJOITTAA kuukausi-ja oletusarvot.
    // Tallennusmuoto: [{ id, nimi, alku, loppu, asiakaspalveluMin, asiakaspalveluMax,
    //                    lahtoselvitysMin, lahtoselvitysMax, maxPerakkaiset }]

    erikoiset() {
        return Storage.load(this.AVAIN_ERIKOIS, []);
    },

    // Palauttaa erikoisjärjestelyn joka kattaa annetun päivän (tai null).
    // Jos useita kattaa saman päivän → otetaan ensimmäinen (uusimmat tallennetaan ensin).
    paivaErikoinen(paivaIso) {
        return this.erikoiset().find(e =>
            paivaIso >= e.alku && paivaIso <= e.loppu
        ) || null;
    },

    // Lisää uusi erikoisjärjestely. Jos asetukset.id annettu, päivitetään olemassaolevaa.
    tallennaErikois(asetukset) {
        const lista = this.erikoiset();
        const puhdas = {
            id: asetukset.id || ('e_' + Date.now()),
            nimi: asetukset.nimi || 'Erikoisjärjestely',
            alku: asetukset.alku,
            loppu: asetukset.loppu,
        };
        // Tallenna vain määritellyt numerokentät (tyhjä = käytetään alemman tason arvoa)
        const kentat = ['asiakaspalveluMin', 'asiakaspalveluMax',
                        'lahtoselvitysMin', 'lahtoselvitysMax', 'maxPerakkaiset'];
        for (const k of kentat) {
            const v = asetukset[k];
            if (v !== undefined && v !== null && v !== '') {
                puhdas[k] = Number(v);
            }
        }

        const indeksi = lista.findIndex(e => e.id === puhdas.id);
        if (indeksi >= 0) {
            lista[indeksi] = puhdas;
        } else {
            lista.unshift(puhdas);   // uusimmat ensin → ensisijaisuus jos päivät menevät päällekkäin
        }
        Storage.save(this.AVAIN_ERIKOIS, lista);
        return puhdas;
    },

    poistaErikois(id) {
        const lista = this.erikoiset().filter(e => e.id !== id);
        Storage.save(this.AVAIN_ERIKOIS, lista);
    },

    // ===== PÄIVÄKOHTAISET SÄÄNNÖT =====
    // Palauttaa täysin yhdistetyt säännöt päivälle.
    // Prioriteetti (vahvimmasta heikoimpaan):
    //   1. Erikoisjärjestely (jos päivä on välillä)
    //   2. Kuukausi-ylikirjoitus
    //   3. Kesä/talvi-oletus (pohja-asetukset → fallback SAANNOT)
    paivalle(paivaIso) {
        const vuosi = parseInt(paivaIso.substring(0, 4), 10);
        const kk    = parseInt(paivaIso.substring(5, 7), 10) - 1;   // 0-11
        const kuukausiSaannot = this.kuukaudelle(vuosi, kk);
        const erikois = this.paivaErikoinen(paivaIso);

        if (!erikois) return { ...kuukausiSaannot, erikois: null };

        // Yhdistä: erikois voittaa, mutta vain määritellyt kentät
        return {
            onKesa:           kuukausiSaannot.onKesa,
            asiakaspalveluMin: erikois.asiakaspalveluMin ?? kuukausiSaannot.asiakaspalveluMin,
            asiakaspalveluMax: erikois.asiakaspalveluMax ?? kuukausiSaannot.asiakaspalveluMax,
            lahtoselvitysMin:  erikois.lahtoselvitysMin  ?? kuukausiSaannot.lahtoselvitysMin,
            lahtoselvitysMax:  erikois.lahtoselvitysMax  ?? kuukausiSaannot.lahtoselvitysMax,
            maxPerakkaiset:    erikois.maxPerakkaiset    ?? kuukausiSaannot.maxPerakkaiset,
            erikois,            // viittaus erikoisjärjestelyyn, kalenterin UI:lle
        };
    },

    // Palauta KAIKKI tehdasasetukset (poista myös oletukset-tallennus + kaikki kuukaudet + erikoiset)
    palautaOletuksiin() {
        Storage.save(this.AVAIN_OLETUS, null);
        Storage.save(this.AVAIN_KUUKAUSI, {});
        Storage.save(this.AVAIN_ERIKOIS, []);
    },
};
