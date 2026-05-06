// Pääohjain
const App = {
    render() {
        const container = document.getElementById('app');
        const user = Auth.getCurrentUser();

        if (!user) {
            LoginView.render(container);
            return;
        }

        if (user.rooli === 'esihenkilo') {
            ManagerView.render(container);
            return;
        }

        // Tilapäinen — työntekijän näkymä tehdään seuraavassa tehtävässä
        container.innerHTML = `
            <h1>Tervetuloa, ${user.nimi}!</h1>
            <p>Roolisi: ${user.rooli}</p>
            <p><em>Työntekijän näkymä tulossa…</em></p>
            <button id="logout">Kirjaudu ulos</button>
        `;
        document.getElementById('logout').addEventListener('click', () => {
            Auth.logout();
            App.render();
        });
    },
};

document.addEventListener('DOMContentLoaded', () => App.render());
