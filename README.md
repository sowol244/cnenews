# 오늘의 언론기사 종합 (cnenews)

충남에듀있슈 '주요 언론기사' 게시판의 날짜별 첨부파일(hwpx / hwp / pdf)을 불러와
기사 제목·언론사 링크 대시보드로 보여주는 웹페이지입니다. 휴대폰·PC 모두 사용할 수 있습니다.

## 폴더 구성

```
cnenews/
├─ public/index.html     ← 화면(대시보드) 전체
├─ src/worker.js         ← 충남에듀있슈에서 목록·첨부파일을 대신 가져오는 중계 코드 (/api/...)
├─ wrangler.jsonc        ← 클라우드플레어 Workers 설정 (이름: cnenews)
└─ README.md
```

## 배포
GitHub `main`에 올리면 클라우드플레어(Workers Builds)가 자동으로 다시 배포합니다.
주소: `https://cnenews.whizboy.workers.dev`

## 확인
- `/api/ping` → `{"app":"cne-press-dashboard", ...}`
- `/api/recent?limit=3` → 최근 게시글 목록
- `/` → 날짜 선택 화면

## 문제가 생기면
- "충남에듀있슈에서 정보를 가져오지 못했습니다"가 계속 나오면 충남에듀있슈가 해외 접속을 막은 것일 수 있습니다.
