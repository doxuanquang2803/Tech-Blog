/**
 * TechWorld Unified Notification System
 * Features: Toast, Alert Modal, Confirm Modal
 * Aesthetic: Luxury Glassmorphism
 */

(function() {
    // 1. Inject CSS
    const style = document.createElement('style');
    style.innerHTML = `
        :root {
            --nt-primary: #6366f1;
            --nt-success: #10b981;
            --nt-error: #ef4444;
            --nt-warning: #f59e0b;
            --nt-bg: rgba(15, 23, 42, 0.9);
            --nt-border: rgba(255, 255, 255, 0.1);
            --nt-text: #f1f5f9;
            --nt-muted: #94a3b8;
        }

        /* Toast Styles */
        #nt-toast-container {
            position: fixed; top: 24px; right: 24px;
            z-index: 10000; display: flex; flex-direction: column; gap: 12px;
        }
        .nt-toast {
            min-width: 300px; padding: 16px 20px; border-radius: 12px;
            background: var(--nt-bg); border: 1px solid var(--nt-border);
            color: var(--nt-text); backdrop-filter: blur(12px);
            display: flex; align-items: center; gap: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            transform: translateX(120%); transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .nt-toast.show { transform: translateX(0); }
        .nt-toast i { font-size: 1.25rem; }
        .nt-toast.success { border-left: 4px solid var(--nt-success); }
        .nt-toast.error { border-left: 4px solid var(--nt-error); }
        .nt-toast.info { border-left: 4px solid var(--nt-primary); }
        .nt-toast-close { margin-left: auto; cursor: pointer; opacity: 0.5; transition: 0.2s; }
        .nt-toast-close:hover { opacity: 1; }

        /* Modal Styles */
        #nt-modal-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.7);
            backdrop-filter: blur(4px); z-index: 10001;
            display: none; align-items: center; justify-content: center; padding: 20px;
            opacity: 0; transition: 0.3s;
        }
        #nt-modal-overlay.show { display: flex; opacity: 1; }
        .nt-modal {
            background: #1e293b; border: 1px solid var(--nt-border);
            padding: 40px; border-radius: 24px; width: 100%; max-width: 440px;
            text-align: center; transform: scale(0.9); transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 25px 50px rgba(0,0,0,0.5); color: #fff;
        }
        #nt-modal-overlay.show .nt-modal { transform: scale(1); }
        .nt-modal-icon { font-size: 3.5rem; margin-bottom: 24px; }
        .nt-modal-icon.warning { color: var(--nt-warning); }
        .nt-modal-icon.error { color: var(--nt-error); }
        .nt-modal-icon.success { color: var(--nt-success); }
        .nt-modal-icon.info { color: var(--nt-primary); }
        .nt-modal-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 12px; }
        .nt-modal-text { color: var(--nt-muted); line-height: 1.6; margin-bottom: 32px; }
        .nt-modal-actions { display: flex; gap: 16px; }
        .nt-modal-btn { 
            flex: 1; padding: 12px; border-radius: 12px; border: none; 
            font-weight: 700; cursor: pointer; transition: 0.3s; font-size: 1rem;
        }
        .nt-btn-primary { background: var(--nt-primary); color: #fff; }
        .nt-btn-secondary { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid var(--nt-border); }
        .nt-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3); }
    `;
    document.head.appendChild(style);

    // 2. Create Containers
    const toastContainer = document.createElement('div');
    toastContainer.id = 'nt-toast-container';
    document.body.appendChild(toastContainer);

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'nt-modal-overlay';
    modalOverlay.innerHTML = `
        <div class="nt-modal">
            <div id="nt-modal-icon" class="nt-modal-icon"></div>
            <div id="nt-modal-title" class="nt-modal-title"></div>
            <div id="nt-modal-text" class="nt-modal-text"></div>
            <div class="nt-modal-actions">
                <button id="nt-btn-cancel" class="nt-modal-btn nt-btn-secondary">Hủy</button>
                <button id="nt-btn-ok" class="nt-modal-btn nt-btn-primary">Đồng ý</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    // 3. Persistence Logic (Admin only)
    function saveToastToStorage(msg, type, expires) {
        if (!window.location.pathname.includes('admin.html')) return;
        const toasts = JSON.parse(localStorage.getItem('nt_admin_toasts') || '[]');
        toasts.push({ id: Date.now() + Math.random(), msg, type, expires });
        localStorage.setItem('nt_admin_toasts', JSON.stringify(toasts));
    }

    function removeToastFromStorage(msg) {
        if (!window.location.pathname.includes('admin.html')) return;
        let toasts = JSON.parse(localStorage.getItem('nt_admin_toasts') || '[]');
        toasts = toasts.filter(t => t.msg !== msg);
        localStorage.setItem('nt_admin_toasts', JSON.stringify(toasts));
    }

    function loadPersistentToasts() {
        if (!window.location.pathname.includes('admin.html')) return;
        const toasts = JSON.parse(localStorage.getItem('nt_admin_toasts') || '[]');
        const now = Date.now();
        const validToasts = [];
        
        toasts.forEach(t => {
            if (t.expires > now) {
                // Re-show with remaining time
                window.showToast(t.msg, t.type, t.expires - now, true);
                validToasts.push(t);
            }
        });
        localStorage.setItem('nt_admin_toasts', JSON.stringify(validToasts));
    }

    // 4. Functions
    window.showToast = function(msg, type = 'info', duration = 3000, isRestored = false) {
        const isAdmin = window.location.pathname.includes('admin.html');
        const toast = document.createElement('div');
        toast.className = `nt-toast ${type}`;
        const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info');
        
        toast.innerHTML = `
            <i class="fa ${icon}"></i>
            <span style="flex:1">${msg}</span>
            ${isAdmin ? '<i class="fa fa-times nt-toast-close" title="Đóng"></i>' : ''}
        `;
        
        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        
        const close = () => {
            if (toast && toast.parentElement) {
                toast.classList.remove('show');
                if (isAdmin) removeToastFromStorage(msg);
                setTimeout(() => toast.remove(), 400);
            }
        };
        
        if (isAdmin) {
            const closeBtn = toast.querySelector('.nt-toast-close');
            if (closeBtn) closeBtn.onclick = close;
            
            const adminDuration = isRestored ? duration : 30000;
            if (!isRestored) saveToastToStorage(msg, type, Date.now() + adminDuration);
            
            setTimeout(close, adminDuration);
        } else {
            setTimeout(close, duration);
        }
    };

    window.showModal = function(title, text, type = 'info', isConfirm = true) {
        return new Promise((resolve) => {
            const iconEl = document.getElementById('nt-modal-icon');
            const titleEl = document.getElementById('nt-modal-title');
            const textEl = document.getElementById('nt-modal-text');
            const okBtn = document.getElementById('nt-btn-ok');
            const cancelBtn = document.getElementById('nt-btn-cancel');

            let iconClass = 'fa-circle-info';
            if (type === 'warning') iconClass = 'fa-exclamation-triangle';
            if (type === 'error') iconClass = 'fa-circle-xmark';
            if (type === 'success') iconClass = 'fa-check-circle';

            iconEl.className = `nt-modal-icon ${type}`;
            iconEl.innerHTML = `<i class="fa ${iconClass}"></i>`;
            titleEl.textContent = title;
            textEl.textContent = text;

            cancelBtn.style.display = isConfirm ? 'block' : 'none';
            okBtn.textContent = isConfirm ? 'Đồng ý' : 'Đóng';

            modalOverlay.classList.add('show');

            const cleanup = (val) => {
                modalOverlay.classList.remove('show');
                okBtn.onclick = null;
                cancelBtn.onclick = null;
                resolve(val);
            };

            okBtn.onclick = () => cleanup(true);
            cancelBtn.onclick = () => cleanup(false);
            modalOverlay.onclick = (e) => { if (e.target === modalOverlay) cleanup(false); };
        });
    };

    window.showAlert = (title, text, type = 'info') => window.showModal(title, text, type, false);
    window.showConfirm = (title, text) => window.showModal(title, text, 'warning', true);

    // Initial Load
    setTimeout(loadPersistentToasts, 100);
})();
