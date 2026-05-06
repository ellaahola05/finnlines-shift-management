// Pääohjain
const App = {
    render() {
        const container = document.getElementById('app');
        const user = Auth.getCurrentUser();

        if (!user) {
            LoginView.render(container);
            return;
        }

        // Tilapäinen — vaiheessa 2 tehdään oikeat näkymät
        container.innerHTML = `
            <h1>Tervetuloa, ${user.nimi}!</h1>
            <p>Roolisi: ${user.rooli}</p>
            <button id="logout">Kirjaudu ulos</button>
        `;
        document.getElementById('logout').addEventListener('click', () => {
            Auth.logout();
            App.render();
        });
    },
};

document.addEventListener('DOMContentLoaded', () => App.render());
