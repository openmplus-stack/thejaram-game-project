# THE JARAM 자동 배포 운영 규칙

이 문서는 ChatGPT와 연결된 GitHub 도구를 이용해 THE JARAM 게임을 반복 배포하기 위한 표준 절차를 정의합니다.

## 기본 구조

- 배포 루트: `games/`
- 게임 홈: `games/index.html`
- 게임 목록: `games/registry.json`
- 각 게임: `games/<slug>/`
- 실제 주소: `https://games.thejaram.quest/<slug>/`
- 배포 브랜치: `main`
- 배포 방식: GitHub `main` 반영 → Cloudflare Pages 자동 배포

## 새 게임 배포 절차

1. 완성된 게임 파일을 점검합니다.
2. 외부 의존성, 깨진 경로, 과도하게 큰 이미지·오디오를 확인합니다.
3. 가능하면 `index.html` 중심으로 구성합니다.
4. 파일이 큰 경우 CSS, JavaScript, 이미지 데이터를 분리하거나 이미지를 최적화합니다.
5. 영문 소문자와 하이픈으로 slug를 정합니다.
6. `games/<slug>/` 아래에 필요한 파일을 GitHub에 생성 또는 수정합니다.
7. `games/registry.json`에 게임명, 설명, slug, 상태를 등록합니다.
8. Cloudflare Pages 배포 후 실제 주소를 열어 정상 응답을 확인합니다.
9. 모바일과 데스크톱에서 기본 성능 및 접근성 검사를 수행합니다.
10. 배포가 확인된 실제 URL을 사용해 THEJARAM WordPress 소개글 초안을 작성합니다.

## 파일 크기 원칙

- 작은 게임: self-contained `index.html` 우선
- 큰 게임: `index.html`, `styles.css`, `app.js`, 이미지/데이터 파일로 분리
- base64 이미지가 지나치게 크면 WebP 등으로 최적화
- 대용량 영상·음원은 HTML 내부 삽입보다 별도 자산 사용

## WordPress 글쓰기 규칙

배포가 검증된 뒤 기본적으로 3개 초안을 준비합니다.

1. 수업에서 시작된 게임 — 관찰, 제작 배경, 수업 목표, 구성, 확장
2. 학습능력 중심 — 연습 능력, 진행 방법, 단계, 교육적 의미, 활용
3. 놀이·이야기형 — 호기심, 플레이, 발견, 학습, 확장

실제 수업에서 관찰하지 않은 아동 반응이나 효과는 만들어 쓰지 않습니다.

THE JARAM 독서인지 핵심 문구는 다음과 같이 사용합니다.

> 독서를 위한 인지력 향상, 독서를 통한 인지력 발달

## 완료 기준

다음 조건을 모두 만족해야 배포 완료로 처리합니다.

- GitHub `main`에 필요한 게임 파일 존재
- `registry.json`에 등록
- `https://games.thejaram.quest/<slug>/` 실제 접속 성공
- 주요 기능 정상 동작 확인
- WordPress 초안 생성 또는 업데이트

## 사용자가 사용할 기본 명령

`게임 완성했어. 배포해줘.`

이 요청을 받으면 위 절차를 순서대로 수행합니다.
