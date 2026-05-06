// Työntekijän näkymä — omat vuorot, lomatoiveet, sairasilmoitukset
const EmployeeView = {
    render(container) {
        const user = Auth.getCurrentUser();
        // Vain julkaistujen kuukausien vuorot näkyvät työntekijälle
        const omatVuorot = Shifts.julkaistutTyontekijalle(user.id)
            .sort((a, b) => a.paiva.localeCompare(b.paiva));
        const omatLomat = Leave.tyontekijalle(user.id)
            .sort((a, b) => b.luotu.localeCompare(a.luotu));

        const vuoroHtml = omatVuorot.length
            ? omatVuorot.map(v => {
                const t = VUOROTYYPIT[v.vuorotyyppi];
                return `<li><strong>${this.muotoilePvm(v.paiva)}</strong> — ${t.alku}–${t.loppu}</li>`;
            }).join('')
            : '<li class="tyhja">Ei julkaistuja vuoroja vielä.</li>';

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
                <h1>Hei, ${user.nimi}!</h1>
                <button id="logout">Kirjaudu ulos</button>
            </header>

            <h2>Omat vuorot</h2>
            <ul class="vuorolista">${vuoroHtml}</ul>

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

    muotoilePvm(iso) {
        const d = new Date(iso);
        const viikonpaivat = ['su','ma','ti','ke','to','pe','la'];
        return `${viikonpaivat[d.getDay()]} ${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`;
    },

    tilanNimi(tila) {
        return { odottaa: 'Odottaa', hyvaksytty: 'Hyväksytty', hylatty: 'Hylätty' }[tila] || tila;
    },
};
