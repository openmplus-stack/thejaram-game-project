# THE JARAM 게임 직접 접수 규칙

ChatGPT, Gemini, Claude 또는 다른 도구에서 만든 웹게임을 GitHub에 직접 올릴 때 사용하는 규칙입니다.

## 1. 폴더 구조

GitHub의 `incoming/` 아래에 **영문 소문자와 하이픈으로 된 새 폴더**를 만들고 게임 파일을 올립니다.

```text
incoming/
└── my-new-game/
    ├── index.html
    ├── game.json
    └── assets/
        ├── cover.webp
        └── screen-01.webp
```

- 폴더 이름과 `game.json`의 `slug`는 반드시 같아야 합니다.
- 실행 시작 파일은 반드시 `index.html`이어야 합니다.
- CSS, JavaScript, 이미지, 음원은 같은 접수 폴더 안에 둡니다.
- 비밀번호, API 키, 개인정보는 올리지 않습니다.
- 한 파일은 20MB 이하, 게임 전체는 50MB 이하로 준비합니다.

## 2. game.json

아래 내용을 복사한 뒤 게임에 맞게 수정합니다.

```json
{
  "slug": "my-new-game",
  "title": "새 게임 이름",
  "description": "게임 목록에 표시할 짧은 설명",
  "status": "published",
  "wordpress": {
    "createDraft": false,
    "excerpt": "검색 결과에 사용할 1~2문장 요약",
    "keywords": ["독서인지", "학습 게임"],
    "content": "워드프레스 초안에 사용할 소개글입니다."
  }
}
```

### 필수 항목

- `slug`: 영문 소문자, 숫자, 하이픈만 사용
- `title`: 게임 이름
- `description`: 게임 목록에 표시할 설명
- `status`: 보통 `published`

### 워드프레스 초안

- 초안도 만들려면 `wordpress.createDraft`를 `true`로 설정합니다.
- `excerpt`, `keywords`, `content`를 실제 게임 내용에 맞게 작성합니다.
- 확인하지 않은 아동의 반응이나 교육 효과를 쓰지 않습니다.
- 저장소에 WordPress Secrets가 없으면 게임 PR은 만들지만 글 생성 단계는 건너뜁니다.

## 3. 업로드 후 진행

1. GitHub 웹사이트에서 `incoming/<slug>/`에 파일을 업로드하고 `main` 브랜치에 커밋합니다.
2. **Actions → Process incoming games**에서 검사 결과를 확인합니다.
3. 검사를 통과하면 `automation/incoming-...` 브랜치와 Pull Request가 자동 생성됩니다.
4. Pull Request의 변경 내용을 확인하고 병합합니다.
5. 병합 후 Cloudflare Pages가 `https://games.thejaram.quest/<slug>/`에 반영합니다.
6. Pull Request를 병합한 뒤 WordPress 초안을 요청했다면 **Actions → Create WordPress draft**를 실행해 초안을 만듭니다.

검사에 실패하면 Actions 화면에 원인이 표시됩니다. 파일을 수정하여 같은 접수 폴더에 다시 올리면 됩니다.
