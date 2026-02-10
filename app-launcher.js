class AppLauncher {
    constructor() {
        this.config = {
            //앱주소 + 웹뷰 url
            bAppScheme: 'juryeol://webview?url=https://judying.github.io/demosite/',
            bAppPackageName: 'com.juryeol.app', 
            
            // 타이밍 설정
            launchDelay: 300,        
            fallbackDelay: 2000,     
            
            // 디버그 모드
            debugMode: true         
        };

        this.init();
    }

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
        // 기본 스킴 (이미 url 파라미터 포함)
        let deepLink = this.config.bAppScheme;
        
        // airbridge_referrer 파라미터 우선 처리
        const airbridgeReferrer = this.params.airbridge_referrer;
        
        if (airbridgeReferrer) {
            // 기존 스킴에 이미 ?가 있으므로 &로 연결
            deepLink += `%3Fairbridge_referrer=${encodeURIComponent(airbridgeReferrer)}`;
            
            // 나머지 파라미터도 추가
            const otherParams = { ...this.params };
            delete otherParams.airbridge_referrer;
            
            if (Object.keys(otherParams).length > 0) {
                const otherQueryString = new URLSearchParams(otherParams).toString();
                deepLink += '&' + otherQueryString;
            }
            
            this.debug('Airbridge referrer preserved:', airbridgeReferrer);
        } else if (Object.keys(this.params).length > 0) {
            // airbridge_referrer가 없으면 모든 파라미터 추가
            const queryString = new URLSearchParams(this.params).toString();
            deepLink += '&' + queryString;
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
        this.updateStatus('앱 실행 중...');
        
        // Method 1: Intent URI 방식 (Primary - 팝업 없이 바로 실행)
        this.tryLaunchViaIntent(deepLink);
        
        // Method 2: window.location.href (fallback)
        setTimeout(() => {
            this.tryLaunchViaLocation(deepLink);
        }, 500);
    }

    /**
     * Intent URI를 이용한 앱 실행 (Primary Method)
     * Chrome에서 팝업 없이 바로 앱을 실행하는 방식
     */
    tryLaunchViaIntent(deepLink) {
        try {
            // Intent URI 스킴으로 변환
            // juryeol://webview?url=... 형태를 intent://webview?url=...#Intent;scheme=juryeol;...;end 로 변환
            const path = deepLink.replace('juryeol://', '');
            const intentUrl = `intent://${path}#Intent;scheme=juryeol;package=${this.config.bAppPackageName};end`;
            
            this.debug('Attempting launch via Intent URI (Primary):', intentUrl);
            
            // 바로 location.href로 실행
            window.location.href = intentUrl;
            
            this.debug('Intent URI launch command sent');
            this.updateStatus('앱 실행 명령 전송됨');
        } catch (e) {
            this.debug('Error launching via Intent:', e);
            this.updateStatus('Intent 실행 실패: ' + e.message);
        }
    }

    /**
     * location.href를 이용한 앱 실행 (Fallback Method)
     */
    tryLaunchViaLocation(deepLink) {
        try {
            this.debug('Attempting launch via window.location.href (Fallback)');
            window.location.href = deepLink;
            this.debug('Location launch attempted');
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