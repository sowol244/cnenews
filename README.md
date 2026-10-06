# 오늘의 언론기사 종합 (cnenews)

충남에듀있슈 '주요 언론기사' 게시판의 날짜별 첨부파일(hwpx / hwp / pdf)을 불러와
기사 제목·언론사 링크 대시보드로 보여주는 웹페이지입니다. 휴대폰·PC 모두 사용할 수 있습니다.

## 구성 (Vercel, 서울 지역)

```
cnenews/
├─ public/index.html     ← 화면(대시보드) 전체
├─ api/[...route].js     ← 충남에듀있슈에서 목록·첨부파일을 대신 가져오는 중계 코드 (/api/...)
├─ vercel.json           ← 출력 폴더(public), 실행 지역(서울 icn1) 설정
└─ package.json
```

충남에듀있슈가 해외 서버 접속을 막아서, 중계 코드는 서울 지역(icn1)에서 실행되도록 설정했습니다.

## 배포
GitHub `main`에 올리면 Vercel이 자동으로 다시 배포합니다.

## 확인
- `/api/ping` → `{"app":"cne-press-dashboard", ...}`
- `/api/recent?limit=3` → 최근 게시글 목록
- `/` → 날짜 선택 화면
