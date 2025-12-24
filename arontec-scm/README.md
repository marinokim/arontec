# Arontec B2B SCM System

폐쇄형 B2B 온라인 주문 및 견적 관리 시스템

## 🚀 기술 스택

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Authentication**: Session-based auth with bcrypt

## 📋 주요 기능

### 파트너사 (B2B 사용자)
- ✅ 회원가입 (관리자 승인 필요)
- ✅ 로그인/로그아웃
- ✅ 대시보드 (공지사항, 최근 견적 현황)
- ✅ 상품 카탈로그 (카테고리 필터, 검색)
- ✅ 장바구니 기능
- ✅ 견적 요청
- ✅ 견적 이력 조회

### 관리자
- ✅ 회원 관리 (승인/반려)
- ✅ 견적 관리 (승인/거절)
- 🚧 상품 관리 (CRUD)
- 🚧 통계 대시보드

## 🛠️ 설치 및 실행

### 1. 데이터베이스 설정

PostgreSQL을 설치하고 데이터베이스를 생성합니다:

```bash
# PostgreSQL 설치 (Mac)
brew install postgresql@14
brew services start postgresql@14

# 데이터베이스 생성
createdb arontec_scm

# 스키마 적용
psql arontec_scm < database/schema.sql
```

### 2. 백엔드 설정

```bash
cd backend

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어서 DATABASE_URL 등을 설정

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

### 3. 프론트엔드 설정

```bash
cd frontend

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

## 🌐 접속

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 👤 기본 계정

### 관리자 계정
- 이메일: `admin@arontec.com`
- 비밀번호: `admin123` (schema.sql에서 hash 생성 필요)

### 테스트 파트너사
회원가입 후 관리자 승인 필요

## 📁 프로젝트 구조

```
arontec-scm/
├── frontend/                # React 앱
│   ├── src/
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── App.jsx         # 메인 앱 + 라우팅
│   │   └── index.css       # 글로벌 스타일
│   └── package.json
├── backend/                 # Express API
│   ├── routes/             # API 라우트
│   ├── middleware/         # 인증 미들웨어
│   ├── config/             # DB 설정
│   └── server.js
├── database/
│   └── schema.sql          # DB 스키마
└── README.md
```

## 🚢 배포 (Render.com)

### 필요한 서비스
1. **Web Service (Backend)** - Node.js
2. **Web Service (Frontend)** - Static Site
3. **PostgreSQL** - Managed Database

### 환경 변수
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `SESSION_SECRET`: 세션 암호화 키
- `NODE_ENV`: production

## 📝 다음 단계

1. [ ] 관리자 상품 관리 CRUD 구현
2. [ ] 견적서 PDF 생성 기능
3. [ ] 엑셀 업로드 기능
4. [ ] 이메일 알림
5. [ ] 상품 이미지 업로드
6. [ ] 검색 고도화
7. [ ] 통계 대시보드

## 📄 라이선스

© 2025 Arontec Korea Co., Ltd.
