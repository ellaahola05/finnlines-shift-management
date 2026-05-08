// Esihenkilön päänäkymä — kuukausikalenteri + lomapyynnöt
const ManagerView = {
    nykyinenVuosi: null,
    nykyinenKuukausi: null, // 0-11
    nykyinenNakyma: 'tanaan', // 'tanaan' | 'kalenteri' | 'lomat' | 'toiveet' | 'poikkeukset' | 'henkilosto'
    hakuSana: '',

    render(container) {
        if (this.nykyinenVuosi === null) {
            const tanaan = new Date();
            this.nykyinenVuosi = tanaan.getFullYear();
            this.nykyinenKuukausi = tanaan.getMonth();
        }

        if (this.nykyinenNakyma === 'tanaan') {
            this.renderTanaan(container);
            return;
        }
        if (this.nykyinenNakyma === 'lomat') {
            this.renderLomat(container);
            return;
        }
        if (this.nykyinenNakyma === 'poikkeukset') {
            this.renderPoikkeukset(container);
            return;
        }
        if (this.nykyinenNakyma === 'henkilosto') {
            this.renderHenkilosto(container);
            return;
        }
        if (this.nykyinenNakyma === 'toiveet') {
            this.renderToiveet(container);
            return;
        }

        const onJulkaistu = Shifts.onJulkaistu(this.nykyinenVuosi, this.nykyinenKuukausi);
        const tila = onJulkaistu
            ? '<span class="status status-julkaistu">✅ Julkaistu</span>'
            : '<span class="status status-luonnos">📝 Luonnos</span>';

        const julkaiseNappi = onJulkaistu
            ? '<button id="peru-julkaisu">🔒 Peru julkaisu</button>'
            : '<button id="julkaise" class="ensisijainen">📢 Julkaise</button>';

        const ruudukko = this.kuukausiRuudukkoHtml();
        const odottavienMaara = Leave.odottavat().length;
        const lomaNappi = `<button id="nakyma-lomat">Lomapyynnöt${odottavienMaara > 0 ? ` (${odottavienMaara})` : ''}</button>`;

        container.innerHTML = `
            <header class="topbar">
                <div class="brand">
                    <img src="assets/finnlines-logo.svg" alt="Finnlines">
                    <div class="brand-divider"></div>
                    <span class="brand-app-name">Vuorohallinta</span>
                </div>
                <nav class="nav">
                    <button id="nakyma-tanaan">Tänään</button>
                    <button id="nakyma-kalenteri" class="ensisijainen">Kalenteri</button>
                    ${lomaNappi}
                    <button id="nakyma-toiveet">Toiveet${(() => { const n = Wishes.odottavat().length; return n > 0 ? ` (${n})` : ''; })()}</button>
                    <button id="nakyma-poikkeukset">Poikkeuspäivät</button>
                    <button id="nakyma-henkilosto">Henkilöstö</button>
                    <button id="logout">Kirjaudu ulos</button>
                </nav>
            </header>
            <div class="page-header">
                <h1>Esihenkilön näkymä</h1>
                <p class="muted">Suunnittele ja julkaise kuukauden vuorot.</p>
            </div>
            <div class="haku-rivi">
                <input type="text" id="haku-kentta" placeholder="🔍 Etsi työntekijää nimellä..." value="${this.hakuSana || ''}">
                ${this.hakuSana ? '<button id="haku-tyhjenna" class="haku-tyhjenna">Tyhjennä</button>' : ''}
                <div id="haku-yhteenveto" class="haku-yhteenveto">${this.hakuYhteenvetoHtml()}</div>
            </div>
            <div class="kuukausi-nav">
                <button id="edellinen">← Edellinen kuukausi</button>
                <strong>${this.kuukaudenNimi(this.nykyinenKuukausi)} ${this.nykyinenVuosi}</strong>
                <button id="seuraava">Seuraava kuukausi →</button>
            </div>
            <div class="toiminnot">
                ${tila}
                <button id="luo-vuorot" class="ensisijainen">🪄 Luo kuukauden vuorot</button>
                ${julkaiseNappi}
            </div>
            <div class="kuukausi-grid">
                <div class="paiva-otsikko">Ma</div>
                <div class="paiva-otsikko">Ti</div>
                <div class="paiva-otsikko">Ke</div>
                <div class="paiva-otsikko">To</div>
                <div class="paiva-otsikko">Pe</div>
                <div class="paiva-otsikko">La</div>
                <div class="paiva-otsikko">Su</div>
                ${ruudukko}
            </div>

            ${this.tuntiYhteenvetoHtml()}
        `;

        this.kiinnitaYhteisetTapahtumat(container);

        document.getElementById('edellinen').addEventListener('click', () => {
            this.siirry(-1);
            this.render(container);
        });
        document.getElementById('seuraava').addEventListener('click', () => {
            this.siirry(1);
            this.render(container);
        });
        document.getElementById('luo-vuorot').addEventListener('click', () => {
            const teksti = `Luodaanko vuorot kuukaudelle ${this.kuukaudenNimi(this.nykyinenKuukausi)} ${this.nykyinenVuosi}?\n\n• Lukitut vuorot (🔒) säilyvät\n• Muut vuorot luodaan uudelleen automatiikalla`;
            if (confirm(teksti)) {
                Shifts.luoKuukausi(this.nykyinenVuosi, this.nykyinenKuukausi, Exceptions.paivat());
                this.render(container);
            }
        });
        if (onJulkaistu) {
            document.getElementById('peru-julkaisu').addEventListener('click', () => {
                if (confirm('Perutaanko julkaisu? Työntekijät eivät enää näe vuoroja.')) {
                    Shifts.peruJulkaisu(this.nykyinenVuosi, this.nykyinenKuukausi);
                    this.render(container);
                }
            });
        } else {
            document.getElementById('julkaise').addEventListener('click', () => {
                if (confirm('Julkaistaanko kuukauden vuorot? Työntekijät näkevät ne tämän jälkeen.')) {
                    Shifts.julkaise(this.nykyinenVuosi, this.nykyinenKuukausi);
                    this.render(container);
                }
            });
        }

        // Päivän klikkaus → avaa muokkausmodaali
        container.querySelectorAll('.paiva-solu[data-paiva]').forEach(solu => {
            solu.addEventListener('click', () => {
                this.avaaPaivaEditori(solu.dataset.paiva, container);
            });
        });

        // Hakukenttä: kirjoittaminen päivittää korostuksen, säilyttää fokuksen
        const hakuInput = document.getElementById('haku-kentta');
        if (hakuInput) {
            hakuInput.addEventListener('input', (e) => {
                this.hakuSana = e.target.value;
                const pos = e.target.selectionStart;
                this.render(container);
                const uusi = document.getElementById('haku-kentta');
                if (uusi) {
                    uusi.focus();
                    uusi.setSelectionRange(pos, pos);
                }
            });
        }
        const tyhjennaBtn = document.getElementById('haku-tyhjenna');
        if (tyhjennaBtn) {
            tyhjennaBtn.addEventListener('click', () => {
                this.hakuSana = '';
                this.render(container);
            });
        }
    },

    hakuYhteenvetoHtml() {
        const haku = (this.hakuSana || '').trim().toLowerCase();
        if (!haku) return '';
        const osumat = TYONTEKIJAT.filter(t => t.nimi.toLowerCase().includes(haku));
        if (!osumat.length) return '<span class="muted">Ei osumia.</span>';

        return osumat.map(t => {
            const data = Shifts.tunnitKuukaudessa(t.id, this.nykyinenVuosi, this.nykyinenKuukausi);
            const vuoroMaara = Shifts.tyontekijalle(t.id).filter(v => {
                const d = new Date(v.paiva);
                return d.getFullYear() === this.nykyinenVuosi && d.getMonth() === this.nykyinenKuukausi;
            }).length;
            return `<span class="haku-tulos"><strong>${t.nimi}</strong> — ${vuoroMaara} vuoroa, ${this.muotoileTunnit(data.yhteensa)} h</span>`;
        }).join('');
    },

    renderLomat(container) {
        const odottavat = Leave.odottavat();
        const kaikki = Leave.kaikki().sort((a,b) => b.luotu.localeCompare(a.luotu));

        const odottavatHtml = odottavat.length
            ? odottavat.map(l => {
                const t = TYONTEKIJAT.find(x => x.id === l.tyontekijaId);
                return `
                    <li>
                        <strong>${t?.nimi || '?'}</strong>
                        ${this.muotoilePvm(l.alku)}${l.alku !== l.loppu ? ' – ' + this.muotoilePvm(l.loppu) : ''}
                        <button data-id="${l.id}" class="hyvaksy">Hyväksy</button>
                        <button data-id="${l.id}" class="hylkaa">Hylkää</button>
                    </li>
                `;
            }).join('')
            : '<li class="tyhja">Ei odottavia pyyntöjä.</li>';

        const kaikkiHtml = kaikki.map(l => {
            const t = TYONTEKIJAT.find(x => x.id === l.tyontekijaId);
            return `
                <li>
                    <strong>${t?.nimi || '?'}</strong>
                    (${l.tyyppi === 'loma' ? 'loma' : 'sairas'})
                    ${this.muotoilePvm(l.alku)}${l.alku !== l.loppu ? ' – ' + this.muotoilePvm(l.loppu) : ''}
                    <span class="tila tila-${l.tila}">${EmployeeView.tilanNimi(l.tila)}</span>
                </li>
            `;
        }).join('');

        container.innerHTML = `
            <header class="topbar">
                <div class="brand">
                    <img src="assets/finnlines-logo.svg" alt="Finnlines">
                    <div class="brand-divider"></div>
                    <span class="brand-app-name">Vuorohallinta</span>
                </div>
                <nav class="nav">
                    <button id="nakyma-tanaan">Tänään</button>
                    <button id="nakyma-kalenteri">Kalenteri</button>
                    <button id="nakyma-lomat" class="ensisijainen">Lomapyynnöt</button>
                    <button id="nakyma-toiveet">Toiveet${(() => { const n = Wishes.odottavat().length; return n > 0 ? ` (${n})` : ''; })()}</button>
                    <button id="nakyma-poikkeukset">Poikkeuspäivät</button>
                    <button id="nakyma-henkilosto">Henkilöstö</button>
                    <button id="logout">Kirjaudu ulos</button>
                </nav>
            </header>
            <div class="page-header">
                <h1>Lomapyynnöt</h1>
                <p class="muted">Hyväksy tai hylkää työntekijöiden lomatoiveita.</p>
            </div>

            <h2>Odottavat pyynnöt</h2>
            <ul class="lomalista">${odottavatHtml}</ul>

            <h2>Kaikki pyynnöt ja sairauspoissaolot</h2>
            <ul class="lomalista">${kaikkiHtml || '<li class="tyhja">Ei tietoja.</li>'}</ul>
        `;

        this.kiinnitaYhteisetTapahtumat(container);

        container.querySelectorAll('.hyvaksy').forEach(btn => {
            btn.addEventListener('click', () => {
                Leave.paivita(parseInt(btn.dataset.id, 10), 'hyvaksytty');
                this.render(container);
            });
        });
        container.querySelectorAll('.hylkaa').forEach(btn => {
            btn.addEventListener('click', () => {
                Leave.paivita(parseInt(btn.dataset.id, 10), 'hylatty');
                this.render(container);
            });
        });
    },

    kiinnitaYhteisetTapahtumat(container) {
        document.getElementById('logout').addEventListener('click', () => {
            Auth.logout();
            App.render();
        });
        document.getElementById('nakyma-tanaan').addEventListener('click', () => {
            this.nykyinenNakyma = 'tanaan';
            this.render(container);
        });
        document.getElementById('nakyma-kalenteri').addEventListener('click', () => {
            this.nykyinenNakyma = 'kalenteri';
            this.render(container);
        });
        document.getElementById('nakyma-lomat').addEventListener('click', () => {
            this.nykyinenNakyma = 'lomat';
            this.render(container);
        });
        document.getElementById('nakyma-poikkeukset').addEventListener('click', () => {
            this.nykyinenNakyma = 'poikkeukset';
            this.render(container);
        });
        document.getElementById('nakyma-henkilosto').addEventListener('click', () => {
            this.nykyinenNakyma = 'henkilosto';
            this.render(container);
        });
        document.getElementById('nakyma-toiveet').addEventListener('click', () => {
            this.nykyinenNakyma = 'toiveet';
            this.render(container);
        });
    },

    renderToiveet(container) {
        const odottavat = Wishes.odottavat();
        const kaikki = Wishes.kaikki().sort((a, b) => b.luotu.localeCompare(a.luotu));

        const toiveRivi = (w, naytaNapit) => {
            const t = TYONTEKIJAT.find(x => x.id === w.tyontekijaId);
            const ikoni = w.tyyppi === 'ei_kaytettavissa' ? '🔴' :
                          w.tyyppi === 'toivoo_toita' ? '🟢' :
                          w.tyyppi === 'etana' ? '🏠' : '💬';
            const tyyppiNimi = TOIVE_TYYPPI_NIMI[w.tyyppi] || w.tyyppi;
            const kommentti = w.kommentti ? ` <em class="kommentti">"${w.kommentti}"</em>` : '';
            const tilaMerkki = `<span class="tila tila-${w.tila}">${EmployeeView.tilanNimi(w.tila)}</span>`;
            const napit = naytaNapit
                ? `<button data-id="${w.id}" class="hyvaksy">Hyväksy</button>
                   <button data-id="${w.id}" class="hylkaa">Hylkää</button>`
                : '';
            return `
                <li>
                    <span class="toive-ikoni">${ikoni}</span>
                    <strong>${t?.nimi || '?'}</strong>
                    <span class="toive-tyyppi">${tyyppiNimi}</span>
                    ${this.muotoilePvm(w.alku)}${w.alku !== w.loppu ? ' – ' + this.muotoilePvm(w.loppu) : ''}
                    ${kommentti}
                    ${tilaMerkki}
                    ${napit}
                </li>
            `;
        };

        const odottavatHtml = odottavat.length
            ? odottavat.map(w => toiveRivi(w, true)).join('')
            : '<li class="tyhja">Ei odottavia toiveita.</li>';

        const kaikkiHtml = kaikki.length
            ? kaikki.map(w => toiveRivi(w, false)).join('')
            : '<li class="tyhja">Ei toiveita.</li>';

        container.innerHTML = `
            <header class="topbar">
                <div class="brand">
                    <img src="assets/finnlines-logo.svg" alt="Finnlines">
                    <div class="brand-divider"></div>
                    <span class="brand-app-name">Vuorohallinta</span>
                </div>
                <nav class="nav">
                    <button id="nakyma-tanaan">Tänään</button>
                    <button id="nakyma-kalenteri">Kalenteri</button>
                    <button id="nakyma-lomat">Lomapyynnöt</button>
                    <button id="nakyma-toiveet" class="ensisijainen">Toiveet${odottavat.length > 0 ? ` (${odottavat.length})` : ''}</button>
                    <button id="nakyma-poikkeukset">Poikkeuspäivät</button>
                    <button id="nakyma-henkilosto">Henkilöstö</button>
                    <button id="logout">Kirjaudu ulos</button>
                </nav>
            </header>

            <div class="page-header">
                <h1>Työvuorotoiveet</h1>
                <p class="muted">Käy läpi toiveet ennen vuorojen luomista. Hyväksytyt "en käytettävissä" -toiveet näkyvät automatiikassa kuten lomat.</p>
            </div>

            <h2>Odottavat hyväksyntää</h2>
            <ul class="lomalista">${odottavatHtml}</ul>

            <h2>Kaikki toiveet</h2>
            <ul class="lomalista">${kaikkiHtml}</ul>
        `;

        this.kiinnitaYhteisetTapahtumat(container);

        container.querySelectorAll('.hyvaksy').forEach(btn => {
            btn.addEventListener('click', () => {
                Wishes.paivita(parseFloat(btn.dataset.id), 'hyvaksytty');
                this.render(container);
            });
        });
        container.querySelectorAll('.hylkaa').forEach(btn => {
            btn.addEventListener('click', () => {
                Wishes.paivita(parseFloat(btn.dataset.id), 'hylatty');
                this.render(container);
            });
        });
    },

    renderHenkilosto(container) {
        // Ryhmittele työntekijät roolin mukaan
        const ryhmat = [
            { rooli: 'esihenkilo',          otsikko: 'Esihenkilö' },
            { rooli: 'asiakaspalvelu',      otsikko: 'Asiakaspalvelu' },
            { rooli: 'ryhmamyynti',         otsikko: 'Ryhmämyynti' },
            { rooli: 'satamahenkilokunta',  otsikko: 'Satamahenkilökunta' },
        ];

        const ryhmatHtml = ryhmat.map(r => {
            const tt = TYONTEKIJAT.filter(x => x.rooli === r.rooli);
            const lukumaara = tt.length;
            const liHtml = tt.length
                ? tt.map(t => {
                    const tyyppiNimi = TYYPPI_NIMI[t.tyyppi] || t.tyyppi;
                    const sop = t.sopimus || { viikkotunnit: 37.5 };
                    const sopimusTeksti = (sop.viikkotunnitMin && sop.viikkotunnitMin < sop.viikkotunnit)
                        ? `${sop.viikkotunnitMin}–${sop.viikkotunnit} h/vko`
                        : `${sop.viikkotunnit} h/vko`;
                    const etatyo = t.etatyo || 'ei';
                    const etatyoMerkki = etatyo === 'ei'
                        ? ''
                        : `<span class="etatyo-merkki etatyo-${etatyo}" title="${ETATYO_NIMI[etatyo].nimi}">${ETATYO_NIMI[etatyo].ikoni} ${ETATYO_NIMI[etatyo].nimi}</span>`;
                    const muokkaaNappi = `<button data-id="${t.id}" class="muokkaa-tt">Muokkaa</button>`;
                    const poistoNappi = Employees.onkoEsihenkilo(t.id)
                        ? '<span class="lukko" title="Esihenkilöä ei voi poistaa">🔒</span>'
                        : `<button data-id="${t.id}" class="hylkaa poista-tt">Poista</button>`;
                    return `
                        <li>
                            <div class="tt-rivi">
                                <strong>${t.nimi}</strong>
                                <span class="tila tila-info">${tyyppiNimi}</span>
                                <span class="sopimus-info">${sopimusTeksti}</span>
                                ${etatyoMerkki}
                            </div>
                            <div class="tt-napit">
                                ${muokkaaNappi}
                                ${poistoNappi}
                            </div>
                        </li>
                    `;
                }).join('')
                : '<li class="tyhja">Ei henkilöstöä tässä roolissa.</li>';

            return `
                <h2>${r.otsikko} <span class="lkm">(${lukumaara})</span></h2>
                <ul class="lomalista">${liHtml}</ul>
            `;
        }).join('');

        container.innerHTML = `
            <header class="topbar">
                <div class="brand">
                    <img src="assets/finnlines-logo.svg" alt="Finnlines">
                    <div class="brand-divider"></div>
                    <span class="brand-app-name">Vuorohallinta</span>
                </div>
                <nav class="nav">
                    <button id="nakyma-tanaan">Tänään</button>
                    <button id="nakyma-kalenteri">Kalenteri</button>
                    <button id="nakyma-lomat">Lomapyynnöt</button>
                    <button id="nakyma-toiveet">Toiveet${(() => { const n = Wishes.odottavat().length; return n > 0 ? ` (${n})` : ''; })()}</button>
                    <button id="nakyma-poikkeukset">Poikkeuspäivät</button>
                    <button id="nakyma-henkilosto" class="ensisijainen">Henkilöstö</button>
                    <button id="logout">Kirjaudu ulos</button>
                </nav>
            </header>
            <div class="page-header">
                <h1>Henkilöstö</h1>
                <p class="muted">Lisää tai poista työntekijöitä — yhteensä ${TYONTEKIJAT.length} henkilöä.</p>
            </div>

            <h2>Lisää uusi työntekijä</h2>
            <form id="henkilosto-lomake" class="loma-lomake">
                <label>Nimi: <input type="text" id="uusi-nimi" placeholder="Etunimi Sukunimi" required></label>
                <label>Rooli:
                    <select id="uusi-rooli" required>
                        <option value="asiakaspalvelu">Asiakaspalvelu</option>
                        <option value="ryhmamyynti">Ryhmämyynti</option>
                        <option value="satamahenkilokunta">Satamahenkilökunta</option>
                    </select>
                </label>
                <label>Tyyppi:
                    <select id="uusi-tyyppi" required>
                        <option value="vakituinen">Vakituinen</option>
                        <option value="maaraaikainen">Määräaikainen</option>
                        <option value="kesatyontekija">Kesätyöntekijä</option>
                    </select>
                </label>
                <label id="label-min" style="display:none">Vähintään h/vko: <input type="number" id="uusi-viikkotunnit-min" value="20" min="0" max="60" step="0.5"></label>
                <label>Enintään h/vko: <input type="number" id="uusi-viikkotunnit" value="37.5" min="0" max="60" step="0.5" required></label>
                <label>Etätyö:
                    <select id="uusi-etatyo" required>
                        <option value="ei">🚫 Ei etänä</option>
                        <option value="voi">🏠 Voi olla etänä</option>
                        <option value="aina">🌐 Aina etänä</option>
                    </select>
                </label>
                <button type="submit" class="ensisijainen">Lisää</button>
            </form>

            ${ryhmatHtml}
        `;

        this.kiinnitaYhteisetTapahtumat(container);

        // Auto-täyttö: kun tyyppi vaihtuu, päivitä tuntikentät ja näytä/piilota min-kenttä
        const tyyppiSelect = document.getElementById('uusi-tyyppi');
        const tunnitInput = document.getElementById('uusi-viikkotunnit');
        const minInput = document.getElementById('uusi-viikkotunnit-min');
        const labelMin = document.getElementById('label-min');

        const paivitaTyyppi = () => {
            const t = tyyppiSelect.value;
            if (t === 'vakituinen') {
                tunnitInput.value = '37.5';
                labelMin.style.display = 'none';
            } else {
                tunnitInput.value = '37.5';
                minInput.value = '20';
                labelMin.style.display = '';
            }
        };

        tyyppiSelect.addEventListener('change', paivitaTyyppi);
        paivitaTyyppi(); // alusta

        document.getElementById('henkilosto-lomake').addEventListener('submit', (e) => {
            e.preventDefault();
            const nimi = document.getElementById('uusi-nimi').value.trim();
            const rooli = document.getElementById('uusi-rooli').value;
            const tyyppi = document.getElementById('uusi-tyyppi').value;
            const etatyo = document.getElementById('uusi-etatyo').value;
            const viikkotunnit = parseFloat(tunnitInput.value) || 0;
            if (!nimi) return;
            const sopimus = { viikkotunnit };
            if (tyyppi !== 'vakituinen') {
                const min = parseFloat(minInput.value);
                if (!isNaN(min) && min > 0 && min < viikkotunnit) {
                    sopimus.viikkotunnitMin = min;
                }
            }
            Employees.lisaa(nimi, rooli, tyyppi, sopimus, etatyo);
            this.render(container);
        });

        container.querySelectorAll('.poista-tt').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id, 10);
                const t = TYONTEKIJAT.find(x => x.id === id);
                if (!t) return;
                if (confirm(`Poistetaanko työntekijä ${t.nimi}? Tämä ei poista olemassa olevia vuoroja.`)) {
                    Employees.poista(id);
                    this.render(container);
                }
            });
        });

        // Muokkaa-nappi avaa työntekijän muokkausmodaalin
        container.querySelectorAll('.muokkaa-tt').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id, 10);
                this.avaaTyontekijaEditori(id, container);
            });
        });
    },

    // ===== Työntekijän muokkausmodaali =====
    avaaTyontekijaEditori(tyontekijaId, parentContainer) {
        const t = TYONTEKIJAT.find(x => x.id === tyontekijaId);
        if (!t) return;

        const sop = t.sopimus || { viikkotunnit: 37.5 };
        const onEsihenkilo = Employees.onkoEsihenkilo(t.id);

        const modaali = document.createElement('div');
        modaali.className = 'modaali-tausta';
        document.body.appendChild(modaali);

        const sulje = () => {
            modaali.remove();
            this.render(parentContainer);
        };

        // Roolin valinta — esihenkilölle lukittu
        const rooliOptionit = [
            { v: 'asiakaspalvelu',     n: 'Asiakaspalvelu' },
            { v: 'ryhmamyynti',        n: 'Ryhmämyynti' },
            { v: 'satamahenkilokunta', n: 'Satamahenkilökunta' },
        ];
        const rooliHtml = onEsihenkilo
            ? `<input type="text" id="muokkaa-rooli" value="Esihenkilö" disabled>`
            : `<select id="muokkaa-rooli">${rooliOptionit.map(o =>
                `<option value="${o.v}"${t.rooli === o.v ? ' selected' : ''}>${o.n}</option>`).join('')}</select>`;

        modaali.innerHTML = `
            <div class="modaali" role="dialog">
                <header class="modaali-header">
                    <h2>Muokkaa: ${t.nimi}</h2>
                    <button class="sulje-modaali" title="Sulje">×</button>
                </header>

                <form id="muokkaa-lomake" class="muokkaa-lomake">
                    <label>Nimi: <input type="text" id="muokkaa-nimi" value="${t.nimi}" required></label>
                    <label>Rooli: ${rooliHtml}</label>
                    <label>Tyyppi:
                        <select id="muokkaa-tyyppi" ${onEsihenkilo ? 'disabled' : ''}>
                            <option value="vakituinen"${t.tyyppi==='vakituinen'?' selected':''}>Vakituinen</option>
                            <option value="maaraaikainen"${t.tyyppi==='maaraaikainen'?' selected':''}>Määräaikainen</option>
                            <option value="kesatyontekija"${t.tyyppi==='kesatyontekija'?' selected':''}>Kesätyöntekijä</option>
                        </select>
                    </label>
                    <label id="muokkaa-label-min" style="${t.tyyppi !== 'vakituinen' ? '' : 'display:none'}">
                        Vähintään h/vko:
                        <input type="number" id="muokkaa-viikkotunnit-min" value="${sop.viikkotunnitMin || 20}" min="0" max="60" step="0.5">
                    </label>
                    <label>Enintään h/vko:
                        <input type="number" id="muokkaa-viikkotunnit" value="${sop.viikkotunnit}" min="0" max="60" step="0.5" required>
                    </label>
                    <label>Etätyö:
                        <select id="muokkaa-etatyo">
                            <option value="ei"${(t.etatyo||'ei')==='ei'?' selected':''}>🚫 Ei etänä</option>
                            <option value="voi"${t.etatyo==='voi'?' selected':''}>🏠 Voi olla etänä</option>
                            <option value="aina"${t.etatyo==='aina'?' selected':''}>🌐 Aina etänä</option>
                        </select>
                    </label>
                    <div class="muokkaa-napit">
                        <button type="button" class="peruuta-modaali">Peruuta</button>
                        <button type="submit" class="ensisijainen">Tallenna muutokset</button>
                    </div>
                </form>
            </div>
        `;

        modaali.addEventListener('click', (e) => { if (e.target === modaali) sulje(); });
        modaali.querySelector('.sulje-modaali').addEventListener('click', sulje);
        modaali.querySelector('.peruuta-modaali').addEventListener('click', sulje);

        // Tyypin vaihtaminen näyttää/piilottaa min-tuntikentän
        const tyyppiSel = modaali.querySelector('#muokkaa-tyyppi');
        const labelMin = modaali.querySelector('#muokkaa-label-min');
        if (tyyppiSel) {
            tyyppiSel.addEventListener('change', () => {
                labelMin.style.display = tyyppiSel.value === 'vakituinen' ? 'none' : '';
            });
        }

        modaali.querySelector('#muokkaa-lomake').addEventListener('submit', (e) => {
            e.preventDefault();
            const paivitykset = {
                nimi: modaali.querySelector('#muokkaa-nimi').value.trim(),
                etatyo: modaali.querySelector('#muokkaa-etatyo').value,
            };
            if (!onEsihenkilo) {
                paivitykset.rooli = modaali.querySelector('#muokkaa-rooli').value;
                paivitykset.tyyppi = modaali.querySelector('#muokkaa-tyyppi').value;
            }
            const max = parseFloat(modaali.querySelector('#muokkaa-viikkotunnit').value) || 0;
            const min = parseFloat(modaali.querySelector('#muokkaa-viikkotunnit-min').value);
            const sopimus = { viikkotunnit: max };
            const tyyppi = paivitykset.tyyppi || t.tyyppi;
            if (tyyppi !== 'vakituinen' && !isNaN(min) && min > 0 && min < max) {
                sopimus.viikkotunnitMin = min;
            }
            paivitykset.sopimus = sopimus;
            Employees.paivita(t.id, paivitykset);
            sulje();
        });
    },

    renderPoikkeukset(container) {
        const rivit = Exceptions.kaikki();
        const rivitHtml = rivit.length
            ? rivit.map(r => `
                <li>
                    <strong>${this.muotoilePvm(r.paiva)}</strong>
                    — ${r.kuvaus}
                    <button data-paiva="${r.paiva}" class="hylkaa poista">Poista</button>
                </li>
            `).join('')
            : '<li class="tyhja">Ei poikkeuspäiviä.</li>';

        container.innerHTML = `
            <header class="topbar">
                <div class="brand">
                    <img src="assets/finnlines-logo.svg" alt="Finnlines">
                    <div class="brand-divider"></div>
                    <span class="brand-app-name">Vuorohallinta</span>
                </div>
                <nav class="nav">
                    <button id="nakyma-tanaan">Tänään</button>
                    <button id="nakyma-kalenteri">Kalenteri</button>
                    <button id="nakyma-lomat">Lomapyynnöt</button>
                    <button id="nakyma-toiveet">Toiveet${(() => { const n = Wishes.odottavat().length; return n > 0 ? ` (${n})` : ''; })()}</button>
                    <button id="nakyma-poikkeukset" class="ensisijainen">Poikkeuspäivät</button>
                    <button id="nakyma-henkilosto">Henkilöstö</button>
                    <button id="logout">Kirjaudu ulos</button>
                </nav>
            </header>
            <div class="page-header">
                <h1>Poikkeuspäivät</h1>
                <p class="muted">Päivät joina laiva ei lähde — vuoroja ei luoda näille päiville.</p>
            </div>

            <form id="poikkeus-lomake" class="loma-lomake">
                <label>Päivämäärä: <input type="date" id="poikkeus-paiva" required></label>
                <label>Kuvaus: <input type="text" id="poikkeus-kuvaus" placeholder="esim. Joulupäivä" required></label>
                <button type="submit" class="ensisijainen">Lisää</button>
            </form>

            <h2>Poikkeukset</h2>
            <ul class="lomalista">${rivitHtml}</ul>
        `;

        this.kiinnitaYhteisetTapahtumat(container);

        document.getElementById('poikkeus-lomake').addEventListener('submit', (e) => {
            e.preventDefault();
            const paiva = document.getElementById('poikkeus-paiva').value;
            const kuvaus = document.getElementById('poikkeus-kuvaus').value;
            Exceptions.lisaa(paiva, kuvaus);
            this.render(container);
        });

        container.querySelectorAll('.poista').forEach(btn => {
            btn.addEventListener('click', () => {
                Exceptions.poista(btn.dataset.paiva);
                this.render(container);
            });
        });
    },

    kuukausiRuudukkoHtml() {
        // 6 riviä × 7 saraketta = 42 päivää, alkaen edellisen kuun maanantaista
        const ensimmainen = new Date(this.nykyinenVuosi, this.nykyinenKuukausi, 1);
        const erotusMaanantaista = (ensimmainen.getDay() + 6) % 7;
        const alku = new Date(this.nykyinenVuosi, this.nykyinenKuukausi, 1 - erotusMaanantaista);

        const solut = [];
        for (let i = 0; i < 42; i++) {
            const d = new Date(alku);
            d.setDate(alku.getDate() + i);
            solut.push(this.paivaSoluHtml(d));
        }
        return solut.join('');
    },

    paivaSoluHtml(d) {
        const iso = this.iso(d);
        const onTassaKuussa = d.getMonth() === this.nykyinenKuukausi;
        const onViikonloppu = d.getDay() === 0 || d.getDay() === 6;
        const onPoikkeus = Exceptions.onkoPoikkeus(iso);

        const haku = (this.hakuSana || '').trim().toLowerCase();
        const vuorot = Shifts.paivalle(iso);
        const vuoroHtml = vuorot.map(v => {
            const tyontekija = TYONTEKIJAT.find(t => t.id === v.tyontekijaId);
            const aika = Shifts.aika(v);
            const lyhytNimi = tyontekija?.nimi.split(' ')[0] || '?';
            const lukko = v.lukittu ? '<span class="lukko-merkki" title="Lukittu">🔒</span>' : '';
            const etanaMerkki = v.etana ? '<span class="etana-merkki" title="Etänä">🏠</span>' : '';
            const onLahtoselvitys = v.lahtoselvitys || (v.vuorotyyppi || '').includes('lahtoselvitys');
            const lsMerkki = onLahtoselvitys ? '<span class="ls-merkki" title="Lähtöselvitys">🛂</span>' : '';
            const titleText = `${tyontekija?.nimi || '?'} — ${aika.alku}–${aika.loppu}${v.lukittu ? ' (lukittu)' : ''}${v.etana ? ' (etänä)' : ''}${onLahtoselvitys ? ' (lähtöselvitys)' : ''}`;
            const onOsuma = haku && tyontekija?.nimi.toLowerCase().includes(haku);
            const luokat = [];
            if (v.lukittu) luokat.push('lukittu-vuoro');
            if (v.etana) luokat.push('etana-vuoro');
            if (haku) luokat.push(onOsuma ? 'haku-osuma' : 'haku-himmea');
            return `<li class="${luokat.join(' ')}" title="${titleText}">${lukko}${etanaMerkki}${lyhytNimi}${lsMerkki}</li>`;
        }).join('');

        const luokat = ['paiva-solu', 'klikattava'];
        if (!onTassaKuussa) luokat.push('eri-kuukausi');
        if (onViikonloppu) luokat.push('viikonloppu');
        if (onPoikkeus) luokat.push('poikkeus');

        const poikkeusMerkki = onPoikkeus ? ' ⚠️' : '';

        return `
            <div class="${luokat.join(' ')}" data-paiva="${iso}" title="Klikkaa muokataksesi">
                <div class="paiva-numero">${d.getDate()}${poikkeusMerkki}</div>
                <ul>${vuoroHtml}</ul>
            </div>
        `;
    },

    siirry(suunta) {
        this.nykyinenKuukausi += suunta;
        if (this.nykyinenKuukausi < 0) {
            this.nykyinenKuukausi = 11;
            this.nykyinenVuosi--;
        } else if (this.nykyinenKuukausi > 11) {
            this.nykyinenKuukausi = 0;
            this.nykyinenVuosi++;
        }
    },

    kuukaudenNimi(kk) {
        return ['Tammikuu','Helmikuu','Maaliskuu','Huhtikuu','Toukokuu','Kesäkuu',
                'Heinäkuu','Elokuu','Syyskuu','Lokakuu','Marraskuu','Joulukuu'][kk];
    },

    muotoilePvm(iso) {
        const d = new Date(iso);
        return `${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`;
    },

    iso(d) {
        const v = d.getFullYear();
        const k = String(d.getMonth() + 1).padStart(2, '0');
        const p = String(d.getDate()).padStart(2, '0');
        return `${v}-${k}-${p}`;
    },

    // ===== Päivän muokkausmodaali =====

    avaaPaivaEditori(paivaIso, kalenteriContainer) {
        const modaali = document.createElement('div');
        modaali.className = 'modaali-tausta';
        document.body.appendChild(modaali);

        const sulje = () => {
            modaali.remove();
            this.render(kalenteriContainer);
        };

        const renderModaali = () => {
            const vuorot = Shifts.paivalle(paivaIso);
            const onPoikkeus = Exceptions.onkoPoikkeus(paivaIso);
            const otsikko = this.muotoileIsoPvm(paivaIso);

            const vuoroHtml = vuorot.length
                ? vuorot.map(v => {
                    const t = TYONTEKIJAT.find(x => x.id === v.tyontekijaId);
                    const tyyppiNimi = this.vuorotyypinNimi(v.vuorotyyppi);
                    const aika = Shifts.aika(v);
                    const mukautettu = (v.alku || v.loppu) ? '<span class="mukautettu-merkki" title="Aika muokattu">✏️</span>' : '';
                    const lukkoNappi = v.lukittu
                        ? `<button data-id="${v.id}" class="lukko-nappi lukittu" title="Lukittu — ei muutu uudelleenluonnissa. Klikkaa avataksesi lukon.">🔒</button>`
                        : `<button data-id="${v.id}" class="lukko-nappi" title="Avoinna — voi vaihtua uudelleenluonnissa. Klikkaa lukitaksesi.">🔓</button>`;
                    // Etätyö-toggle: lähtöselvitys-vuoroissa ei tarjota
                    const onLahtoselvitysVuoro = v.vuorotyyppi.includes('lahtoselvitys');
                    const etanaNappi = onLahtoselvitysVuoro
                        ? ''
                        : v.etana
                            ? `<button data-id="${v.id}" class="etana-nappi etana-aktiivinen" title="Etänä — klikkaa vaihtaaksesi paikan päälle">🏠</button>`
                            : `<button data-id="${v.id}" class="etana-nappi" title="Paikan päällä — klikkaa vaihtaaksesi etänä">🏢</button>`;

                    // Lähtöselvitys-toggle: asiakaspalvelu (aamu/lyhyt) ja satamavastaava — paikan päällä olevat
                    const voiTehdaLs = (
                        v.vuorotyyppi === 'asiakaspalvelu_aamu' ||
                        v.vuorotyyppi === 'asiakaspalvelu_lyhyt' ||
                        v.vuorotyyppi === 'satamavastaava'
                    );
                    const lsNappi = (voiTehdaLs && !v.etana)
                        ? v.lahtoselvitys
                            ? `<button data-id="${v.id}" class="ls-nappi ls-aktiivinen" title="Tekee lähtöselvityksen 12-14 — klikkaa poistaaksesi merkinnän">🛂</button>`
                            : `<button data-id="${v.id}" class="ls-nappi" title="Klikkaa merkitäksesi tämän vuoron tekemään lähtöselvityksen 12-14">🛂</button>`
                        : '';
                    return `
                        <li class="${v.lukittu ? 'vuoro-lukittu' : ''}${v.etana ? ' vuoro-etana' : ''}${v.lahtoselvitys ? ' vuoro-ls' : ''}">
                            ${lukkoNappi}
                            ${etanaNappi}
                            ${lsNappi}
                            <strong>${t?.nimi || '? (poistettu työntekijä)'}</strong>
                            <span class="vuoro-aika-muokkaus">
                                <input type="time" data-id="${v.id}" data-kentta="alku"  value="${aika.alku}"  class="muokkaa-aika">
                                <span class="aikaviiva">–</span>
                                <input type="time" data-id="${v.id}" data-kentta="loppu" value="${aika.loppu}" class="muokkaa-aika">
                                ${mukautettu}
                            </span>
                            <span class="vuoro-tyyppi-merkki">${tyyppiNimi}</span>
                            <button data-id="${v.id}" class="hylkaa poista-vuoro">Poista</button>
                        </li>
                    `;
                }).join('')
                : '<li class="tyhja">Ei vuoroja tänä päivänä.</li>';

            const poikkeusVaroitus = onPoikkeus
                ? `<div class="poikkeus-varoitus">⚠️ Tämä on poikkeuspäivä — laiva ei normaalisti lähde.</div>`
                : '';

            const tyontekijaOptions = TYONTEKIJAT
                .map(t => `<option value="${t.id}">${t.nimi} (${this.roolinNimi(t.rooli)})</option>`)
                .join('');

            modaali.innerHTML = `
                <div class="modaali" role="dialog">
                    <header class="modaali-header">
                        <h2>${otsikko}</h2>
                        <button class="sulje-modaali" title="Sulje">×</button>
                    </header>
                    ${poikkeusVaroitus}

                    <h3>Vuorot tänä päivänä</h3>
                    <ul class="lomalista vuorolista-modaali">${vuoroHtml}</ul>

                    <h3>Lisää vuoro</h3>
                    <form id="lisays-lomake" class="loma-lomake">
                        <label>Työntekijä:
                            <select id="lisays-tyontekija" required>${tyontekijaOptions}</select>
                        </label>
                        <label>Vuorotyyppi:
                            <select id="lisays-vuorotyyppi" required></select>
                        </label>
                        <label id="lisays-ls-label" class="checkbox-label" style="display:none">
                            <input type="checkbox" id="lisays-lahtoselvitys">
                            🛂 Tekee lähtöselvityksen 12–14
                        </label>
                        <button type="submit" class="ensisijainen">Lisää vuoro</button>
                    </form>
                </div>
            `;

            // Sulkemiset
            modaali.addEventListener('click', (e) => {
                if (e.target === modaali) sulje();
            });
            modaali.querySelector('.sulje-modaali').addEventListener('click', sulje);

            // Poistot
            modaali.querySelectorAll('.poista-vuoro').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (confirm('Poistetaanko vuoro?')) {
                        Shifts.poista(parseFloat(btn.dataset.id));
                        renderModaali();
                    }
                });
            });

            // Kellonajan muokkaus — lukitsee vuoron automaattisesti
            modaali.querySelectorAll('.muokkaa-aika').forEach(input => {
                input.addEventListener('change', () => {
                    const id = parseFloat(input.dataset.id);
                    const kentta = input.dataset.kentta;
                    Shifts.paivita(id, { [kentta]: input.value, lukittu: true });
                    renderModaali();
                });
            });

            // Lukon vaihto
            modaali.querySelectorAll('.lukko-nappi').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseFloat(btn.dataset.id);
                    const v = Shifts.kaikki().find(x => x.id === id);
                    if (!v) return;
                    Shifts.paivita(id, { lukittu: !v.lukittu });
                    renderModaali();
                });
            });

            // Etätyön vaihto — lukitaan automaattisesti, jotta säilyy uudelleenluonnissa
            modaali.querySelectorAll('.etana-nappi').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseFloat(btn.dataset.id);
                    const v = Shifts.kaikki().find(x => x.id === id);
                    if (!v) return;
                    Shifts.paivita(id, { etana: !v.etana, lukittu: true });
                    renderModaali();
                });
            });

            // Lähtöselvitys-merkinnän vaihto — lukitaan automaattisesti
            modaali.querySelectorAll('.ls-nappi').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseFloat(btn.dataset.id);
                    const v = Shifts.kaikki().find(x => x.id === id);
                    if (!v) return;
                    Shifts.paivita(id, { lahtoselvitys: !v.lahtoselvitys, lukittu: true });
                    renderModaali();
                });
            });

            // Vuorotyyppi-pudotusvalikko päivittyy työntekijän mukaan
            const tyontekijaSelect = modaali.querySelector('#lisays-tyontekija');
            const tyyppiSelect = modaali.querySelector('#lisays-vuorotyyppi');
            const lsLabel = modaali.querySelector('#lisays-ls-label');
            const lsCheckbox = modaali.querySelector('#lisays-lahtoselvitys');

            const paivitaTyyppiOptiot = () => {
                const id = parseInt(tyontekijaSelect.value, 10);
                const t = TYONTEKIJAT.find(x => x.id === id);
                if (!t) return;
                const validit = Object.entries(VUOROTYYPIT)
                    .filter(([k, v]) => v.rooli === t.rooli)
                    // Arkilähtöselvitys ei ole enää oma vuoro — käytä 'lähtöselvitys'-valintaruutua aamu/lyhyt-vuoroille
                    .filter(([k]) => k !== 'asiakaspalvelu_lahtoselvitys_arki');
                tyyppiSelect.innerHTML = validit.length
                    ? validit.map(([k, v]) => `<option value="${k}">${this.vuorotyypinNimi(k)} (${v.alku}–${v.loppu})</option>`).join('')
                    : '<option value="">Ei sopivia vuorotyyppejä tälle roolille</option>';
                paivitaLsNakyvyys();
            };

            const paivitaLsNakyvyys = () => {
                const tyyppi = tyyppiSelect.value;
                const voiTehdaLs = (
                    tyyppi === 'asiakaspalvelu_aamu' ||
                    tyyppi === 'asiakaspalvelu_lyhyt' ||
                    tyyppi === 'satamavastaava'
                );
                lsLabel.style.display = voiTehdaLs ? '' : 'none';
                if (!voiTehdaLs) lsCheckbox.checked = false;
            };

            tyontekijaSelect.addEventListener('change', paivitaTyyppiOptiot);
            tyyppiSelect.addEventListener('change', paivitaLsNakyvyys);
            paivitaTyyppiOptiot();

            // Lähetä lomake — manuaalinen lisäys lukitaan automaattisesti
            modaali.querySelector('#lisays-lomake').addEventListener('submit', (e) => {
                e.preventDefault();
                const tyontekijaId = parseInt(tyontekijaSelect.value, 10);
                const vuorotyyppi = tyyppiSelect.value;
                if (!vuorotyyppi) return;
                const lisat = { lukittu: true };
                if (lsCheckbox.checked) lisat.lahtoselvitys = true;
                Shifts.lisaa(paivaIso, tyontekijaId, vuorotyyppi, lisat);
                renderModaali();
            });
        };

        renderModaali();
    },

    vuorotyypinNimi(avain) {
        return ({
            esihenkilo:                          'Esihenkilö',
            ryhma:                               'Ryhmämyynti',
            satamavastaava:                      'Satamavastaava',
            asiakaspalvelu_aamu:                 'Aamuvuoro',
            asiakaspalvelu_lyhyt:                'Lyhyt vuoro',
            asiakaspalvelu_lahtoselvitys_arki:   'Lähtöselvitys (arki)',
            asiakaspalvelu_lahtoselvitys_vkl:    'Lähtöselvitys (vkl)',
        })[avain] || avain;
    },

    roolinNimi(rooli) {
        return ({
            esihenkilo:          'Esihenkilö',
            asiakaspalvelu:      'Asiakaspalvelu',
            ryhmamyynti:         'Ryhmämyynti',
            satamahenkilokunta:  'Satamahenkilökunta',
        })[rooli] || rooli;
    },

    muotoileIsoPvm(iso) {
        const d = new Date(iso);
        const viikonpaivat = ['Sunnuntai','Maanantai','Tiistai','Keskiviikko','Torstai','Perjantai','Lauantai'];
        return `${viikonpaivat[d.getDay()]} ${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`;
    },

    // ===== "Tänään"-näkymä — esimiehelle =====
    renderTanaan(container) {
        const odottavienMaara = Leave.odottavat().length;
        const lomaNappi = `<button id="nakyma-lomat">Lomapyynnöt${odottavienMaara > 0 ? ` (${odottavienMaara})` : ''}</button>`;

        container.innerHTML = `
            <header class="topbar">
                <div class="brand">
                    <img src="assets/finnlines-logo.svg" alt="Finnlines">
                    <div class="brand-divider"></div>
                    <span class="brand-app-name">Vuorohallinta</span>
                </div>
                <nav class="nav">
                    <button id="nakyma-tanaan" class="ensisijainen">Tänään</button>
                    <button id="nakyma-kalenteri">Kalenteri</button>
                    ${lomaNappi}
                    <button id="nakyma-toiveet">Toiveet${(() => { const n = Wishes.odottavat().length; return n > 0 ? ` (${n})` : ''; })()}</button>
                    <button id="nakyma-poikkeukset">Poikkeuspäivät</button>
                    <button id="nakyma-henkilosto">Henkilöstö</button>
                    <button id="logout">Kirjaudu ulos</button>
                </nav>
            </header>
            ${this.tanaanSisaltoHtml(true)}
        `;
        this.kiinnitaYhteisetTapahtumat(container);
    },

    // Yhteinen sisältö Tänään-näkymälle. naytaPoissaolot=true → näytetään loma/sairas/ei-käytettävissä-listat (esimies)
    tanaanSisaltoHtml(naytaPoissaolot) {
        const tanaan = this.tanaanIso();
        const d = new Date(tanaan);
        const otsikko = this.muotoileIsoPvm(tanaan);

        // Erityispiirteet
        const onPoikkeus = Exceptions.onkoPoikkeus(tanaan);
        const onViikonloppu = d.getDay() === 0 || d.getDay() === 6;
        let erityisHtml = '';
        if (onPoikkeus) {
            const p = Exceptions.kaikki().find(x => x.paiva === tanaan);
            erityisHtml = `<div class="erityisilmoitus erityis-poikkeus">⚠️ ${p?.kuvaus || 'Poikkeuspäivä'} — laiva ei lähde tänään</div>`;
        } else if (onViikonloppu) {
            erityisHtml = `<div class="erityisilmoitus erityis-vkl">📅 Viikonloppu — vain lähtöselvitys 12–15</div>`;
        } else {
            erityisHtml = `<div class="erityisilmoitus erityis-ok">✅ Normaali työpäivä</div>`;
        }

        // Vuorot ryhmiteltynä rooleittain
        const vuorot = Shifts.paivalle(tanaan);
        const ryhmat = [
            { rooli: 'esihenkilo',         otsikko: 'Esihenkilö' },
            { rooli: 'asiakaspalvelu',     otsikko: 'Asiakaspalvelu' },
            { rooli: 'ryhmamyynti',        otsikko: 'Ryhmämyynti' },
            { rooli: 'satamahenkilokunta', otsikko: 'Satamahenkilökunta' },
        ];

        const ryhmaHtml = ryhmat.map(r => {
            const ryhmaVuorot = vuorot.filter(v => {
                const tt = TYONTEKIJAT.find(x => x.id === v.tyontekijaId);
                return tt?.rooli === r.rooli;
            });
            if (!ryhmaVuorot.length) return '';

            const liHtml = ryhmaVuorot.map(v => {
                const tt = TYONTEKIJAT.find(x => x.id === v.tyontekijaId);
                const aika = Shifts.aika(v);
                const etanaIko = v.etana ? '<span class="tanaan-merkki" title="Etänä">🏠</span>' : '';
                const onLs = v.lahtoselvitys || (v.vuorotyyppi || '').includes('lahtoselvitys');
                const lsIko = onLs ? '<span class="tanaan-merkki" title="Lähtöselvitys">🛂</span>' : '';
                return `
                    <li>
                        <span class="tanaan-nimi">${tt?.nimi || '? (poistettu)'}</span>
                        <span class="tanaan-aika">${aika.alku}–${aika.loppu}</span>
                        ${etanaIko}${lsIko}
                    </li>
                `;
            }).join('');

            return `
                <div class="tanaan-rooli">
                    <h3>${r.otsikko} <span class="lkm">(${ryhmaVuorot.length})</span></h3>
                    <ul class="tanaan-lista">${liHtml}</ul>
                </div>
            `;
        }).join('');

        // Poissa-osio (vain esimiehelle)
        let poissaHtml = '';
        if (naytaPoissaolot) {
            const lomalla = TYONTEKIJAT.filter(t => Leave.kaikki().some(l =>
                l.tyontekijaId === t.id && l.tyyppi === 'loma' &&
                l.tila === 'hyvaksytty' && l.alku <= tanaan && tanaan <= l.loppu
            ));
            const sairaat = TYONTEKIJAT.filter(t => Leave.kaikki().some(l =>
                l.tyontekijaId === t.id && l.tyyppi === 'sairas' &&
                l.alku <= tanaan && tanaan <= l.loppu
            ));
            const eiKaytettavissa = TYONTEKIJAT.filter(t => Wishes.onkoEiKaytettavissa(t.id, tanaan));

            const yhteensa = lomalla.length + sairaat.length + eiKaytettavissa.length;
            const lista = (otsikko, ikoni, kuka) => kuka.length
                ? `<div class="poissa-ryhma"><h3>${ikoni} ${otsikko} (${kuka.length})</h3><ul class="tanaan-lista">${kuka.map(t => `<li><span class="tanaan-nimi">${t.nimi}</span></li>`).join('')}</ul></div>`
                : '';

            poissaHtml = `
                <section class="yhteenveto-osio poissa-osio">
                    <h2>Poissa tänään ${yhteensa > 0 ? `<span class="lkm">(${yhteensa})</span>` : ''}</h2>
                    ${yhteensa === 0 ? '<p class="muted">Kaikki ovat käytettävissä.</p>' : ''}
                    ${lista('Lomalla', '🏖️', lomalla)}
                    ${lista('Sairaslomalla', '🤒', sairaat)}
                    ${lista('Ei käytettävissä', '🔴', eiKaytettavissa)}
                </section>
            `;
        }

        return `
            <div class="page-header">
                <h1>Tänään</h1>
                <p class="muted">${otsikko}</p>
            </div>
            ${erityisHtml}
            <section class="yhteenveto-osio tanaan-osio">
                <h2>Töissä tänään ${vuorot.length > 0 ? `<span class="lkm">(${vuorot.length})</span>` : ''}</h2>
                ${ryhmaHtml || '<p class="muted">Ei vuoroja tänään.</p>'}
            </section>
            ${poissaHtml}
        `;
    },

    tanaanIso() {
        const d = new Date();
        const v = d.getFullYear();
        const k = String(d.getMonth() + 1).padStart(2, '0');
        const p = String(d.getDate()).padStart(2, '0');
        return `${v}-${k}-${p}`;
    },

    // Listaa kalenteriviikot (ISO) jotka ovat osittain tämän kuukauden sisällä
    viikotKuussa(vuosi, kuukausi) {
        const eka = new Date(vuosi, kuukausi, 1);
        const viim = new Date(vuosi, kuukausi + 1, 0);
        const viikot = new Set();
        for (let d = new Date(eka); d <= viim; d.setDate(d.getDate() + 1)) {
            viikot.add(Shifts.viikonNumero(d));
        }
        return Array.from(viikot).sort((a, b) => a - b);
    },

    // Värikoodi viikon tunneille (ok / alle / yli / tyhja)
    tuntiVari(tunnit, sop) {
        if (!tunnit) return 'tyhja';
        const max = sop.viikkotunnit;
        const min = sop.viikkotunnitMin || max;
        if (tunnit > max) return 'yli';
        if (tunnit < min) return 'alle';
        return 'ok';
    },

    sopimusTeksti(sop) {
        return (sop.viikkotunnitMin && sop.viikkotunnitMin < sop.viikkotunnit)
            ? `${sop.viikkotunnitMin}–${sop.viikkotunnit} h/vko`
            : `${sop.viikkotunnit} h/vko`;
    },

    tuntiYhteenvetoHtml() {
        const vuosi = this.nykyinenVuosi;
        const kk = this.nykyinenKuukausi;
        const viikot = this.viikotKuussa(vuosi, kk);

        // Ryhmittele rooleittain — sama järjestys kuin Henkilöstö-näkymässä
        const ryhmat = [
            { rooli: 'esihenkilo',         otsikko: 'Esihenkilö' },
            { rooli: 'asiakaspalvelu',     otsikko: 'Asiakaspalvelu' },
            { rooli: 'ryhmamyynti',        otsikko: 'Ryhmämyynti' },
            { rooli: 'satamahenkilokunta', otsikko: 'Satamahenkilökunta' },
        ];

        const viikkoOtsikot = viikot.map(v => `<th>Vko ${v}</th>`).join('');

        const rivitHtml = ryhmat.map(r => {
            const tt = TYONTEKIJAT.filter(x => x.rooli === r.rooli);
            if (!tt.length) return '';

            const ryhmaOtsikko = `<tr class="yhteenveto-ryhma"><th colspan="${3 + viikot.length}">${r.otsikko}</th></tr>`;

            const rivit = tt.map(t => {
                const sop = t.sopimus || { viikkotunnit: 37.5 };
                const data = Shifts.tunnitKuukaudessa(t.id, vuosi, kk);
                const viikkoSolut = viikot.map(vk => {
                    const x = data.viikot.find(d => d.vko === vk);
                    const tunnit = x ? x.tunnit : 0;
                    const vari = this.tuntiVari(tunnit, sop);
                    const teksti = tunnit ? this.muotoileTunnit(tunnit) : '–';
                    return `<td class="vko-solu vko-${vari}">${teksti}</td>`;
                }).join('');
                return `
                    <tr>
                        <td><strong>${t.nimi}</strong></td>
                        <td class="sopimus-sarake">${this.sopimusTeksti(sop)}</td>
                        <td class="yht-sarake">${this.muotoileTunnit(data.yhteensa)} h</td>
                        ${viikkoSolut}
                    </tr>
                `;
            }).join('');

            return ryhmaOtsikko + rivit;
        }).join('');

        return `
            <section class="yhteenveto-osio">
                <h2>Työtuntien yhteenveto</h2>
                <p class="muted">${this.kuukaudenNimi(kk)} ${vuosi} — vain tämän kuukauden tunnit, viikot lasketaan koko viikoltaan</p>
                <div class="yhteenveto-skroll">
                    <table class="yhteenveto-taulukko">
                        <thead>
                            <tr>
                                <th>Työntekijä</th>
                                <th>Sopimus</th>
                                <th>Yhteensä</th>
                                ${viikkoOtsikot}
                            </tr>
                        </thead>
                        <tbody>${rivitHtml}</tbody>
                    </table>
                </div>
                <div class="yhteenveto-selite">
                    <span class="vari-laatikko vko-ok"></span> Sopimuksessa
                    <span class="vari-laatikko vko-alle"></span> Alle minimin
                    <span class="vari-laatikko vko-yli"></span> Yli maksimin
                </div>
            </section>
        `;
    },

    muotoileTunnit(t) {
        if (Math.round(t * 2) === t * 2) {
            // Tasaluku tai .5 → näytä yhdellä desimaalilla
            return Number.isInteger(t) ? String(t) : t.toFixed(1);
        }
        return t.toFixed(1);
    },
};
