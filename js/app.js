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
        } else {
            EmployeeView.render(container);
        }
    },
};

document.addEventListener('DOMContentLoaded', () => {
    Employees.init();
    App.render();
});
