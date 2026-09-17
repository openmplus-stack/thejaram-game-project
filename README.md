# THEJARAM Games

THEJARAM 독서인지·인지학습 웹앱 배포 저장소입니다.

## 운영 구조

- `games/` : Cloudflare Pages의 배포 루트
- `games/index.html` : 게임 홈
- `games/<slug>/index.html` : 각 게임의 실행 파일
- 예: `games/kfc/index.html` → `https://games.thejaram.quest/kfc/`

## 기본 배포 규칙

1. 작은 교육용 게임은 CSS, JavaScript, 이미지를 포함한 self-contained `index.html` 한 파일을 기본으로 합니다.
2. 새 게임은 `games/<slug>/index.html` 경로에 추가합니다.
3. `<slug>`는 짧은 영문 소문자와 하이픈을 사용합니다. 예: `frog-actions`, `sentence-match`.
4. `main` 브랜치에 반영되면 Cloudflare Pages가 자동으로 배포합니다.
5. 이미지 때문에 HTML이 지나치게 커지면 이미지를 먼저 최적화한 뒤 포함합니다.
6. 대용량 오디오·영상 또는 서버 기능이 필요한 앱은 필요할 때 별도 자산/API 구조를 사용합니다.

## 운영 주소

- 게임 홈: https://games.thejaram.quest/
- KFC 독서인지: https://games.thejaram.quest/kfc/

## 이전 Cafe24 배포

기존 Cafe24 GitHub Actions 워크플로는 비활성화되어 있습니다. 현재 게임 서비스는 Cloudflare Pages를 기준으로 운영합니다.

## 새 게임 배포 흐름

게임 완성 → `games/<slug>/index.html` 생성 또는 수정 → GitHub `main` 반영 → Cloudflare Pages 자동 배포 → `https://games.thejaram.quest/<slug>/`
