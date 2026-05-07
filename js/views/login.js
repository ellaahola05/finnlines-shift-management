// Aloitusnäkymä — lista työntekijöistä. Klikkaa nimeä = "kirjaudu".
const LoginView = {
    render(container) {
        const tyontekijatHtml = TYONTEKIJAT.map(t => `
            <li>
                <button data-id="${t.id}" class="login-btn">
                    ${t.nimi}
                    <span class="rooli">${this.roolinNimi(t.rooli)}</span>
                </button>
            </li>
        `).join('');

        container.innerHTML = `
            <div class="login-hero">
                <img src="assets/finnlines-logo.svg" alt="Finnlines" class="hero-logo">
                <h1>Vuorohallinta</h1>
                <p>Matkustajaliikenteen asiakaspalvelu — valitse kuka olet</p>
            </div>
            <ul class="login-list">${tyontekijatHtml}</ul>
        `;

        container.querySelectorAll('.login-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id, 10);
                Auth.login(id);
                App.render();
            });
        });
    },

    roolinNimi(rooli) {
        const nimet = {
            esihenkilo: 'Esihenkilö',
            asiakaspalvelu: 'Asiakaspalvelu',
            ryhmamyynti: 'Ryhmämyynti',
            satamahenkilokunta: 'Satamahenkilökunta',
        };
        return nimet[rooli] || rooli;
    },
};
