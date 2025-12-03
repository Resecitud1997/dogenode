// Utilidades Generales
const Utils = {
    
    // ==================
    // VALIDACIONES
    // ==================

    isValidDogeAddress(address) {
        if (!address || typeof address !== 'string') return false;
        // Dogecoin addresses empiezan con 'D' y tienen 34 caracteres
        const dogeRegex = /^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/;
        return dogeRegex.test(address);
    },

    isValidAmount(amount) {
        const num = parseFloat(amount);
        return !isNaN(num) && num > 0 && num < 10000000;
    },

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // ==================
    // FORMATEO
    // ==================

    formatDoge(amount) {
        return parseFloat(amount).toFixed(8);
    },

    formatDogeShort(amount) {
        return parseFloat(amount).toFixed(2);
    },

    formatUSD(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    formatNumber(num) {
        return new Intl.NumberFormat('es-ES').format(num);
    },

    formatDate(date) {
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },

    formatDateShort(date) {
        return new Intl.DateTimeFormat('es-ES', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },

    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    formatAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
    },

    // ==================
    // CÁLCULOS
    // ==================

    calculateDogeToUSD(dogeAmount, dogePrice = 0.08) {
        return dogeAmount * dogePrice;
    },

    calculateFee(amount) {
        return 1.0; // Fee fijo de 1 DOGE
    },

    calculateTotal(amount, fee) {
        return parseFloat(amount) + parseFloat(fee);
    },

    calculateEarningsRate(uptime) {
        // Calcular tasa de ganancias por hora
        const hoursActive = uptime / 3600;
        if (hoursActive === 0) return 0;
        const earnings = Storage.getUser().totalEarnings;
        return earnings / hoursActive;
    },

    // ==================
    // GENERADORES
    // ==================

    generateTxHash() {
        const chars = '0123456789abcdef';
        let hash = '';
        for (let i = 0; i < 64; i++) {
            hash += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return hash;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    generateDogeAddress() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
        let address = 'D';
        for (let i = 0; i < 33; i++) {
            address += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return address;
    },

    // ==================
    // NOTIFICACIONES
    // ==================

    showToast(title, message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastIcon = document.getElementById('toastIcon');
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');

        // Configurar icono según tipo
        toast.className = `toast ${type}`;
        switch(type) {
            case 'success':
                toastIcon.className = 'fas fa-check-circle text-2xl text-green-500';
                break;
            case 'error':
                toastIcon.className = 'fas fa-times-circle text-2xl text-red-500';
                break;
            case 'warning':
                toastIcon.className = 'fas fa-exclamation-triangle text-2xl text-yellow-500';
                break;
            default:
                toastIcon.className = 'fas fa-info-circle text-2xl text-blue-500';
        }

        toastTitle.textContent = title;
        toastMessage.textContent = message;

        // Mostrar toast
        toast.classList.add('show');

        // Ocultar después de 5 segundos
        setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);
    },

    showSuccess(message) {
        this.showToast('¡Éxito!', message, 'success');
    },

    showError(message) {
        this.showToast('Error', message, 'error');
    },

    showWarning(message) {
        this.showToast('Advertencia', message, 'warning');
    },

    showInfo(message) {
        this.showToast('Información', message, 'info');
    },

    // ==================
    // CLIPBOARD
    // ==================

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showSuccess('Copiado al portapapeles');
            return true;
        } catch (error) {
            console.error('Error copiando al portapapeles:', error);
            // Fallback para navegadores antiguos
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textarea);
                this.showSuccess('Copiado al portapapeles');
                return true;
            } catch (err) {
                document.body.removeChild(textarea);
                this.showError('No se pudo copiar');
                return false;
            }
        }
    },

    // ==================
    // COMPARTIR REDES SOCIALES
    // ==================

    shareTwitter(text, url) {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
    },

    shareFacebook(url) {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(facebookUrl, '_blank', 'width=600,height=400');
    },

    shareWhatsApp(text, url) {
        const message = `${text} ${url}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    },

    // ==================
    // UTILIDADES DOM
    // ==================

    show(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('hidden');
        }
    },

    hide(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('hidden');
        }
    },

    toggle(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.toggle('hidden');
        }
    },

    setText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    },

    setHTML(elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
        }
    },

    // ==================
    // ANIMACIONES
    // ==================

    fadeIn(elementId, duration = 300) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.opacity = '0';
            element.classList.remove('hidden');
            
            let start = null;
            const animate = (timestamp) => {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                const opacity = Math.min(progress / duration, 1);
                element.style.opacity = opacity;
                
                if (progress < duration) {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        }
    },

    fadeOut(elementId, duration = 300) {
        const element = document.getElementById(elementId);
        if (element) {
            let start = null;
            const animate = (timestamp) => {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                const opacity = Math.max(1 - progress / duration, 0);
                element.style.opacity = opacity;
                
                if (progress < duration) {
                    requestAnimationFrame(animate);
                } else {
                    element.classList.add('hidden');
                }
            };
            requestAnimationFrame(animate);
        }
    },

    // ==================
    // DETECCIÓN
    // ==================

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    isChrome() {
        return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    },

    // ==================
    // DELAYS
    // ==================

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // ==================
    // RANDOM
    // ==================

    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};

console.log('🛠️ Utilidades inicializadas');