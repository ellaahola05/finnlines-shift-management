// Työntekijän näkymä — oma kuukausikalenteri, lomatoiveet, sairasilmoitukset
const EmployeeView = {
    nykyinenVuosi: null,
    nykyinenKuukausi: null,

    render(container) {
        if (this.nykyinenVuosi === null) {
            const tanaan = new Date();
            this.nykyinenVuosi = tanaan.getFullYear();
            this.nykyinenKuukausi = tanaan.getMonth();
        }

        const user = Auth.getCurrentUser();
        const omatLomat = Leave.tyontekijalle(user.id)
            .sort((a, b) => b.luotu.localeCompare(a.luotu));

        const onJulkaistu = Shifts.onJulkaistu(this.nykyinenVuosi, this.nykyinenKuukausi);
        const tila = onJulkaistu
            ? '<span class="status status-julkaistu">✅ Julkaistu</span>'
            : '<span class="status status-luonnos">⏳ Ei vielä julkaistu</span>';

        const lomaHtml = omatLomat.length
            ? omatLomat.map(l => `
                <li>
                    <strong>${l.tyyppi === 'loma' ? 'Loma' : 'Sairas'}</strong>
                    ${this.muotoilePvm(l.alku)}${l.alku !== l.loppu ? ' – ' + this.muotoilePvm(l.loppu) : ''}
                    <span class="tila tila-${l.tila}">${this.tilanNimi(l.tila)}</span>
                </li>
            `).join('')
            : '<li class="tyhja">Ei pyyntöjä.</li>';

        container.innerHTML = `
            <header class="topbar">
                <div class="brand">
                    <img src="assets/finnlines-logo.svg" alt="Finnlines">
                    <div class="brand-divider"></div>
                    <span class="brand-app-name">Vuorohallinta</span>
                </div>
                <nav class="nav">
                    <span class="user-chip">${user.nimi}</span>
                    <button id="logout">Kirjaudu ulos</button>
                </nav>
            </header>
            <div class="page-header">
                <h1>Hei, ${user.nimi.split(' ')[0]}!</h1>
                <p class="muted">${this.roolinNimi(user.rooli)} · katso omat vuorosi ja pyydä lomaa</p>
            </div>

            <h2>Omat vuorot</h2>
            <div class="kuukausi-nav">
                <button id="edellinen">← Edellinen kuukausi</button>
                <strong>${this.kuukaudenNimi(this.nykyinenKuukausi)} ${this.nykyinenVuosi}</strong>
                <button id="seuraava">Seuraava kuukausi →</button>
            </div>
            <div class="toiminnot">${tila}</div>
            <div class="kuukausi-grid">
                <div class="paiva-otsikko">Ma</div>
                <div class="paiva-otsikko">Ti</div>
                <div class="paiva-otsikko">Ke</div>
                <div class="paiva-otsikko">To</div>
                <div class="paiva-otsikko">Pe</div>
                <div class="paiva-otsikko">La</div>
                <div class="paiva-otsikko">Su</div>
                ${this.kuukausiRuudukkoHtml(user.id, onJulkaistu)}
            </div>

            <h2>Pyydä lomaa</h2>
            <form id="loma-lomake" class="loma-lomake">
                <label>Alkupäivä: <input type="date" id="loma-alku" required></label>
                <label>Loppupäivä: <input type="date" id="loma-loppu" required></label>
                <button type="submit" class="ensisijainen">Lähetä pyyntö</button>
            </form>

            <h2>Sairasilmoitus</h2>
            <button id="sairas-nappi">Olen sairaana tänään</button>

            <h2>Omat pyynnöt</h2>
            <ul class="lomalista">${lomaHtml}</ul>
        `;

        document.getElementById('logout').addEventListener('click', () => {
            Auth.logout();
            App.render();
        });
        document.getElementById('edellinen').addEventListener('click', () => {
            this.siirry(-1);
            this.render(container);
        });
        document.getElementById('seuraava').addEventListener('click', () => {
            this.siirry(1);
            this.render(container);
        });

        document.getElementById('loma-lomake').addEventListener('submit', (e) => {
            e.preventDefault();
            const alku = document.getElementById('loma-alku').value;
            const loppu = document.getElementById('loma-loppu').value;
            if (alku > loppu) { alert('Alkupäivä ei voi olla loppupäivän jälkeen.'); return; }
            Leave.pyyda(user.id, alku, loppu);
            this.render(container);
        });

        document.getElementById('sairas-nappi').addEventListener('click', () => {
            const tanaan = new Date().toISOString().substring(0, 10);
            Leave.sairasilmoitus(user.id, tanaan);
            alert('Sairasilmoitus tallennettu. Esihenkilö saa tiedon.');
            this.render(container);
        });
    },

    kuukausiRuudukkoHtml(userId, onJulkaistu) {
        const ensimmainen = new Date(this.nykyinenVuosi, this.nykyinenKuukausi, 1);
        const erotusMaanantaista = (ensimmainen.getDay() + 6) % 7;
        const alku = new Date(this.nykyinenVuosi, this.nykyinenKuukausi, 1 - erotusMaanantaista);

        const solut = [];
        for (let i = 0; i < 42; i++) {
            const d = new Date(alku);
            d.setDate(alku.getDate() + i);
            solut.push(this.paivaSoluHtml(d, userId, onJulkaistu));
        }
        return solut.join('');
    },

    paivaSoluHtml(d, userId, onJulkaistu) {
        const iso = this.iso(d);
        const onTassaKuussa = d.getMonth() === this.nykyinenKuukausi;
        const onViikonloppu = d.getDay() === 0 || d.getDay() === 6;

        // Onko työntekijä lomalla/sairaana tänä päivänä?
        const lomat = Leave.tyontekijalle(userId).filter(l =>
            l.tila !== 'hylatty' && l.alku <= iso && iso <= l.loppu
        );
        const onLoma = lomat.some(l => l.tyyppi === 'loma');
        const onSairas = lomat.some(l => l.tyyppi === 'sairas');

        // Omat vuorot tänä päivänä — vain jos kuukausi julkaistu
        const omatVuorot = onJulkaistu
            ? Shifts.paivalle(iso).filter(v => v.tyontekijaId === userId)
            : [];

        const luokat = ['paiva-solu'];
        if (!onTassaKuussa) luokat.push('eri-kuukausi');
        if (onViikonloppu) luokat.push('viikonloppu');
        if (omatVuorot.length > 0) luokat.push('oma-vuoro');
        if (onLoma) luokat.push('loma-paiva');
        if (onSairas) luokat.push('sairas-paiva');

        let sisaltoHtml = '';
        if (onLoma) {
            const tila = lomat.find(l => l.tyyppi === 'loma').tila;
            sisaltoHtml = `<div class="merkki">🏖️ Loma${tila === 'odottaa' ? ' (odottaa)' : ''}</div>`;
        } else if (onSairas) {
            sisaltoHtml = `<div class="merkki">🤒 Sairas</div>`;
        } else if (omatVuorot.length > 0) {
            sisaltoHtml = omatVuorot.map(v => {
                const t = VUOROTYYPIT[v.vuorotyyppi];
                return `<div class="merkki">${t.alku}–${t.loppu}</div>`;
            }).join('');
        }

        return `
            <div class="${luokat.join(' ')}">
                <div class="paiva-numero">${d.getDate()}</div>
                ${sisaltoHtml}
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
        const viikonpaivat = ['su','ma','ti','ke','to','pe','la'];
        return `${viikonpaivat[d.getDay()]} ${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`;
    },

    iso(d) {
        const v = d.getFullYear();
        const k = String(d.getMonth() + 1).padStart(2, '0');
        const p = String(d.getDate()).padStart(2, '0');
        return `${v}-${k}-${p}`;
    },

    tilanNimi(tila) {
        return { odottaa: 'Odottaa', hyvaksytty: 'Hyväksytty', hylatty: 'Hylätty' }[tila] || tila;
    },

    roolinNimi(rooli) {
        return ({
            esihenkilo: 'Esihenkilö',
            yksilomyynti: 'Yksilömyynti',
            ryhmamyynti: 'Ryhmämyynti',
            satamahenkilokunta: 'Satamahenkilökunta',
        })[rooli] || rooli;
    },
};
