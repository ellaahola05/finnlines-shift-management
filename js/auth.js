// Pitää muistissa kuka on kirjautunut. localStorageen tallennettu user.id.
const Auth = {
    AVAIN: 'currentUserId',

    login(userId) {
        Storage.save(this.AVAIN, userId);
    },

    logout() {
        Storage.remove(this.AVAIN);
    },

    getCurrentUser() {
        const id = Storage.load(this.AVAIN);
        if (id === null) return null;
        return TYONTEKIJAT.find(t => t.id === id) || null;
    },
};
