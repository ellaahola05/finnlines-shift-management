// Esihenkilön päänäkymä — kuukausikalenteri
const ManagerView = {
    nykyinenVuosi: null,
    nykyinenKuukausi: null, // 0-11

    render(container) {
        if (this.nykyinenVuosi === null) {
            const tanaan = new Date();
            this.nykyinenVuosi = tanaan.getFullYear();
            this.nykyinenKuukausi = tanaan.getMonth();
        }

        const onJulkaistu = Shifts.onJulkaistu(this.nykyinenVuosi, this.nykyinenKuukausi);
        const tila = onJulkaistu
            ? '<span class="status status-julkaistu">✅ Julkaistu</span>'
            : '<span class="status status-luonnos">📝 Luonnos</span>';

        const julkaiseNappi = onJulkaistu
            ? '<button id="peru-julkaisu">🔒 Peru julkaisu</button>'
            : '<button id="julkaise" class="ensisijainen">📢 Julkaise</button>';

        const ruudukko = this.kuukausiRuudukkoHtml();

        container.innerHTML = `
            <header class="topbar">
                <h1>Esihenkilön näkymä</h1>
                <button id="logout">Kirjaudu ulos</button>
            </header>
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
        document.getElementById('luo-vuorot').addEventListener('click', () => {
            const teksti = `Luodaanko vuorot kuukaudelle ${this.kuukaudenNimi(this.nykyinenKuukausi)} ${this.nykyinenVuosi}? Olemassa olevat vuorot tältä kuukaudelta korvataan.`;
            if (confirm(teksti)) {
                Shifts.luoKuukausi(this.nykyinenVuosi, this.nykyinenKuukausi);
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

        const vuorot = Shifts.paivalle(iso);
        const vuoroHtml = vuorot.map(v => {
            const tyontekija = TYONTEKIJAT.find(t => t.id === v.tyontekijaId);
            const tyyppi = VUOROTYYPIT[v.vuorotyyppi];
            const lyhytNimi = tyontekija?.nimi.split(' ')[0] || '?';
            return `<li title="${tyontekija?.nimi || '?'} — ${tyyppi.alku}–${tyyppi.loppu}">${lyhytNimi}</li>`;
        }).join('');

        const luokat = ['paiva-solu'];
        if (!onTassaKuussa) luokat.push('eri-kuukausi');
        if (onViikonloppu) luokat.push('viikonloppu');

        return `
            <div class="${luokat.join(' ')}">
                <div class="paiva-numero">${d.getDate()}</div>
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

    iso(d) {
        const v = d.getFullYear();
        const k = String(d.getMonth() + 1).padStart(2, '0');
        const p = String(d.getDate()).padStart(2, '0');
        return `${v}-${k}-${p}`;
    },
};
