// Työntekijän näkymä — omat vuorot listana
const EmployeeView = {
    render(container) {
        const user = Auth.getCurrentUser();
        // Vain julkaistujen kuukausien vuorot näkyvät työntekijälle
        const omatVuorot = Shifts.julkaistutTyontekijalle(user.id)
            .sort((a, b) => a.paiva.localeCompare(b.paiva));

        const vuoroHtml = omatVuorot.length
            ? omatVuorot.map(v => {
                const t = VUOROTYYPIT[v.vuorotyyppi];
                return `<li><strong>${this.muotoilePvm(v.paiva)}</strong> — ${t.alku}–${t.loppu}</li>`;
            }).join('')
            : '<li class="tyhja">Ei julkaistuja vuoroja vielä.</li>';

        container.innerHTML = `
            <header class="topbar">
                <h1>Hei, ${user.nimi}!</h1>
                <button id="logout">Kirjaudu ulos</button>
            </header>
            <h2>Omat vuorot</h2>
            <ul class="vuorolista">${vuoroHtml}</ul>
        `;

        document.getElementById('logout').addEventListener('click', () => {
            Auth.logout();
            App.render();
        });
    },

    muotoilePvm(iso) {
        const d = new Date(iso);
        const viikonpaivat = ['su','ma','ti','ke','to','pe','la'];
        return `${viikonpaivat[d.getDay()]} ${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`;
    },
};
