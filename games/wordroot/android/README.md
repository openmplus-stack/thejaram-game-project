# 말씀루트 Android / Google Play 패키징

이 폴더는 말씀루트 PWA를 Trusted Web Activity(TWA) Android 앱으로 패키징하기 위한 설정입니다.

## 고정 값
- Android package ID: `quest.thejaram.wordroot`
- App version: `1.0.0`
- Version code: `1`
- PWA: `https://games.thejaram.quest/wordroot/`
- Web manifest: `https://games.thejaram.quest/wordroot/manifest.webmanifest`
- 최소 Android SDK: 23
- Google Play 제출 target SDK: 36 이상

## 1. 준비
Node.js와 JDK를 설치한 뒤 Bubblewrap CLI를 설치합니다.

```bash
npm install -g @bubblewrap/cli
```

## 2. Android 프로젝트 생성/갱신
이 폴더에서 실행합니다.

```bash
bubblewrap update --manifest=.
```

처음 프로젝트를 생성해야 하는 환경에서는 웹 manifest를 기준으로 init할 수 있습니다.

```bash
bubblewrap init --manifest=https://games.thejaram.quest/wordroot/manifest.webmanifest
```

init 후 이 저장소의 `twa-manifest.json` 값을 기준으로 맞춥니다.

## 3. 업로드 키
`android.keystore`는 Git에 커밋하지 않습니다. 별도 안전한 위치에 백업합니다.
alias는 `wordroot`를 사용합니다.

## 4. 빌드
```bash
bubblewrap build --manifest=.
```

성공 시 Google Play 업로드용 `app-release-bundle.aab`와 기기 테스트용 APK가 생성됩니다.

## 5. API 36 확인
Google Play 제출 전 생성된 Android 프로젝트의 `targetSdk` 또는 `targetSdkVersion`이 36 이상인지 확인합니다.
Bubblewrap/Android Gradle Plugin이 낮은 API를 생성하면 Android Studio에서 SDK 36을 설치하고 target SDK를 36으로 올린 뒤 다시 빌드합니다.

## 6. Digital Asset Links
서명 키가 생성되면 SHA-256 지문을 구합니다.

```bash
keytool -list -v -keystore android.keystore -alias wordroot
```

그 SHA-256을 사용하여 `assetlinks.json`을 만들고 사이트 루트의
`/.well-known/assetlinks.json`에 배포해야 합니다. 이 검증이 성공해야 주소 표시줄 없는 TWA 전체화면으로 실행됩니다.

## 중요
- `android.keystore`와 비밀번호는 저장소에 올리지 않습니다.
- Play App Signing 사용을 권장합니다.
- 출시 업데이트마다 `appVersionCode`를 증가시킵니다.
- 최종 PNG 아이콘이 서버에 올라오면 `iconUrl`, `maskableIconUrl`을 PNG 경로로 교체합니다.
