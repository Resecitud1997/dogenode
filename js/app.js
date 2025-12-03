// Aplicación Principal
const App = {
    
    // Estado de minería
    mining: {
        active: false,
        startTime: null,
        uptime: 0,
        bandwidth: 0,
        earnings: 0
    },

    // Intervalos
    intervals: {
        mining: null,
        uptime: null,
        sync: null
    },

    // Precio de DOGE (simulado)
    dogePrice: 0.08,

    // ==================
    // INICIALIZACIÓN
    // ==================

    init() {
        console.log('🚀 Inicializando DogeNode...');

        // Ocultar loading screen
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('mainApp').classList.remove('hidden');
        }, 1500);

        // Cargar datos
        this.loadUserData();
        this.updateStats();
        this.loadTransactions();
        this.setupEventListeners();
        this.setupReferralSystem();

        // Restaurar sesión de minería si existe
        const session = Storage.getSession();
        if (session.isActive) {
            this.startMining();
        }

        // Actualizar precio de DOGE
        this.updateDogePrice();

        console.log('✅ DogeNode inicializado correctamente');
    },

    // ==================
    // DATOS DE USUARIO
    // ==================

    loadUserData() {
        const user = Storage.getUser();
        
        // Resetear ganancias del día si es necesario
        const lastActive = new Date(user.lastActive);
        const today = new Date();
        if (lastActive.getDate() !== today.getDate()) {
            user.todayEarnings = 0;
            Storage.saveUser(user);
        }

        return user;
    },

    // ==================
    // ACTUALIZAR ESTADÍSTICAS
    // ==================

    updateStats() {
        const user = Storage.getUser();
        const session = Storage.getSession();

        // Actualizar displays principales
        Utils.setText('totalEarnings', Utils.formatDogeShort(user.totalEarnings));
        Utils.setText('availableBalance', Utils.formatDogeShort(user.balance));
        Utils.setText('todayEarnings', Utils.formatDogeShort(user.todayEarnings));
        Utils.setText('totalWithdrawals', user.totalWithdrawals);
        Utils.setText('mainBalance', Utils.formatDogeShort(user.balance));
        Utils.setText('balanceUSD', `≈ ${Utils.formatUSD(Utils.calculateDogeToUSD(user.balance, this.dogePrice))}`);

        // Actualizar stats de minería
        Utils.setText('bandwidth', session.bandwidth.toFixed(0));
        Utils.setText('uptime', Utils.formatTime(session.uptime));
        Utils.setText('referrals', user.referralCount);

        // Actualizar modal de retiro
        const modalAvailable = document.getElementById('modalAvailable');
        if (modalAvailable) {
            modalAvailable.textContent = Utils.formatDogeShort(user.balance);
        }
    },

    // ==================
    // SISTEMA DE MINERÍA
    // ==================

    toggleMining() {
        if (this.mining.active) {
            this.stopMining();
        } else {
            this.startMining();
        }
    },

    startMining() {
        if (this.mining.active) return;

        this.mining.active = true;
        this.mining.startTime = Date.now();

        const session = Storage.getSession();
        session.isActive = true;
        session.startedAt = new Date().toISOString();
        Storage.saveSession(session);

        // Actualizar UI
        const button = document.getElementById('miningToggle');
        const text = document.getElementById('miningText');
        const status = document.getElementById('miningStatus');

        button.classList.add('active');
        text.textContent = 'Detener Minería';
        status.classList.remove('hidden');

        // Iniciar contadores
        this.intervals.mining = setInterval(() => {
            this.processMining();
        }, 2000);

        this.intervals.uptime = setInterval(() => {
            this.updateUptime();
        }, 1000);

        Utils.showSuccess('¡Minería iniciada! Comenzando a ganar DOGE...');
    },

    stopMining() {
        if (!this.mining.active) return;

        this.mining.active = false;

        const session = Storage.getSession();
        session.isActive = false;
        Storage.saveSession(session);

        // Limpiar intervalos
        if (this.intervals.mining) clearInterval(this.intervals.mining);
        if (this.intervals.uptime) clearInterval(this.intervals.uptime);

        // Actualizar UI
        const button = document.getElementById('miningToggle');
        const text = document.getElementById('miningText');
        const status = document.getElementById('miningStatus');

        button.classList.remove('active');
        text.textContent = 'Comenzar a Ganar';
        status.classList.add('hidden');

        Utils.showInfo('Minería detenida');
    },

    processMining() {
        const user = Storage.getUser();
        const session = Storage.getSession();

        // Generar ganancias aleatorias (0.1 - 0.5 DOGE cada 2 segundos)
        const earning = Utils.random(0.1, 0.5);
        
        // Actualizar balances
        user.balance += earning;
        user.totalEarnings += earning;
        user.todayEarnings += earning;
        Storage.saveUser(user);

        // Guardar ganancia
        Storage.addEarning(earning, 'mining');

        // Actualizar bandwidth simulado
        const bandwidth = Utils.random(20, 50);
        session.bandwidth += bandwidth;
        Storage.saveSession(session);

        // Actualizar stats
        this.updateStats();
    },

    updateUptime() {
        const session = Storage.getSession();
        session.uptime += 1;
        Storage.saveSession(session);

        Utils.setText('uptime', Utils.formatTime(session.uptime));
    },

    // ==================
    // TRANSACCIONES
    // ==================

    loadTransactions() {
        const transactions = Storage.getTransactions();
        const container = document.getElementById('transactionsList');

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-400">
                    <i class="fas fa-inbox text-6xl mb-4"></i>
                    <p>No hay transacciones todavía</p>
                </div>
            `;
            return;
        }

        // Mostrar últimas 5 transacciones
        const recent = transactions.slice(0, 5);
        
        container.innerHTML = recent.map(tx => `
            <div class="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition border-b border-gray-100 last:border-0">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 ${tx.type === 'withdrawal' ? 'bg-red-100' : 'bg-green-100'} rounded-full flex items-center justify-center">
                        <i class="fas ${tx.type === 'withdrawal' ? 'fa-arrow-up text-red-500' : 'fa-arrow-down text-green-500'} text-xl"></i>
                    </div>
                    <div>
                        <p class="font-semibold text-gray-800">
                            ${tx.type === 'withdrawal' ? 'Retiro' : 'Depósito'}
                        </p>
                        <p class="text-sm text-gray-500">${Utils.formatDateShort(tx.timestamp)}</p>
                        ${tx.txHash ? `<p class="text-xs text-gray-400 font-mono">${tx.txHash.substring(0, 16)}...</p>` : ''}
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-bold ${tx.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}">
                        ${tx.type === 'withdrawal' ? '-' : '+'} ${Utils.formatDogeShort(tx.amount)} DOGE
                    </p>
                    <span class="inline-block px-2 py-1 text-xs rounded ${
                        tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                    }">
                        ${tx.status === 'completed' ? 'Completado' :
                          tx.status === 'pending' ? 'Pendiente' : 'Fallido'}
                    </span>
                </div>
            </div>
        `).join('');
    },

    // ==================
    // SISTEMA DE REFERIDOS
    // ==================

    setupReferralSystem() {
        const referrals = Storage.getReferrals();
        const referralLink = `${window.location.origin}${window.location.pathname}?ref=${referrals.code}`;
        
        const linkInput = document.getElementById('referralLink');
        const modalLinkInput = document.getElementById('modalReferralLink');
        
        if (linkInput) linkInput.value = referralLink;
        if (modalLinkInput) modalLinkInput.value = referralLink;

        // Verificar si viene por referido
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        
        if (refCode && refCode !== referrals.code) {
            console.log('Usuario referido por:', refCode);
            // Aquí podrías guardar el código de referido
        }
    },

    // ==================
    // ACTUALIZAR PRECIO
    // ==================

    async updateDogePrice() {
        try {
            // En producción, aquí harías una llamada a una API real
            // Por ejemplo: CoinGecko, CoinMarketCap, etc.
            // const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=dogecoin&vs_currencies=usd');
            // const data = await response.json();
            // this.dogePrice = data.dogecoin.usd;
            
            // Por ahora usamos un precio simulado que cambia ligeramente
            this.dogePrice = Utils.random(0.07, 0.09);
            this.updateStats();
            
        } catch (error) {
            console.error('Error actualizando precio de DOGE:', error);
        }
    },

    // ==================
    // EVENT LISTENERS
    // ==================

    setupEventListeners() {
        // Actualizar precio cada 60 segundos
        setInterval(() => {
            this.updateDogePrice();
        }, 60000);

        // Sincronizar datos cada 30 segundos
        setInterval(() => {
            this.updateStats();
        }, 30000);
    }
};

// ==================
// FUNCIONES GLOBALES
// ==================

function toggleMining() {
    App.toggleMining();
}

function openWithdrawModal() {
    if (!Wallet.connected) {
        Utils.showError('Debes conectar tu wallet primero');
        return;
    }
    
    const modal = document.getElementById('withdrawModal');
    modal.classList.add('active');
}

function closeWithdrawModal() {
    const modal = document.getElementById('withdrawModal');
    modal.classList.remove('active');
    document.getElementById('withdrawAddress').value = '';
    document.getElementById('withdrawAmount').value = '';
}

async function processWithdraw(event) {
    event.preventDefault();
    
    const address = document.getElementById('withdrawAddress').value.trim();
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    
    if (!Utils.isValidDogeAddress(address)) {
        Utils.showError('Dirección de Dogecoin inválida');
        return;
    }
    
    if (!Utils.isValidAmount(amount) || amount < 10) {
        Utils.showError('Cantidad inválida. Mínimo 10 DOGE');
        return;
    }
    
    const user = Storage.getUser();
    if (user.balance < amount) {
        Utils.showError('Saldo insuficiente');
        return;
    }
    
    // Procesar retiro
    const success = await Wallet.withdraw(address, amount);
    
    if (success) {
        closeWithdrawModal();
    }
}

function openReferralModal() {
    const modal = document.getElementById('referralModal');
    modal.classList.add('active');
}

function closeReferralModal() {
    const modal = document.getElementById('referralModal');
    modal.classList.remove('active');
}

function copyReferralLink() {
    const input = document.getElementById('referralLink');
    Utils.copyToClipboard(input.value);
}

function copyModalReferralLink() {
    const input = document.getElementById('modalReferralLink');
    Utils.copyToClipboard(input.value);
}

function shareTwitter() {
    const link = document.getElementById('modalReferralLink').value;
    const text = '¡Únete a DogeNode y gana Dogecoin pasivamente! 🐕💰';
    Utils.shareTwitter(text, link);
}

function shareFacebook() {
    const link = document.getElementById('modalReferralLink').value;
    Utils.shareFacebook(link);
}

function shareWhatsApp() {
    const link = document.getElementById('modalReferralLink').value;
    const text = '¡Únete a DogeNode y gana Dogecoin pasivamente! 🐕💰';
    Utils.shareWhatsApp(text, link);
}

function viewAllTransactions() {
    Utils.showInfo('Función de historial completo próximamente');
}

function manageWallet() {
    if (Wallet.connected) {
        if (confirm('¿Deseas desconectar tu wallet?')) {
            Wallet.disconnect();
        }
    } else {
        Wallet.connect();
    }
}

function showExtensionInstructions() {
    alert(`📥 Instrucciones de Instalación:

1. Descarga la extensión desde nuestro repositorio
2. Abre Chrome y ve a chrome://extensions
3. Activa "Modo de desarrollador"
4. Haz clic en "Cargar extensión sin empaquetar"
5. Selecciona la carpeta de la extensión
6. ¡Listo! Recarga esta página`);
}

// Cerrar modales al hacer clic fuera
window.onclick = function(event) {
    const withdrawModal = document.getElementById('withdrawModal');
    const referralModal = document.getElementById('referralModal');
    
    if (event.target === withdrawModal) {
        closeWithdrawModal();
    }
    if (event.target === referralModal) {
        closeReferralModal();
    }
};

// ==================
// INICIALIZAR APP
// ==================

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

console.log('🎮 Aplicación cargada');
```

---

## 🚀 **Cómo Subir a GitHub Pages:**

1. **Crea un repositorio en GitHub:**
   - Nombre: `dogenode` o `tu-usuario.github.io`

2. **Sube todos los archivos** con esta estructura:
```
tu-repositorio/
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── app.js
    ├── wallet.js
    ├── storage.js
    └── utils.js
