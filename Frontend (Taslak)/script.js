// ADHD Dostu LoginUI JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // DOM elementlerini al
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');
    const loginButton = document.querySelector('.login-button');
    const helpButton = document.querySelector('.help-button');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');

    // Şifre görünürlük toggle
    passwordToggle.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // İkon değiştir
        const icon = this.querySelector('.toggle-icon');
        icon.textContent = type === 'password' ? '👁️' : '🙈';
    });

    // Form gönderimi
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Basit validasyon
        if (!username || !password) {
            showMessage('error', 'Lütfen tüm alanları doldur.');
            return;
        }
        
        // Yükleme durumu
        setLoadingState(true);
        
        // Simüle edilmiş giriş işlemi
        setTimeout(() => {
            // Demo amaçlı - gerçek uygulamada API çağrısı yapılır
            if (username === 'ogrenci' && password === '123456') {
                showMessage('success', 'Giriş başarılı! Yönlendiriliyorsun...');
                
                // Başarılı giriş sonrası yönlendirme
               /* setTimeout(() => {
                    // window.location.href = 'dashboard.html';
                    console.log('Dashboard\'a yönlendirilecek...');
                }, 2000);*/

                setTimeout(() => {
                    window.location.href = 'index.html';  // Veya başka bir hedef sayfa
                }, 2000);


            } else {
                showMessage('error', 'Kullanıcı adı veya şifre hatalı. Tekrar dene.');
                
                // Hata durumunda input'ları vurgula
                usernameInput.classList.add('error');
                passwordInput.classList.add('error');
                
                // Hata vurgulamasını kaldır
                setTimeout(() => {
                    usernameInput.classList.remove('error');
                    passwordInput.classList.remove('error');
                }, 3000);
            }
            
            setLoadingState(false);
        }, 1500);
    });

    // Yardım butonu
    helpButton.addEventListener('click', function() {
        showMessage('success', 'Yardım için öğretmeninle iletişime geç.');
    });

    // Input odaklanma efektleri
    const inputs = [usernameInput, passwordInput];
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
        
        // Hata durumunu temizle
        input.addEventListener('input', function() {
            this.classList.remove('error');
        });
    });

    // Otomatik odaklanma
    usernameInput.focus();

    // Yükleme durumu yönetimi
    function setLoadingState(isLoading) {
        if (isLoading) {
            loginButton.classList.add('loading');
            loginButton.disabled = true;
            loginButton.querySelector('.button-icon').textContent = '⏳';
        } else {
            loginButton.classList.remove('loading');
            loginButton.disabled = false;
            loginButton.querySelector('.button-icon').textContent = '🚀';
        }
    }

    // Mesaj gösterme
    function showMessage(type, text) {
        // Önceki mesajları gizle
        hideAllMessages();
        
        const messageElement = type === 'success' ? successMessage : errorMessage;
        const textElement = messageElement.querySelector('.message-text');
        
        textElement.textContent = text;
        messageElement.classList.add('show');
        
        // Mesajı otomatik gizle
        setTimeout(() => {
            messageElement.classList.remove('show');
        }, 5000);
    }

    // Tüm mesajları gizle
    function hideAllMessages() {
        successMessage.classList.remove('show');
        errorMessage.classList.remove('show');
    }

    // Klavye kısayolları
    document.addEventListener('keydown', function(e) {
        // Enter tuşu ile form gönder
        if (e.key === 'Enter' && document.activeElement.tagName !== 'BUTTON') {
            loginForm.dispatchEvent(new Event('submit'));
        }
        
        // Escape tuşu ile mesajları gizle
        if (e.key === 'Escape') {
            hideAllMessages();
        }
    });

    // Accessibility iyileştirmeleri
    function announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Form validasyon mesajları için screen reader desteği
    loginForm.addEventListener('submit', function() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!username) {
            announceToScreenReader('Kullanıcı adı alanı boş bırakılamaz');
        } else if (!password) {
            announceToScreenReader('Şifre alanı boş bırakılamaz');
        }
    });

    // Demo bilgileri göster
    console.log('Demo Giriş Bilgileri:');
    console.log('Kullanıcı Adı: ogrenci');
    console.log('Şifre: 123456');
});

// CSS sınıfı ekle (screen reader için)
const style = document.createElement('style');
style.textContent = `
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
`;
document.head.appendChild(style);

