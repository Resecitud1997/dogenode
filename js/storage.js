// Sistema de Almacenamiento Local
const Storage = {
    // Claves de almacenamiento
    KEYS: {
        USER_DATA: 'dogenode_user_data',
        WALLET_DATA: 'dogenode_wallet_data',
        EARNINGS: 'dogenode_earnings',
        TRANSACTIONS: 'dogenode_transactions',
        REFERRALS: 'dogenode_referrals',
        SETTINGS: 'dogenode_settings',
        SESSION: 'dogenode_session'
    },

    // Guardar datos
    set(key, value) {
        try {
            const data = JSON.stringify(value);
            localStorage.setItem(key, data);
            return true;
        } catch (error) {
            console.error('Error guardando en localStorage:', error);
            return false;
        }
    },

    // Obtener datos
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Error leyendo localStorage:', error);
            return defaultValue;
        }
    },

    // Eliminar datos
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error eliminando de localStorage:', error);
            return false;
        }
    },

    // Limpiar todo
    clear() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error limpiando localStorage:', error);
            return false;
        }
    },

    // ==================
    // MÉTODOS ESPECÍFICOS
    // ==================

    // Usuario
    getUser() {
        const defaultUser = {
            id: this.generateUserId(),
            balance: 0,
            totalEarnings: 0,
            todayEarnings: 0,
            totalWithdrawals: 0,
            referralCount: 0,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
        };
        return this.get(this.KEYS.USER_DATA, defaultUser);
    },

    saveUser(userData) {
        userData.lastActive = new Date().toISOString();
        return this.set(this.KEYS.USER_DATA, userData);
    },

    // Wallet
    getWallet() {
        return this.get(this.KEYS.WALLET_DATA, null);
    },

    saveWallet(walletData) {
        return this.set(this.KEYS.WALLET_DATA, walletData);
    },

    removeWallet() {
        return this.remove(this.KEYS.WALLET_DATA);
    },

    // Ganancias
    getEarnings() {
        return this.get(this.KEYS.EARNINGS, []);
    },

    addEarning(amount, source = 'mining') {
        const earnings = this.getEarnings();
        const earning = {
            id: Date.now(),
            amount: parseFloat(amount),
            source: source,
            timestamp: new Date().toISOString()
        };
        earnings.unshift(earning);
        
        // Mantener solo los últimos 1000 registros
        if (earnings.length > 1000) {
            earnings.splice(1000);
        }
        
        return this.set(this.KEYS.EARNINGS, earnings);
    },

    // Transacciones
    getTransactions() {
        return this.get(this.KEYS.TRANSACTIONS, []);
    },

    addTransaction(transaction) {
        const transactions = this.getTransactions();
        const tx = {
            id: Date.now(),
            ...transaction,
            timestamp: new Date().toISOString()
        };
        transactions.unshift(tx);
        
        // Mantener solo las últimas 500 transacciones
        if (transactions.length > 500) {
            transactions.splice(500);
        }
        
        return this.set(this.KEYS.TRANSACTIONS, transactions);
    },

    // Referidos
    getReferrals() {
        return this.get(this.KEYS.REFERRALS, {
            code: this.generateReferralCode(),
            referred: [],
            earnings: 0
        });
    },

    addReferral(referredUser) {
        const referrals = this.getReferrals();
        referrals.referred.push({
            id: referredUser,
            joinedAt: new Date().toISOString()
        });
        return this.set(this.KEYS.REFERRALS, referrals);
    },

    // Sesión
    getSession() {
        return this.get(this.KEYS.SESSION, {
            isActive: false,
            startedAt: null,
            bandwidth: 0,
            uptime: 0
        });
    },

    saveSession(sessionData) {
        return this.set(this.KEYS.SESSION, sessionData);
    },

    // Configuración
    getSettings() {
        return this.get(this.KEYS.SETTINGS, {
            notifications: true,
            autoStart: false,
            language: 'es',
            theme: 'light'
        });
    },

    saveSettings(settings) {
        return this.set(this.KEYS.SETTINGS, settings);
    },

    // ==================
    // UTILIDADES
    // ==================

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    generateReferralCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    // Exportar datos
    exportData() {
        const data = {};
        Object.entries(this.KEYS).forEach(([name, key]) => {
            data[name] = this.get(key);
        });
        return data;
    },

    // Importar datos
    importData(data) {
        try {
            Object.entries(data).forEach(([name, value]) => {
                const key = this.KEYS[name];
                if (key) {
                    this.set(key, value);
                }
            });
            return true;
        } catch (error) {
            console.error('Error importando datos:', error);
            return false;
        }
    }
};

// Inicializar usuario si no existe
if (!Storage.get(Storage.KEYS.USER_DATA)) {
    Storage.saveUser(Storage.getUser());
}

console.log('💾 Sistema de almacenamiento inicializado');