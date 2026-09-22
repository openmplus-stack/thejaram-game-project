# THEJARAM Games

THEJARAM 독서인지·인지학습 웹앱 배포 저장소입니다.

## 운영 구조

- `games/` : Cloudflare Pages의 배포 루트
- `games/index.html` : 게임 홈
- `games/registry.json` : 게임 목록과 메타데이터
- `games/<slug>/index.html` : 각 게임의 실행 파일
- `DEPLOYMENT.md` : ChatGPT 기반 자동 배포 표준 절차
- `GAME_SUBMISSION.md` : 다른 AI에서 만든 게임의 GitHub 직접 접수 규칙
- `incoming/` : 자동 검사 전 새 게임 접수함
- 예: `games/kfc/index.html` → `https://games.thejaram.quest/kfc/`

## 기본 배포 규칙

1. 작은 교육용 게임은 CSS, JavaScript, 이미지를 포함한 self-contained `index.html` 한 파일을 우선합니다.
2. 파일이 커지면 `index.html`, `styles.css`, `app.js`, 이미지·데이터 파일로 분리합니다.
3. 새 게임은 `games/<slug>/` 경로에 추가합니다.
4. `<slug>`는 짧은 영문 소문자와 하이픈을 사용합니다. 예: `frog-actions`, `sentence-match`.
5. `games/registry.json`에 새 게임을 등록하면 게임 홈 목록이 자동으로 갱신됩니다.
6. `main` 브랜치에 반영되면 Cloudflare Pages가 자동으로 배포합니다.
7. 이미지 때문에 파일이 지나치게 커지면 WebP 등으로 최적화합니다.
8. 대용량 오디오·영상 또는 서버 기능이 필요한 앱은 필요할 때 별도 자산/API 구조를 사용합니다.

## 운영 주소

- 게임 홈: https://games.thejaram.quest/
- KFC 게임: https://games.thejaram.quest/kfc/
- 개구리는 무엇을 할까요?: https://games.thejaram.quest/frog-actions/

## 현재 배포 방식

현재 게임 서비스는 Cloudflare Pages를 기준으로 운영합니다. GitHub `main` 브랜치의 `games/` 디렉터리가 배포 루트이며, 저장소 변경 사항은 Cloudflare Pages가 자동으로 반영합니다.

기존 Cafe24 GitHub Actions 워크플로는 비활성화되어 있습니다.

## 다른 AI에서 만든 게임 직접 접수

Gemini, Claude 등에서 만든 게임도 `incoming/<slug>/`에 `index.html`, `game.json`, 관련 자산을 올리면 GitHub Actions가 검사합니다. 통과하면 게임 폴더와 목록을 갱신하는 Pull Request가 자동 생성됩니다. 자세한 방법은 `GAME_SUBMISSION.md`를 따릅니다.

## 표준 자동 배포 흐름

게임 완성 → 코드·자산 검사 → 필요 시 이미지·파일 최적화 → `games/<slug>/` 생성/수정 → `registry.json` 등록 → GitHub `main` 반영 → Cloudflare Pages 자동 배포 → 실제 URL 검증 → WordPress 소개글 초안 작성

세부 운영 규칙과 완료 기준은 `DEPLOYMENT.md`를 따릅니다.

## ChatGPT에 사용할 기본 요청

`게임 완성했어. 배포해줘.`

이 요청을 받으면 위 표준 흐름을 기준으로 새 게임을 배포합니다.
