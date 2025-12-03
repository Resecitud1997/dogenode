// Sistema de Wallet
const Wallet = {
    
    connected: false,
    address: null,
    type: null,

    // ==================
    // DETECCIÓN DE EXTENSIÓN
    // ==================

    checkExtension() {
        if (window.DogeNode && window.DogeNode.isExtensionInstalled()) {
            console.log('✅ Extensión DogeNode detectada');
            this.setupExtensionListeners();
            this.updateExtensionStatus(true);
            return true;
        } else {
            console.log('⚠️ Extensión DogeNode no detectada');
            this.updateExtensionStatus(false);
            return false;
        }
    },

    updateExtensionStatus(installed) {
        const alert = document.getElementById('extensionAlert');
        const footer = document.getElementById('extensionStatusFooter');

        if (installed) {
            if (alert) alert.style.display = 'none';
            if (footer) {
                footer.innerHTML = '<i class="fas fa-circle text-green-500 mr-2"></i>Extensión: Instalada';
            }
        } else {
            if (alert) alert.style.display = 'block';
            if (footer) {
                footer.innerHTML = '<i class="fas fa-circle text-red-500 mr-2"></i>Extensión: No detectada';
            }
        }
    },

    // ==================
    // LISTENERS DE EXTENSIÓN
    // ==================

    setupExtensionListeners() {
        if (window.DogeNode) {
            // Wallet conectada
            window.DogeNode.on('onWalletConnected', (wallet) => {
                console.log('Wallet conectada:', wallet);
                this.onWalletConnected(wallet);
            });

            // Wallet desconectada
            window.DogeNode.on('onWalletDisconnected', () => {
                console.log('Wallet desconectada');
                this.onWalletDisconnected();
            });

            // Balance actualizado
            window.DogeNode.on('onBalanceChanged', (balance) => {
                console.log('Balance actualizado:', balance);
                this.updateBalance(balance);
            });

            // Retiro completado
            window.DogeNode.on('onWithdrawal', (data) => {
                console.log('Retiro completado:', data);
                this.onWithdrawal(data);
            });
        }
    },

    // ==================
    // CONEXIÓN DE WALLET
    // ==================

    async connect(walletType = 'auto') {
        if (!this.checkExtension()) {
            Utils.showError('Por favor instala la extensión DogeNode primero');
            showExtensionInstructions();
            return false;
        }

        try {
            Utils.showInfo('Conectando wallet...');
            
            // Usar la API de la extensión
            const wallet = await window.DogeNode.connectWallet({ type: walletType });
            
            this.onWalletConnected(wallet);
            return true;
            
        } catch (error) {
            console.error('Error conectando wallet:', error);
            Utils.showError('Error al conectar la wallet. Intenta nuevamente.');
            return false;
        }
    },

    // ==================
    // EVENTOS DE WALLET
    // ==================

    onWalletConnected(wallet) {
        this.connected = true;
        this.address = wallet.address;
        this.type = wallet.walletType || 'unknown';

        // Guardar en storage
        Storage.saveWallet({
            address: this.address,
            type: this.type,
            connectedAt: new Date().toISOString()
        });

        // Actualizar UI
        this.updateWalletUI();

        // Sincronizar balance
        this.syncBalance();

        Utils.showSuccess('Wallet conectada exitosamente');
    },

    onWalletDisconnected() {
        this.connected = false;
        this.address = null;
        this.type = null;

        // Remover de storage
        Storage.removeWallet();

        // Actualizar UI
        this.updateWalletUI();

        Utils.showInfo('Wallet desconectada');
    },

    disconnect() {
        if (window.DogeNode) {
            window.DogeNode.disconnectWallet();
        }
        this.onWalletDisconnected();
    },

    // ==================
    // BALANCE
    // ==================

    async syncBalance() {
        try {
            if (window.DogeNode && this.connected) {
                const balance = await window.DogeNode.getBalance();
                this.updateBalance(balance);
            }
        } catch (error) {
            console.error('Error sincronizando balance:', error);
        }
    },

    updateBalance(balance) {
        const user = Storage.getUser();
        user.balance = balance;
        Storage.saveUser(user);
        
        // Actualizar UI
        App.updateStats();
    },

    // ==================
    // RETIROS
    // ==================

    async withdraw(toAddress, amount) {
        if (!this.connected) {
            Utils.showError('Debes conectar tu wallet primero');
            return false;
        }

        try {
            Utils.showInfo('Procesando retiro...');

            // Usar API de extensión
            const result = await window.DogeNode.withdraw(toAddress, amount);

            this.onWithdrawal(result);
            return true;

        } catch (error) {
            console.error('Error en retiro:', error);
            Utils.showError(error.message || 'Error al procesar el retiro');
            return false;
        }
    },

    onWithdrawal(data) {
        // Actualizar balance del usuario
        const user = Storage.getUser();
        user.balance -= data.amount;
        user.totalWithdrawals += 1;
        Storage.saveUser(user);

        // Guardar transacción
        Storage.addTransaction({
            type: 'withdrawal',
            amount: data.amount,
            toAddress: data.address,
            txHash: data.txHash,
            status: 'completed',
            explorerUrl: data.explorerUrl || `https://dogechain.info/tx/${data.txHash}`
        });

        // Actualizar UI
        App.updateStats();
        App.loadTransactions();

        Utils.showSuccess(`¡Retiro exitoso! ${data.amount} DOGE enviados`);
    },

    // ==================
    // UI
    // ==================

    updateWalletUI() {
        const walletStatus = document.getElementById('walletStatus');
        const walletConnected = document.getElementById('walletConnected');
        const navWalletText = document.getElementById('navWalletText');
        const walletAddressNav = document.getElementById('walletAddressNav');
        const connectedAddress = document.getElementById('connectedAddress');

        if (this.connected && this.address) {
            // Mostrar wallet conectada
            Utils.show('walletStatus');
            Utils.show('walletConnected');
            
            if (navWalletText) navWalletText.textContent = 'Gestionar';
            if (walletAddressNav) walletAddressNav.textContent = Utils.formatAddress(this.address);
            if (connectedAddress) connectedAddress.textContent = this.address;

        } else {
            // Mostrar wallet desconectada
            Utils.hide('walletStatus');
            Utils.hide('walletConnected');
            
            if (navWalletText) navWalletText.textContent = 'Conectar Wallet';
        }
    },

    // ==================
    // INFORMACIÓN
    // ==================

    getInfo() {
        return {
            connected: this.connected,
            address: this.address,
            type: this.type,
            formattedAddress: this.address ? Utils.formatAddress(this.address) : null
        };
    }
};

// Verificar extensión al cargar
document.addEventListener('DOMContentLoaded', () => {
    Wallet.checkExtension();
    
    // Verificar periódicamente
    setInterval(() => {
        Wallet.checkExtension();
    }, 3000);
});

// Escuchar cuando la extensión esté lista
window.addEventListener('dogenode:ready', () => {
    console.log('🔌 Extensión DogeNode lista');
    Wallet.checkExtension();
});

// Restaurar wallet si existe
const savedWallet = Storage.getWallet();
if (savedWallet) {
    Wallet.connected = true;
    Wallet.address = savedWallet.address;
    Wallet.type = savedWallet.type;
    Wallet.updateWalletUI();
}

console.log('💳 Sistema de wallet inicializado');