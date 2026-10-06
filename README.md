# 오늘의 언론기사 종합 (cnenews)

충남에듀있슈 '주요 언론기사' 게시판의 날짜별 첨부파일(hwpx / hwp / pdf)을 불러와
기사 제목·언론사 링크 대시보드로 보여주는 웹페이지입니다. 휴대폰·PC 모두 사용할 수 있습니다.

## 폴더 구성

```
cnenews/
├─ public/index.html            ← 화면(대시보드) 전체
├─ functions/api/[[route]].js   ← 충남에듀있슈에서 목록·첨부파일을 대신 가져오는 중계 코드
└─ README.md                    ← 이 설명
```

## 올리는 순서

### 1) GitHub 저장소에 올리기 (웹에서 끌어다 놓기)
1. GitHub의 `cnenews` 저장소 → **uploading an existing file** (또는 Add file → Upload files)
2. 이 폴더 안의 **`public` 폴더, `functions` 폴더, `README.md`** 를 한꺼번에 끌어다 놓습니다.
   (폴더째 끌어다 놓아야 구조가 유지됩니다)
3. 아래 **Commit changes** 클릭

### 2) 클라우드플레어 Pages 연결
1. https://dash.cloudflare.com 로그인 → 왼쪽 **Workers & Pages**
2. **Create application** → **Pages** 탭 → **Connect to Git**
3. GitHub 연결(Authorize) → 저장소 **cnenews** 선택 → **Begin setup**
4. 설정값
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: **(비워 둠)**
   - Build output directory: **`public`**
5. **Save and Deploy** → 1~2분 뒤 `https://프로젝트이름.pages.dev` 주소가 생깁니다.

### 3) 확인
- `https://프로젝트이름.pages.dev/api/ping` 을 열어 `{"app":"cne-press-dashboard"...}` 가 나오면 중계 코드가 동작 중입니다.
- `https://프로젝트이름.pages.dev/` 에서 날짜를 고르고 [불러오기]를 누릅니다.

## 수정할 때
GitHub에서 파일을 바꾸면(Commit) 클라우드플레어가 자동으로 다시 배포합니다.

## 문제가 생기면
- 화면에 "충남에듀있슈에서 정보를 가져오지 못했습니다"가 계속 나오면, 충남에듀있슈가 클라우드플레어(해외) 접속을 막은 것일 수 있습니다.
  이때는 `/api/recent` 주소를 열어 오류 내용을 확인해 주세요.
