/**
 * Bridge Page App Launcher
 * A앱(airbridgesample://) → 브릿지 페이지 → B앱(juryeol://) 실행
 */

class AppLauncher {
    constructor() {
        this.config = {
            // B앱 정보
            bAppScheme: 'juryeol://',
            bAppPackageName: 'com.juryeol.app', // 실제 패키지명으로 변경 필요
            
            // 타이밍 설정 (ms)
            launchDelay: 500,        // 페이지 로드 후 앱 실행 시도까지 대기 시간
            fallbackDelay: 2500,     // 앱 실행 실패 판단 시간
            
            // 디버그 모드
            debugMode: true          // true: 디버그 정보 표시, false: 숨김
        };

        this.init();
    }

    /**
     * 초기화
     */
    init() {
        this.debug('AppLauncher initialized');
        
        // URL 파라미터 파싱
        this.params = this.parseUrlParams();
        this.debug('URL Parameters:', this.params);

        // 디버그 UI 설정
        if (this.config.debugMode) {
            this.showDebugInfo();
        }

        // 수동 실행 버튼 이벤트
        this.setupManualButton();

        // 자동 앱 실행
        this.autoLaunch();
    }

    /**
     * URL 파라미터 파싱
     */
    parseUrlParams() {
        const params = {};
        const searchParams = new URLSearchParams(window.location.search);
        
        for (let [key, value] of searchParams) {
            params[key] = value;
        }
        
        return params;
    }

    /**
     * OS 감지
     */
    detectOS() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        if (/android/i.test(userAgent)) {
            return 'Android';
        }
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            return 'iOS';
        }
        return 'Unknown';
    }

    /**
     * B앱으로 전달할 딥링크 URL 생성
     */
    buildDeepLink() {
        // 기본 스킴
        let deepLink = this.config.bAppScheme;
        
        // URL 파라미터가 있으면 추가
        if (Object.keys(this.params).length > 0) {
            // 예시: juryeol://?param1=value1&param2=value2
            const queryString = new URLSearchParams(this.params).toString();
            deepLink += '?' + queryString;
        }
        
        return deepLink;
    }

    /**
     * 앱 실행 시도
     */
    tryLaunchApp() {
        const os = this.detectOS();
        const deepLink = this.buildDeepLink();
        
        this.debug(`Attempting to launch app...`);
        this.debug(`OS: ${os}`);
        this.debug(`Deep Link: ${deepLink}`);

        if (os === 'Android') {
            this.launchAndroidApp(deepLink);
        } else {
            this.debug('Not Android device - skipping app launch');
            this.updateStatus('Android 기기에서만 동작합니다');
        }
    }

    /**
     * Android 앱 실행
     */
    launchAndroidApp(deepLink) {
        this.debug('Launching Android app...');
        
        // Method 1: iframe을 이용한 방식 (primary)
        this.tryLaunchViaIframe(deepLink);
        
        // Method 2: location.href 방식 (fallback)
        setTimeout(() => {
            this.tryLaunchViaLocation(deepLink);
        }, 100);
    }

    /**
     * iframe을 이용한 앱 실행
     */
    tryLaunchViaIframe(deepLink) {
        try {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = deepLink;
            document.body.appendChild(iframe);
            
            this.debug('App launch attempted via iframe');
            
            // iframe은 즉시 제거하지 않고 잠시 유지
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        } catch (e) {
            this.debug('Error launching via iframe:', e);
        }
    }

    /**
     * location.href를 이용한 앱 실행
     */
    tryLaunchViaLocation(deepLink) {
        try {
            window.location.href = deepLink;
            this.debug('App launch attempted via location.href');
        } catch (e) {
            this.debug('Error launching via location:', e);
        }
    }

    /**
     * 자동 앱 실행
     */
    autoLaunch() {
        this.debug(`Waiting ${this.config.launchDelay}ms before launch...`);
        
        setTimeout(() => {
            this.tryLaunchApp();
            
            // 일정 시간 후 수동 버튼 표시
            setTimeout(() => {
                this.showManualButton();
            }, this.config.fallbackDelay);
            
        }, this.config.launchDelay);
    }

    /**
     * 수동 실행 버튼 설정
     */
    setupManualButton() {
        const button = document.getElementById('manualButton');
        if (button) {
            button.addEventListener('click', () => {
                this.debug('Manual button clicked');
                this.tryLaunchApp();
            });
        }
    }

    /**
     * 수동 실행 버튼 표시
     */
    showManualButton() {
        const button = document.getElementById('manualButton');
        if (button) {
            button.classList.add('show');
            this.updateStatus('앱이 자동으로 열리지 않았다면 버튼을 눌러주세요');
        }
    }

    /**
     * 디버그 정보 표시
     */
    showDebugInfo() {
        const debugInfo = document.getElementById('debugInfo');
        if (debugInfo) {
            debugInfo.classList.add('show');
            
            document.getElementById('osInfo').textContent = `OS: ${this.detectOS()}`;
            document.getElementById('schemeInfo').textContent = `Target: ${this.config.bAppScheme}`;
        }
    }

    /**
     * 상태 업데이트
     */
    updateStatus(message) {
        const statusInfo = document.getElementById('statusInfo');
        if (statusInfo) {
            statusInfo.textContent = `Status: ${message}`;
        }
        this.debug(`Status: ${message}`);
    }

    /**
     * 디버그 로그
     */
    debug(...args) {
        if (this.config.debugMode) {
            console.log('[AppLauncher]', ...args);
        }
    }
}

// 페이지 로드 시 자동 실행
document.addEventListener('DOMContentLoaded', () => {
    new AppLauncher();
});