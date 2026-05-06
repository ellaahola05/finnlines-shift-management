// Esihenkilön päänäkymä — viikkokalenteri
const ManagerView = {
    nykyinenAlkuPaiva: null, // maanantain päivämäärä

    render(container) {
        if (!this.nykyinenAlkuPaiva) {
            this.nykyinenAlkuPaiva = this.viikonAlku(new Date());
        }

        const paivat = this.viikonPaivat(this.nykyinenAlkuPaiva);
        const paivaSarakkeet = paivat.map(p => this.paivaSarakeHtml(p)).join('');

        container.innerHTML = `
            <header class="topbar">
                <h1>Esihenkilön näkymä</h1>
                <button id="logout">Kirjaudu ulos</button>
            </header>
            <div class="viikko-nav">
                <button id="edellinen">← Edellinen viikko</button>
                <strong>${this.viikonOtsikko(paivat)}</strong>
                <button id="seuraava">Seuraava viikko →</button>
            </div>
            <div class="viikko-grid">
                ${paivaSarakkeet}
            </div>
        `;

        document.getElementById('logout').addEventListener('click', () => {
            Auth.logout();
            App.render();
        });
        document.getElementById('edellinen').addEventListener('click', () => {
            this.nykyinenAlkuPaiva = this.lisaaPaivia(this.nykyinenAlkuPaiva, -7);
            this.render(container);
        });
        document.getElementById('seuraava').addEventListener('click', () => {
            this.nykyinenAlkuPaiva = this.lisaaPaivia(this.nykyinenAlkuPaiva, 7);
            this.render(container);
        });
    },

    paivaSarakeHtml(paivaIso) {
        const vuorot = Shifts.paivalle(paivaIso);
        const vuoroHtml = vuorot.map(v => {
            const tyontekija = TYONTEKIJAT.find(t => t.id === v.tyontekijaId);
            const tyyppi = VUOROTYYPIT[v.vuorotyyppi];
            return `<li>${tyontekija?.nimi || '?'} <small>${tyyppi.alku}–${tyyppi.loppu}</small></li>`;
        }).join('');

        const pvm = new Date(paivaIso);
        const viikonpaiva = ['Su','Ma','Ti','Ke','To','Pe','La'][pvm.getDay()];
        return `
            <div class="paiva-sarake">
                <h3>${viikonpaiva} ${pvm.getDate()}.${pvm.getMonth()+1}.</h3>
                <ul>${vuoroHtml || '<li class="tyhja">Ei vuoroja</li>'}</ul>
            </div>
        `;
    },

    viikonAlku(paiva) {
        const d = new Date(paiva);
        const ero = (d.getDay() + 6) % 7; // ma=0
        d.setDate(d.getDate() - ero);
        return this.iso(d);
    },

    viikonPaivat(alku) {
        const tulokset = [];
        for (let i = 0; i < 7; i++) {
            tulokset.push(this.lisaaPaivia(alku, i));
        }
        return tulokset;
    },

    lisaaPaivia(iso, n) {
        const d = new Date(iso);
        d.setDate(d.getDate() + n);
        return this.iso(d);
    },

    iso(d) {
        const v = d.getFullYear();
        const k = String(d.getMonth() + 1).padStart(2, '0');
        const p = String(d.getDate()).padStart(2, '0');
        return `${v}-${k}-${p}`;
    },

    viikonOtsikko(paivat) {
        const a = new Date(paivat[0]);
        const l = new Date(paivat[6]);
        return `${a.getDate()}.${a.getMonth()+1}. – ${l.getDate()}.${l.getMonth()+1}.${l.getFullYear()}`;
    },
};
