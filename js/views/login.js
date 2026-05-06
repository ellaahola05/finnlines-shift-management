// Aloitusnäkymä — lista työntekijöistä. Klikkaa nimeä = "kirjaudu".
const LoginView = {
    render(container) {
        const tyontekijatHtml = TYONTEKIJAT.map(t => `
            <li>
                <button data-id="${t.id}" class="login-btn">
                    ${t.nimi}
                    <span class="rooli">(${this.roolinNimi(t.rooli)})</span>
                </button>
            </li>
        `).join('');

        container.innerHTML = `
            <h1>Finnlines vuorohallinta</h1>
            <p>Valitse kuka olet:</p>
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
            yksilomyynti: 'Yksilömyynti',
            ryhmamyynti: 'Ryhmämyynti',
        };
        return nimet[rooli] || rooli;
    },
};
