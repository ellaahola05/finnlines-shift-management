// Alkudata — työntekijät, roolit, säännöt
const TYONTEKIJAT = [
    // Esihenkilö
    { id: 1, nimi: 'Esihenkilö Esimerkki', rooli: 'esihenkilo', tyyppi: 'vakituinen' },

    // Asiakaspalvelu — vakituiset (7)
    { id: 2, nimi: 'Anna Aalto', rooli: 'asiakaspalvelu', tyyppi: 'vakituinen' },
    { id: 3, nimi: 'Bertta Berg', rooli: 'asiakaspalvelu', tyyppi: 'vakituinen' },
    { id: 4, nimi: 'Cecilia Castrén', rooli: 'asiakaspalvelu', tyyppi: 'vakituinen' },
    { id: 5, nimi: 'Daniel Dahl', rooli: 'asiakaspalvelu', tyyppi: 'vakituinen' },
    { id: 6, nimi: 'Eeva Eriksson', rooli: 'asiakaspalvelu', tyyppi: 'vakituinen' },
    { id: 7, nimi: 'Fanny Forsman', rooli: 'asiakaspalvelu', tyyppi: 'vakituinen' },
    { id: 8, nimi: 'Gustav Granlund', rooli: 'asiakaspalvelu', tyyppi: 'vakituinen' },

    // Asiakaspalvelu — kesätyöntekijät (3)
    { id: 9, nimi: 'Helmi Heikkinen', rooli: 'asiakaspalvelu', tyyppi: 'kesatyontekija' },
    { id: 10, nimi: 'Iida Ihalainen', rooli: 'asiakaspalvelu', tyyppi: 'kesatyontekija' },
    { id: 11, nimi: 'Joonas Jokinen', rooli: 'asiakaspalvelu', tyyppi: 'kesatyontekija' },

    // Ryhmämyynti (4)
    { id: 12, nimi: 'Kaisa Kallio', rooli: 'ryhmamyynti', tyyppi: 'vakituinen' },
    { id: 13, nimi: 'Lauri Laine', rooli: 'ryhmamyynti', tyyppi: 'vakituinen' },
    { id: 14, nimi: 'Maria Manninen', rooli: 'ryhmamyynti', tyyppi: 'vakituinen' },
    { id: 15, nimi: 'Niko Niemi', rooli: 'ryhmamyynti', tyyppi: 'vakituinen' },

    // Satamahenkilökunta (2) — yksi heistä satamavastaavana per laivapäivä, 5 pv rotaatio
    { id: 16, nimi: 'Olli Oksanen', rooli: 'satamahenkilokunta', tyyppi: 'vakituinen' },
    { id: 17, nimi: 'Pekka Peltonen', rooli: 'satamahenkilokunta', tyyppi: 'vakituinen' },
];

// Vuorotyypit
const VUOROTYYPIT = {
    asiakaspalvelu_aamu: { alku: '09:00', loppu: '17:00', rooli: 'asiakaspalvelu' },
    asiakaspalvelu_lyhyt: { alku: '09:00', loppu: '15:00', rooli: 'asiakaspalvelu' },
    asiakaspalvelu_lahtoselvitys_arki: { alku: '12:00', loppu: '14:00', rooli: 'asiakaspalvelu' },
    asiakaspalvelu_lahtoselvitys_vkl: { alku: '12:00', loppu: '15:00', rooli: 'asiakaspalvelu' },
    ryhma: { alku: '08:00', loppu: '16:00', rooli: 'ryhmamyynti' },
    esihenkilo: { alku: '09:00', loppu: '17:00', rooli: 'esihenkilo' },
    satamavastaava: { alku: '08:00', loppu: '16:00', rooli: 'satamahenkilokunta' },
};

// Säännöt
const SAANNOT = {
    maxPerakkaisetTyopaivat: 5,
    kesakuukaudet: [5, 6, 7, 8], // touko-elokuu
    kesaAsiakaspalveluMin: 6,
    kesaAsiakaspalveluMax: 8,
    kesaLahtoselvitysMin: 2,
    kesaLahtoselvitysMax: 3,
    talviAsiakaspalveluMin: 3,
    talviAsiakaspalveluMax: 5,
    talviLahtoselvitysMin: 1,
    talviLahtoselvitysMax: 2,
    satamavastaavaRotaatioPaivat: 5, // vaihtuu noin 5 päivän välein
};
