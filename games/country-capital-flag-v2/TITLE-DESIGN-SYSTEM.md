# 세계 짝꿍 찾기 V2 — Title Design Master

## 승인된 기준
- 기준 화면: `assets/screen-topic-select.jpg`의 **학습 방식 선택** 제목.
- 제목판: `assets/ui-title-sign.png` (원본 변경 금지).
- 글자: 진한 초콜릿 갈색의 매우 굵고 둥근 한글, 두꺼운 크림색 외곽선, 짙은 외곽 음영, 아래쪽 입체 그림자.
- 비율, 글자 획의 둥근 끝, 색상, 외곽선, 그림자를 기준 이미지와 시각적으로 대조해 승인받는다. 원본과 대조하지 않은 수치·색상은 '정확히 일치'한다고 주장하지 않는다.

## 제목 자산 원칙
- 화면별로 **글자만 있는 투명 PNG** 1개씩 제작한다. 배경과 나무판을 PNG에 다시 그리지 않는다.
- 제목 글자는 CSS 폰트/그림자로 유사 재현하지 않는다.
- 화면별 글자 PNG를 단일 DOM `<img>` 또는 단일 CSS background-image 경로 중 하나로만 렌더링한다. 두 방식을 혼용하지 않는다.
- 이미지 비율 유지(`object-fit:contain` 또는 `background-size:contain`), 제목판 중앙 배치.
- `aria-label`은 HTML에 유지하고, 시각적으로 보이는 중복 텍스트/가상요소를 제거한다.
- 자산의 투명도(alpha), 선명도, 시각적 일치도를 확인한 뒤 승인된 제목만 적용한다.

## 제작 예정 파일
| 화면 | 표시 문구 | 파일 |
|---|---|---|
| 대륙 선택 | 대륙 선택 | `title-continent-select.png` |
| 학습 방식 선택 | 학습 방식 선택 | 승인된 `screen-topic-select.jpg` 유지 |
| 국가 선택 | 국가 선택 | `title-country-select.png` |
| 활동 선택 | 활동 선택 | `title-activity-select.png` |
| 학습 화면 | 학습하기 | `title-learning.png` |
| 문제 풀이 | 문제 풀기 | `title-quiz.png` |
| 결과 화면 | 학습 결과 | `title-results.png` |
| 국기 보관함 | 국기 보관함 | `title-flags.png` |
| 세계 보물 도감 | 세계 보물 도감 | `title-treasures.png` |
| 나의 학습 | 나의 학습 | `title-progress.png` |

위 문구는 후보이며, 실제 화면의 기존 확정 문구가 우선한다.

## 국가 선택 적용 순서
1. `screen-topic-select.jpg`의 제목을 실물 기준으로 대조하여 글자만 포함된 `assets/title-country-select.png`를 제작한다.
2. PNG가 실제 alpha 투명 배경이고 원본 제목과 같은 스타일인지 검수한다.
3. 기존 `assets/title-country-select.svg`를 렌더링하는 `shared-frame.css` 경로와 충돌하지 않도록 교체한다.
4. `index.html`, `style.css`, `design-refresh.css`, `shared-frame.css`에서 제목이 두 번 렌더링되지 않는지 점검한다.
5. CSS 캐시 버전 변경 후 **Cloudflare Preview**의 iPad 가로 4:3 화면에서 확인한다.
6. 국가 선택 제목을 사용자가 승인한 다음 다른 화면으로 확장한다.

## 변경 금지
- `main` 브랜치 및 `games/country-capital-flag/` 운영 앱.
- 승인된 배경, 제목판, 국가 데이터, 국가 카드 5열, 양피지 박스, 하단 메뉴, 이동 및 학습·보상 로직.

## 완료 판정
- 실제 투명 PNG를 배포하고 제목이 **한 번만** 보임.
- 기준 화면과의 시각적 대조가 통과됨.
- Cloudflare Preview에서 캐시 새로고침 후 동일하게 보임.
- 기존 버튼과 국가 선택 기능이 정상 동작함.

**주의:** 이 문서는 제목 디자인의 제작·검수 기준이며, PNG 이미지의 제작·배포가 완료되었다는 의미가 아니다.
