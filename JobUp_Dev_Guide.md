# JobUp 개발 가이드

> **버전** v1.0 · **기준 PRD** v4.0  
> **대상** 프론트엔드 개발자 · 백엔드 개발자  
> **목적** PRD v4.0과 UI 프로토타입(jobup-v6.html)을 실제 서비스로 구현하기 위한 기술 결정, 아키텍처, 구현 우선순위 전체 가이드

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [프로젝트 구조](#3-프로젝트-구조)
4. [데이터베이스 스키마](#4-데이터베이스-스키마)
5. [API 설계](#5-api-설계)
6. [핵심 기능 구현 가이드](#6-핵심-기능-구현-가이드)
   - 6.1 [챕터 시스템 & 요금제 게이트](#61-챕터-시스템--요금제-게이트)
   - 6.2 [직무적성 퀴즈 (3과목 × 2문제)](#62-직무적성-퀴즈-3과목--2문제)
   - 6.3 [비즈니스 영어 스토리 5단계 세션](#63-비즈니스-영어-스토리-5단계-세션)
   - 6.4 [IT 상식 챕터](#64-it-상식-챕터)
   - 6.5 [게임화 — XP · 스트릭 · 하트](#65-게임화--xp--스트릭--하트)
   - 6.6 [리그전 (League)](#66-리그전-league)
   - 6.7 [Activity Garden (학습 잔디)](#67-activity-garden-학습-잔디)
   - 6.8 [MyRoom (아이소메트릭 공부방)](#68-myroom-아이소메트릭-공부방)
   - 6.9 [자격증 D-Day 플랜](#69-자격증-d-day-플랜)
   - 6.10 [결제 & 구독 관리](#610-결제--구독-관리)
7. [Admin CMS](#7-admin-cms)
8. [인증 & 보안](#8-인증--보안)
9. [인프라 & 배포](#9-인프라--배포)
10. [Phase별 개발 범위](#10-phase별-개발-범위)
11. [프로토타입 → 실제 구현 매핑](#11-프로토타입--실제-구현-매핑)
12. [개발 운영 원칙](#12-개발-운영-원칙)

---

## 1. 프로젝트 개요

### 서비스 한 줄 정의
취업 준비생(공기업·대기업·금융권)을 위한 **챕터 기반 데일리 학습 + 자격증 과정 통합 플랫폼**

### 핵심 개념: 챕터(Chapter)
모든 학습 콘텐츠의 기본 단위. **1챕터 = 1회 완결 세션 (약 5~13분)**

| 영역 | 챕터 구성 | 무료 기본 제공 |
|---|---|---|
| 직무적성 | 과목(언어·수리·추리)별 2문제 묶음 | 3챕터/일 (과목당 1챕터) |
| 비즈니스 영어 | 스토리 1편의 5단계 전체 | 1챕터/일 |
| IT 상식 | 카테고리별 5문제 묶음 | 1챕터/일 |
| 심화 과정 | 기업별·직무별 문제 세트 | 유료 전용 |
| 자격증 과정 | 일별 강의+문제 1일 분량 | 유료 전용 |

### 요금제 요약

| 플랜 | 가격 | 하루 챕터 수 |
|---|---|---|
| Free | 무료 | 3챕터 고정 (영역별 1챕터) |
| Light | 월 1,900원 | 추가 5챕터 (하루 최대 8챕터) |
| Premium | 월 4,900원 | 무제한 |

---

## 2. 기술 스택

### 프론트엔드
```
Next.js 14 (App Router)   — 웹 프레임워크. SSR·SEO·API Route 통합
TypeScript                 — 타입 안전성. 백엔드와 타입 공유 가능
Tailwind CSS + shadcn/ui   — 빠른 UI. 디자이너 없이도 일관된 스타일
Zustand                    — 클라이언트 상태관리 (세션 진행, 챕터 상태)
React Query (TanStack)     — 서버 상태 캐싱. API 호출 최적화
```

### 백엔드
```
NestJS + TypeScript         — 구조화된 MVC. 유지보수성 우수
PostgreSQL (AWS RDS)        — 메인 DB. 사용자·학습·결제 데이터
Redis (AWS ElastiCache)     — XP 순위 실시간 처리. 세션·캐시
AWS S3 + CloudFront         — 영어 오디오 MP3, 이미지, 아이템 에셋
```

### 외부 서비스
```
Toss Payments               — 결제 (구독 자동결제 + 단건)
NextAuth.js                 — 소셜 로그인 (카카오·네이버·구글)
OpenAI API (GPT-4o-mini)    — 영어 쓰기 채점 (비용 최적화 위해 mini 우선)
Web Speech API              — 말하기 STEP 4 (브라우저 내장, 무료)
Sentry                      — 에러 트래킹
Vercel Analytics            — 사용자 행동 분석
```

### 향후 (Phase 2+)
```
React Native (Expo)         — 앱 전환 시. Next.js 코드 최대 재활용
Firebase Cloud Messaging    — 푸시 알림
Google Cloud TTS            — 영어 오디오 자동 생성 (Phase 2)
```

---

## 3. 프로젝트 구조

### 모노레포 구조 (권장)

```
jobup/
├── apps/
│   ├── web/                        # Next.js 14 프론트엔드
│   │   ├── app/
│   │   │   ├── (auth)/             # 로그인·회원가입
│   │   │   ├── (main)/             # 메인 서비스 (로그인 필요)
│   │   │   │   ├── home/           # 홈 탭
│   │   │   │   ├── learn/          # 학습 탭
│   │   │   │   │   ├── aptitude/   # 직무적성 세션
│   │   │   │   │   ├── english/    # 영어 스토리 세션
│   │   │   │   │   └── it/         # IT 상식 세션
│   │   │   │   ├── advance/        # 심화·자격증 탭
│   │   │   │   ├── league/         # 리그전
│   │   │   │   └── my/             # MY 페이지
│   │   │   │       └── room/       # MyRoom
│   │   │   └── admin/              # Admin CMS (별도 인증)
│   │   ├── components/
│   │   │   ├── quiz/               # 퀴즈 공통 컴포넌트
│   │   │   ├── english/            # 영어 세션 단계별 컴포넌트
│   │   │   ├── garden/             # Activity Garden (잔디)
│   │   │   ├── myroom/             # MyRoom 아이소메트릭
│   │   │   └── gamification/       # XP, 스트릭, 하트, 리그 UI
│   │   └── lib/
│   │       ├── api.ts              # API 클라이언트
│   │       └── store/              # Zustand 스토어
│   └── api/                        # NestJS 백엔드
│       ├── src/
│       │   ├── auth/               # 인증 모듈
│       │   ├── chapters/           # 챕터 시스템
│       │   ├── content/            # 문제·에피소드 콘텐츠
│       │   ├── gamification/       # XP, 스트릭, 리그, 뱃지
│       │   ├── garden/             # 잔디 집계
│       │   ├── myroom/             # MyRoom 아이템 관리
│       │   ├── payment/            # 결제·구독
│       │   └── admin/              # Admin API
│       └── prisma/
│           └── schema.prisma
└── packages/
    └── types/                      # 공유 TypeScript 타입 (프론트·백 공용)
```

### 핵심 공유 타입 (`packages/types`)

```typescript
// 요금제
export type PlanType = 'free' | 'light' | 'premium';

// 챕터 영역
export type ChapterSubject = 'aptitude_lang' | 'aptitude_num' | 'aptitude_rea'
                           | 'english' | 'it' | 'advance' | 'cert';

// 문제 유형 (통합 포맷)
export type QuestionType =
  | '5_choice' | '4_choice' | 'ox'
  | 'blank_fill' | 'word_arrange' | 'speaking' | 'writing';

export interface Question {
  id: string;
  subject: ChapterSubject;
  type: QuestionType;
  level: number;           // 1~10
  question: string;
  passage?: string;
  options?: string[];      // 객관식
  answer?: number;         // 0-indexed. 서술형은 null
  explanation: {
    level: 1 | 2 | 3;     // 해설 깊이 (1=단답, 2=풀이, 3=유형분류)
    text: string;
  };
}

// 영어 에피소드
export interface EnglishEpisode {
  id: string;
  season: number;
  episodeNum: number;
  title: string;
  situationTag: string;   // 'email' | 'meeting' | 'presentation' | ...
  difficulty: 1 | 2 | 3 | 4 | 5;
  steps: EpisodeStep[];
}

export interface EpisodeStep {
  step: 1 | 2 | 3 | 4 | 5;
  contentType: 'story' | 'vocab_match' | 'blank_fill' | 'word_arrange' | 'speaking' | 'writing';
  contentJson: Record<string, unknown>;
  audioUrl?: string;      // STEP 3·4용 S3 URL
}
```

---

## 4. 데이터베이스 스키마

### 핵심 테이블 (Prisma 형식)

```prisma
// ── 사용자 ──
model User {
  id          String      @id @default(cuid())
  email       String      @unique
  nickname    String
  provider    String      // 'kakao' | 'naver' | 'google'
  providerId  String
  plan        PlanType    @default(free)
  planExpiresAt DateTime?
  createdAt   DateTime    @default(now())

  // 관계
  progress    UserProgress[]
  xpLogs      XpLog[]
  dailySummary DailySummary[]
  streak      Streak?
  hearts      Hearts?
  leagueMember LeagueMember?
  roomItems   RoomItem[]
  subscriptions Subscription[]
}

// ── 챕터 진행 상태 ──
model UserProgress {
  id          String   @id @default(cuid())
  userId      String
  subject     String   // ChapterSubject
  level       Int      @default(1)
  xpTotal     Int      @default(0)
  chaptersToday Int    @default(0)  // 오늘 완료한 챕터 수
  lastSessionAt DateTime?
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])
  @@unique([userId, subject])
}

// ── XP 로그 (잔디 집계 기반) ──
model XpLog {
  id        String   @id @default(cuid())
  userId    String
  xp        Int
  source    String   // 'aptitude_lang' | 'english' | 'it' | ...
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  @@index([userId, createdAt])
}

// ── 일별 XP 집계 (잔디용) ──
model DailySummary {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime @db.Date    // KST 기준 날짜
  totalXp   Int      @default(0)
  sessions  Json     // { english: 1, aptitude: 3, it: 1 }
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id])
  @@unique([userId, date])
}

// ── 스트릭 ──
model Streak {
  userId        String   @id
  current       Int      @default(0)
  longest       Int      @default(0)
  lastActiveDate DateTime? @db.Date
  freezeCount   Int      @default(1)   // 주 1회 무료 프리즈
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id])
}

// ── 하트 ──
model Hearts {
  userId    String   @id
  count     Int      @default(5)
  maxCount  Int      @default(5)    // 플랜에 따라 다름
  lastRefillAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id])
}

// ── 콘텐츠: 문제 ──
model Question {
  id          String   @id @default(cuid())
  subject     String
  type        String
  level       Int
  question    String
  passage     String?
  options     Json?    // string[]
  answer      Int?
  explanation Json     // { level, text }
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

// ── 콘텐츠: 영어 에피소드 ──
model EnglishEpisode {
  id           String        @id @default(cuid())
  season       Int
  episodeNum   Int
  title        String
  situationTag String
  difficulty   Int
  isActive     Boolean       @default(true)
  createdAt    DateTime      @default(now())

  steps        EpisodeStep[]
  @@unique([season, episodeNum])
}

model EpisodeStep {
  id          String         @id @default(cuid())
  episodeId   String
  step        Int            // 1~5
  contentType String
  contentJson Json
  audioUrl    String?

  episode     EnglishEpisode @relation(fields: [episodeId], references: [id])
  @@unique([episodeId, step])
}

// ── 리그 ──
model LeagueGroup {
  id        String         @id @default(cuid())
  season    Int
  week      Int
  tier      String         // 'bronze' | 'silver' | 'gold' | 'diamond'
  members   LeagueMember[]
}

model LeagueMember {
  id        String      @id @default(cuid())
  groupId   String
  userId    String      @unique
  weeklyXp  Int         @default(0)
  rank      Int?
  promoted  Boolean?
  relegated Boolean?

  group     LeagueGroup @relation(fields: [groupId], references: [id])
  user      User        @relation(fields: [userId], references: [id])
}

// ── MyRoom 아이템 ──
model RoomItem {
  id        String   @id @default(cuid())
  userId    String
  itemId    String   // 아이템 고유 키
  equipped  Boolean  @default(false)
  gridRow   Int?     // 배치 좌표 (타일 그리드)
  gridCol   Int?
  unlockedAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  @@unique([userId, itemId])
}

// ── 구독 ──
model Subscription {
  id           String   @id @default(cuid())
  userId       String
  plan         String   // 'light' | 'premium'
  status       String   // 'active' | 'cancelled' | 'expired'
  billingKey   String?  // Toss Payments 빌링키
  startAt      DateTime
  nextBillingAt DateTime?
  cancelledAt  DateTime?
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id])
}
```

---

## 5. API 설계

### REST 엔드포인트 목록

```
# 인증
POST   /auth/social          소셜 로그인 (카카오/네이버/구글)
POST   /auth/refresh         토큰 갱신
DELETE /auth/session         로그아웃

# 챕터 & 학습
GET    /chapters/today        오늘 학습 현황 (완료 챕터 수, 남은 챕터)
POST   /chapters/start        챕터 시작 (요금제 게이트 체크)
POST   /chapters/complete     챕터 완료 + XP 적립 + 스트릭 업데이트

# 직무적성
GET    /questions/aptitude    과목·레벨별 문제 2개 조회
POST   /questions/submit      답안 제출 + 정오 확인

# 영어 에피소드
GET    /english/today         오늘의 에피소드 조회
GET    /english/:id/steps     에피소드 단계별 콘텐츠
POST   /english/step/complete 단계 완료 저장
POST   /english/writing/grade 쓰기 AI 채점 (GPT)

# IT 상식
GET    /questions/it          IT 상식 문제 5개 조회

# 게임화
GET    /gamification/status   XP, 스트릭, 하트, 레벨 전체 조회
POST   /hearts/use            하트 1개 소모
GET    /league/current        현재 리그 그룹 + 순위
GET    /league/history        지난 리그 기록

# 잔디
GET    /garden/:userId        52주 잔디 데이터 (DailySummary 집계)
GET    /garden/today          오늘 XP 실시간 (Redis)

# MyRoom
GET    /myroom/items          보유 아이템 + 배치 정보 조회
PUT    /myroom/layout         아이템 배치 저장 (debounce 후 1회)
POST   /myroom/unlock         아이템 잠금 해제 체크

# 자격증
GET    /certs                 자격증 과정 목록
GET    /certs/:id             자격증 상세 + 커리큘럼
POST   /certs/:id/plan        D-Day 설정 → 일별 플랜 생성

# 결제
POST   /payment/subscribe     구독 시작 (빌링키 발급)
POST   /payment/purchase      단건 구매
DELETE /payment/subscribe     구독 해지
GET    /payment/history       결제 이력
```

### 챕터 게이트 응답 구조

```typescript
// GET /chapters/today 응답
interface TodayStatus {
  date: string;                     // "2024-11-14"
  plan: PlanType;                   // 'free' | 'light' | 'premium'
  chaptersAllowed: number | null;   // null = 무제한 (premium)
  chaptersUsed: number;
  chaptersRemaining: number | null;
  subjects: {
    subject: ChapterSubject;
    completed: boolean;
    level: number;
  }[];
  streak: number;
  xpToday: number;
  hearts: number;
}
```

---

## 6. 핵심 기능 구현 가이드

### 6.1 챕터 시스템 & 요금제 게이트

챕터 시작 시 서버에서 요금제를 확인하고 허용 여부를 반환합니다. **클라이언트 단독으로 요금제를 판단하지 않습니다.**

```typescript
// 백엔드: ChaptersService
async startChapter(userId: string, subject: ChapterSubject) {
  const user = await this.getUserWithPlan(userId);
  const todayCount = await this.getChaptersUsedToday(userId);

  const limits = { free: 3, light: 8, premium: Infinity };
  const limit = limits[user.plan];

  if (todayCount >= limit) {
    throw new ForbiddenException({
      code: 'CHAPTER_LIMIT_REACHED',
      plan: user.plan,
      used: todayCount,
      limit,
    });
  }

  // 챕터 시작 기록
  await this.recordChapterStart(userId, subject);
  return { allowed: true, remaining: limit === Infinity ? null : limit - todayCount - 1 };
}
```

```typescript
// 프론트엔드: 챕터 잠금 UI 처리
const { data, error } = await startChapter(subject);

if (error?.code === 'CHAPTER_LIMIT_REACHED') {
  showUpgradeModal(error.plan); // 요금제 업그레이드 유도 모달
  return;
}
```

---

### 6.2 직무적성 퀴즈 (3과목 × 2문제)

#### 문제 조회 로직

```typescript
// 백엔드: 과목별 레벨에 맞는 문제 2개 랜덤 조회
async getAptitudeQuestions(userId: string, subject: 'lang' | 'num' | 'rea') {
  const progress = await this.getProgress(userId, `aptitude_${subject}`);
  const level = progress?.level ?? 1;

  // 이미 최근 7일 내 풀었던 문제는 제외 (오답 제외 로직)
  const recentIds = await this.getRecentQuestionIds(userId, subject, 7);

  return this.questionRepo.findMany({
    where: {
      subject: `aptitude_${subject}`,
      level,
      isActive: true,
      id: { notIn: recentIds },
    },
    take: 2,
    orderBy: { id: 'asc' }, // 결정론적 순서. 실제 운영 시 랜덤화 필요
  });
}
```

#### 레벨업 조건

```typescript
// 챕터 완료 시 레벨업 체크
async checkLevelUp(userId: string, subject: string, correctCount: number) {
  const progress = await this.getProgress(userId, subject);
  // 레벨당 누적 정답 30개 기준 레벨업
  const newXp = progress.xpTotal + correctCount;
  const newLevel = Math.min(10, Math.floor(newXp / 30) + 1);

  if (newLevel > progress.level) {
    await this.unlockRoomItem(userId, subject, newLevel); // MyRoom 아이템 해제
    return { leveled: true, from: progress.level, to: newLevel };
  }
  return { leveled: false };
}
```

#### 오답 해설 깊이 결정

```typescript
// 문제 레벨에 따라 해설 깊이 자동 결정
function getExplanationLevel(questionLevel: number): 1 | 2 | 3 {
  if (questionLevel <= 5) return 1;  // 단답 (정답 + 1문장)
  if (questionLevel <= 8) return 2;  // 풀이 과정
  return 3;                          // 유형 분류 + 빈출 패턴
}
```

---

### 6.3 비즈니스 영어 스토리 5단계 세션

#### 세션 오케스트레이터 구조

프로토타입(jobup-v6.html)의 `engStep` 변수 기반 상태 관리를 React 컴포넌트로 구조화합니다.

```typescript
// 세션 전체 상태 (Zustand store)
interface EnglishSessionStore {
  episodeId: string | null;
  currentStep: 1 | 2 | 3 | 4 | 5;
  stepResults: {
    step: number;
    completed: boolean;
    skipped: boolean;
    xpEarned: number;
  }[];
  totalXp: number;

  // 액션
  startSession: (episodeId: string) => void;
  completeStep: (step: number, xp: number, skipped?: boolean) => void;
  resetSession: () => void;
}
```

```typescript
// 세션 오케스트레이터 컴포넌트
const STEPS = [
  { step: 1, component: StoryReader,     xpMax: 5  },
  { step: 2, component: VocabMatcher,    xpMax: 20 },
  { step: 3, component: ListenArrange,   xpMax: 20 },
  { step: 4, component: SpeakShadow,     xpMax: 20, skippable: true },
  { step: 5, component: WritingTask,     xpMax: 15 },
];

export function EnglishSessionOrchestrator({ episodeId }: { episodeId: string }) {
  const { currentStep, completeStep } = useEnglishSessionStore();
  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <SessionLayout
      step={currentStep}
      totalSteps={5}
      onStepComplete={(xp, skipped) => completeStep(currentStep, xp, skipped)}
    >
      <CurrentStepComponent episodeId={episodeId} />
    </SessionLayout>
  );
}
```

#### STEP 3 — 듣기 (단어 배열) 구현

```typescript
// contentJson 구조
interface ListenArrangeContent {
  sentence: string;          // "I am writing to reschedule our meeting."
  words: string[];           // ["I", "am", "writing", "to", "reschedule", "our", "meeting"]
  audioUrl: string;          // S3 MP3 URL
}

// 컴포넌트 핵심 로직
function ListenArrange({ content }: { content: ListenArrangeContent }) {
  const [shuffled] = useState(() => shuffle(content.words));
  const [placed, setPlaced] = useState<string[]>([]);

  const isCorrect = placed.join(' ') === content.words.join(' ');

  return (
    <>
      <AudioPlayer src={content.audioUrl} />
      {/* 배치된 단어 슬롯 */}
      <PlacedSlots words={placed} onRemove={(i) => removeWord(i)} />
      {/* 단어 뱅크 */}
      <WordBank words={shuffled} placed={placed} onPick={(w) => setPlaced([...placed, w])} />
      {isCorrect && <SuccessBanner onNext={handleNext} />}
    </>
  );
}
```

#### STEP 4 — 말하기 (음성 채점) 구현

> **Phase 1 전략**: 발음 정확도 채점이 아닌 **발화 감지 완료 트리거** 방식으로 단순화

```typescript
function SpeakShadow({ sentence, audioUrl, onComplete }: SpeakShadowProps) {
  const [recording, setRecording] = useState(false);
  const recognition = useRef<SpeechRecognition | null>(null);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      // 미지원 환경 → 스킵 처리
      onComplete({ xp: 0, skipped: true });
      return;
    }
    recognition.current = new webkitSpeechRecognition();
    recognition.current.lang = 'en-US';
    recognition.current.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      // Phase 1: 발화가 감지되면 완료 처리 (정확도 무관)
      const xp = transcript.length > 3 ? 20 : 5;
      onComplete({ xp, skipped: false, transcript });
    };
    recognition.current.start();
    setRecording(true);
  };

  return (
    <>
      <SentenceDisplay sentence={sentence} />
      <AudioPlayer src={audioUrl} />
      <MicButton recording={recording} onPress={startRecording} />
      <SkipButton onSkip={() => onComplete({ xp: 0, skipped: true })} />
    </>
  );
}
```

#### STEP 5 — 쓰기 (GPT 채점)

```typescript
// 백엔드: EnglishService.gradeWriting()
async gradeWriting(userId: string, episodeId: string, answer: string): Promise<GradeResult> {
  // 1차 필터: 클라이언트에서 처리하지만 서버에서도 재검증
  const wordCount = answer.trim().split(/\s+/).length;
  if (wordCount < 10) {
    return { score: 0, feedback: '10단어 이상 작성해주세요.', xp: 0 };
  }

  // 한국어 입력 감지 → GPT 호출 없이 반려
  if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(answer)) {
    return { score: 0, feedback: '영어로 작성해주세요.', xp: 0 };
  }

  const episode = await this.getEpisode(episodeId);
  const writingStep = episode.steps.find(s => s.step === 5);

  // GPT-4o-mini 채점 (비용 최적화)
  const prompt = `
You are grading a business English writing task.

Situation: ${writingStep.contentJson.situation}
Student answer: "${answer}"

Grade on these criteria (total 5 points):
- Word count ≥ 10: 1 point
- Key expression usage (${writingStep.contentJson.keyExpressions?.join(', ')}): 0-2 points
- Grammar naturalness: 0-2 points

Respond in JSON only:
{ "score": number, "feedback": "one improvement tip in Korean (max 30 chars)", "modelAnswer": "one example sentence in English" }
`;

  const response = await this.openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content);
  const xp = Math.round((result.score / 5) * 15); // 최대 15 XP

  return { ...result, xp };
}
```

#### 중간 저장 (이탈 대비)

```typescript
// POST /english/step/complete
// 단계 완료 시마다 서버에 저장 → 재진입 시 이어하기 가능
async saveStepProgress(userId: string, data: {
  episodeId: string;
  step: number;
  completed: boolean;
  skipped: boolean;
  xpEarned: number;
}) {
  await this.sessionRepo.upsert({
    where: { userId_episodeId: { userId, episodeId: data.episodeId } },
    update: { [`step${data.step}Done`]: true, totalXp: { increment: data.xpEarned } },
    create: { userId, episodeId: data.episodeId, [`step${data.step}Done`]: true, totalXp: data.xpEarned },
  });
}
```

---

### 6.4 IT 상식 챕터

```typescript
// 문제 5개 랜덤 조회 (같은 카테고리 내)
async getItQuestions(userId: string) {
  // 카테고리 순환: 매일 다른 카테고리 우선
  const categories = ['ai', 'cloud', 'security', 'data', 'trend'];
  const todayCategory = categories[new Date().getDay() % categories.length];

  return this.questionRepo.findMany({
    where: { subject: 'it', category: todayCategory, isActive: true },
    take: 5,
    orderBy: { id: 'asc' },
  });
}
```

---

### 6.5 게임화 — XP · 스트릭 · 하트

#### XP 적립 규칙

```typescript
const XP_RULES = {
  aptitude_correct: 5,    // 정답 1개당
  aptitude_wrong:   1,    // 오답도 소량 지급 (참여 보상)
  english_step_base: [5, 10, 15, 15, 10],  // STEP별 기본 XP
  it_correct: 4,
  streak_bonus: (streak: number) => Math.min(streak * 2, 20), // 최대 +20 XP
};

async awardXp(userId: string, source: string, amount: number) {
  const streak = await this.getStreak(userId);
  const bonus = XP_RULES.streak_bonus(streak.current);
  const total = amount + bonus;

  // XP 로그 기록 (잔디 집계용)
  await this.xpLogRepo.create({ data: { userId, xp: total, source } });

  // 오늘의 DailySummary 업데이트 (upsert)
  const today = getKSTDate(); // KST 기준 날짜
  await this.dailySummaryRepo.upsert({
    where: { userId_date: { userId, date: today } },
    update: { totalXp: { increment: total } },
    create: { userId, date: today, totalXp: total },
  });

  // Redis에 오늘 XP 실시간 반영 (잔디 즉시 갱신용)
  await this.redis.incrBy(`xp:today:${userId}`, total);
  await this.redis.expireAt(`xp:today:${userId}`, getEndOfKSTDay());

  return total;
}
```

#### 스트릭 업데이트

```typescript
async updateStreak(userId: string) {
  const streak = await this.streakRepo.findUnique({ where: { userId } });
  const today = getKSTDate();
  const yesterday = addDays(today, -1);

  if (!streak) {
    return this.streakRepo.create({ data: { userId, current: 1, longest: 1, lastActiveDate: today } });
  }

  const lastDate = streak.lastActiveDate;

  if (isSameDay(lastDate, today)) return streak;  // 이미 오늘 완료

  if (isSameDay(lastDate, yesterday)) {
    // 연속
    const newCurrent = streak.current + 1;
    return this.streakRepo.update({
      where: { userId },
      data: { current: newCurrent, longest: Math.max(newCurrent, streak.longest), lastActiveDate: today },
    });
  }

  // 끊김 → 리셋
  return this.streakRepo.update({
    where: { userId },
    data: { current: 1, lastActiveDate: today },
  });
}
```

#### 하트 관리

```typescript
// 하트 충전 로직 (4시간마다 1개. 최대 5개. Light는 7개, Premium은 무제한)
async refillHearts(userId: string, plan: PlanType) {
  if (plan === 'premium') return; // 무제한이므로 관리 불필요

  const hearts = await this.heartsRepo.findUnique({ where: { userId } });
  const maxCount = plan === 'light' ? 7 : 5;
  const refillInterval = plan === 'light' ? 3 : 4; // 시간 단위

  const hoursSinceLast = differenceInHours(new Date(), hearts.lastRefillAt);
  const refillAmount = Math.floor(hoursSinceLast / refillInterval);

  if (refillAmount > 0) {
    const newCount = Math.min(hearts.count + refillAmount, maxCount);
    await this.heartsRepo.update({
      where: { userId },
      data: { count: newCount, lastRefillAt: new Date(), maxCount },
    });
  }
}
```

---

### 6.6 리그전 (League)

```typescript
// 매주 월요일 자정(KST) 리그 리셋 (Cron Job)
@Cron('0 0 * * 1', { timeZone: 'Asia/Seoul' })
async resetLeague() {
  // 1. 이번 주 그룹별 최종 순위 계산
  const groups = await this.leagueGroupRepo.findAll({ where: { week: currentWeek } });

  for (const group of groups) {
    const sorted = group.members.sort((a, b) => b.weeklyXp - a.weeklyXp);

    // 상위 3명 승급, 하위 3명 강등
    sorted.forEach((member, i) => {
      const promoted = i < 3;
      const relegated = i >= sorted.length - 3;
      this.leagueMemberRepo.update({ where: { id: member.id }, data: { rank: i + 1, promoted, relegated } });
    });
  }

  // 2. 다음 주 그룹 생성 (10명씩 배분)
  await this.createNextWeekGroups();
}

// Redis Sorted Set으로 실시간 순위 관리
async updateLeagueRank(userId: string, xp: number) {
  const groupId = await this.getUserGroupId(userId);
  await this.redis.zIncrBy(`league:${groupId}`, xp, userId);
}

async getLeagueRanking(groupId: string) {
  return this.redis.zRangeWithScores(`league:${groupId}`, 0, -1, { REV: true });
}
```

---

### 6.7 Activity Garden (학습 잔디)

#### 데이터 조회 전략

```typescript
// GET /garden/:userId — 52주 데이터
async getGardenData(userId: string) {
  const endDate = getKSTDate();
  const startDate = addDays(endDate, -364); // 52주 전

  // 과거 데이터: PostgreSQL DailySummary에서 배치 집계
  const pastData = await this.dailySummaryRepo.findMany({
    where: { userId, date: { gte: startDate, lt: endDate } },
    select: { date: true, totalXp: true },
  });

  // 오늘 데이터: Redis에서 실시간 조회 (즉각 업데이트)
  const todayXp = await this.redis.get(`xp:today:${userId}`);
  const todayEntry = { date: endDate, totalXp: parseInt(todayXp ?? '0') };

  // 52주 × 7일 = 364셀 배열로 변환
  return buildGardenGrid([...pastData, todayEntry], startDate, endDate);
}

// 셀 색상 레벨 결정
function getXpLevel(xp: number): 0 | 1 | 2 | 3 | 4 {
  if (xp === 0)   return 0;
  if (xp < 20)    return 1;
  if (xp < 50)    return 2;
  if (xp < 100)   return 3;
  return 4;
}
```

#### 프론트엔드 SVG 렌더링

```typescript
// 프로토타입(jobup-v6.html)의 buildGarden() 함수를 React 컴포넌트로 전환
export function ActivityGarden({ data }: { data: GardenCell[] }) {
  return (
    <div className="garden-container">
      <svg viewBox={`0 0 ${52 * 12} ${7 * 12}`} className="w-full">
        {data.map((cell, i) => {
          const col = Math.floor(i / 7);
          const row = i % 7;
          return (
            <Tooltip key={i} content={`${cell.date} · ${cell.xp} XP`}>
              <rect
                x={col * 12}
                y={row * 12}
                width={10}
                height={10}
                rx={2}
                fill={LEVEL_COLORS[cell.level]}
                className="cursor-pointer hover:opacity-70"
              />
            </Tooltip>
          );
        })}
      </svg>
      <GardenStats data={data} />
    </div>
  );
}

const LEVEL_COLORS = {
  0: '#252B3E',   // 회색 (0 XP)
  1: '#1B4A30',   // 연두
  2: '#1F6B40',   // 초록
  3: '#249350',   // 진초록
  4: '#27D98A',   // 최고 (100+ XP)
};
```

---

### 6.8 MyRoom (아이소메트릭 공부방)

#### 아이소메트릭 렌더링 전략

프로토타입(jobup-v6.html)에서 구현한 SVG 아이소메트릭 방식을 그대로 활용합니다. 외부 에셋(이미지) 없이 순수 SVG 폴리곤으로 렌더링하여 에셋 비용과 로딩 시간을 절약합니다.

```typescript
// 아이소메트릭 좌표 변환 함수 (프로토타입에서 가져옴)
// isoX = cx + (x - y) * tileW / 2
// isoY = cy + (x + y) * tileH / 2 - z * heightZ
export function toIso(x: number, y: number, z: number = 0, config = ISO_CONFIG) {
  return {
    sx: config.cx + (x - y) * config.tw / 2,
    sy: config.cy + (x + y) * config.th / 2 - z * config.hz,
  };
}

const ISO_CONFIG = { cx: 200, cy: 220, tw: 56, th: 28, hz: 24 };
```

#### 아이템 배치 저장 (debounce)

```typescript
// 프론트엔드: 배치 변경 시 debounce 후 저장
const saveLayout = useDebouncedCallback(async (items: RoomItem[]) => {
  await api.put('/myroom/layout', {
    items: items.map(item => ({
      itemId: item.itemId,
      gridRow: item.gridRow,
      gridCol: item.gridCol,
    })),
  });
}, 1500); // 1.5초 후 저장

// 화면 이탈 시 즉시 저장
useEffect(() => {
  const handleUnload = () => saveLayout.flush(); // 즉시 실행
  window.addEventListener('beforeunload', handleUnload);
  return () => window.removeEventListener('beforeunload', handleUnload);
}, []);
```

#### 아이템 잠금 해제 로직

```typescript
// 백엔드: 잠금 해제 조건 체크
const UNLOCK_CONDITIONS: Record<string, (stats: UserStats) => boolean> = {
  'item_dict_shelf':     (s) => s.langLevel >= 3,
  'item_calc_statue':    (s) => s.numLevel >= 3,
  'item_puzzle_frame':   (s) => s.reaLevel >= 3,
  'item_whiteboard':     (s) => s.streakLongest >= 7,
  'item_big_calendar':   (s) => s.streakLongest >= 30,
  'item_english_shelf':  (s) => s.englishSessions >= 30,
  'item_cert_frame':     (s) => s.certsCompleted >= 1,
  'item_trophy_gold':    (s) => s.leagueFirstCount >= 1,
  'item_premium_chair':  (s) => s.plan === 'premium',
  'item_floor_lamp':     (s) => s.plan === 'premium',
};

async checkAndUnlockItems(userId: string) {
  const stats = await this.getUserStats(userId);
  const owned = await this.getOwnedItemIds(userId);
  const newUnlocks: string[] = [];

  for (const [itemId, condition] of Object.entries(UNLOCK_CONDITIONS)) {
    if (!owned.includes(itemId) && condition(stats)) {
      await this.unlockItem(userId, itemId);
      newUnlocks.push(itemId);
    }
  }

  return newUnlocks; // 프론트에서 언락 토스트 표시
}
```

---

### 6.9 자격증 D-Day 플랜

```typescript
// POST /certs/:id/plan
async createDayPlan(userId: string, certId: string, examDate: Date) {
  const cert = await this.getCert(certId);
  const today = getKSTDate();
  const daysLeft = differenceInDays(examDate, today);

  if (daysLeft < 1) throw new BadRequestException('시험일이 이미 지났습니다.');

  // 일별 학습량 계산 (유동 조정 방식)
  const totalChapters = cert.totalChapters; // e.g., 재경관리사 = 45챕터
  const chaptersPerDay = Math.ceil(totalChapters / daysLeft);
  const adjustedDays = Math.ceil(totalChapters / chaptersPerDay);

  // 플랜 생성
  const plan = Array.from({ length: adjustedDays }, (_, i) => ({
    day: i + 1,
    date: addDays(today, i),
    chapters: cert.chapters.slice(i * chaptersPerDay, (i + 1) * chaptersPerDay),
    isReview: i >= totalChapters,  // 마지막 날들은 복습 모드
  }));

  await this.planRepo.create({
    data: {
      userId,
      certId,
      examDate,
      chaptersPerDay,
      plan: plan as any, // JSONB
    },
  });

  return { daysLeft, chaptersPerDay, adjustedDays };
}
```

---

### 6.10 결제 & 구독 관리

```typescript
// Toss Payments 구독 자동결제 플로우
// 1단계: 카드 등록 (빌링키 발급)
async registerCard(userId: string, authKey: string, customerKey: string) {
  const { billingKey } = await tossPayments.issueBillingKey({ authKey, customerKey });
  await this.subscriptionRepo.update({ where: { userId }, data: { billingKey } });
  return billingKey;
}

// 2단계: 정기 결제 실행 (매월 Cron)
@Cron('0 9 * * *', { timeZone: 'Asia/Seoul' }) // 매일 오전 9시 만료 체크
async processSubscriptions() {
  const due = await this.subscriptionRepo.findMany({
    where: { status: 'active', nextBillingAt: { lte: new Date() } },
  });

  for (const sub of due) {
    try {
      const amount = sub.plan === 'light' ? 1900 : 4900;
      await tossPayments.confirmBillingKey({
        billingKey: sub.billingKey,
        amount,
        orderId: `order_${sub.id}_${Date.now()}`,
        orderName: `JobUp ${sub.plan === 'light' ? '라이트' : '프리미엄'} 구독`,
      });
      // 다음 결제일 설정
      await this.subscriptionRepo.update({
        where: { id: sub.id },
        data: { nextBillingAt: addMonths(new Date(), 1) },
      });
    } catch (e) {
      // 결제 실패 → 3회 재시도 후 구독 중지
      await this.handlePaymentFailure(sub);
    }
  }
}
```

---

## 7. Admin CMS

콘텐츠팀이 개발자 없이 독립적으로 문제·에피소드를 관리할 수 있어야 합니다. **Phase 0에서 반드시 구현**해야 합니다.

### 필수 구현 기능 목록

| 기능 | 우선순위 | 비고 |
|---|---|---|
| 직무적성 문제 CRUD | 🔴 Phase 0 | 과목·레벨·문제유형·해설 입력 폼 |
| IT 상식 문제 CRUD | 🔴 Phase 0 | 카테고리 태그 포함 |
| 영어 에피소드 등록 | 🔴 Phase 0 | 5단계별 JSON 입력 + 오디오 파일 업로드 |
| 문제 활성화/비활성화 | 🟡 Phase 0 | 오류 문제 즉시 숨김 처리 |
| 심화·자격증 커리큘럼 편집 | 🟡 Phase 1 | 챕터 순서 드래그 조정 |
| MyRoom 아이템 잠금 조건 설정 | 🟢 Phase 2 | 조건 변경 시 코드 수정 없이 처리 |
| 콘텐츠 통계 대시보드 | 🟡 Phase 1 | 문제별 정답률, 에피소드 완주율 |

### 에피소드 등록 폼 데이터 구조

```typescript
// Admin에서 입력받는 에피소드 등록 폼
interface EpisodeCreateInput {
  season: number;
  episodeNum: number;
  title: string;
  situationTag: 'email' | 'meeting' | 'call' | 'presentation' | 'negotiation' | 'report';
  difficulty: 1 | 2 | 3 | 4 | 5;

  step1_story: string;              // 스토리 본문 (80~120단어)
  step1_highlights: string[];       // 하이라이트 단어 목록

  step2_type: 'vocab_match' | 'blank_fill';
  step2_items: {                    // vocab_match: [{word, definition}]
    word: string;                   // blank_fill: [{sentence, answer, options}]
    definition?: string;
    sentence?: string;
    answer?: string;
    options?: string[];
  }[];

  step3_sentence: string;           // 듣기 문장
  step3_audio: File;               // MP3 업로드 → S3

  step4_sentence: string;           // 말하기 문장
  step4_audio: File;               // MP3 업로드 → S3

  step5_situation: string;          // 쓰기 상황 설명
  step5_keyExpressions: string[];   // GPT 채점 시 포함 여부 확인할 핵심 표현
  step5_modelAnswer: string;        // 모범 답안 예시
}
```

---

## 8. 인증 & 보안

### 소셜 로그인 플로우

```
사용자 → [카카오/네이버/구글 버튼] → OAuth 인증 → NextAuth 콜백
→ JWT Access Token (15분) + Refresh Token (30일) 발급
→ Access Token: HTTP-Only Cookie
→ Refresh Token: DB 저장 + HTTP-Only Cookie
```

```typescript
// NextAuth 설정
export const authOptions: NextAuthOptions = {
  providers: [
    KakaoProvider({ clientId: process.env.KAKAO_CLIENT_ID!, clientSecret: process.env.KAKAO_CLIENT_SECRET! }),
    NaverProvider({ clientId: process.env.NAVER_CLIENT_ID!, clientSecret: process.env.NAVER_CLIENT_SECRET! }),
    GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // DB에 사용자 upsert
      await syncUserToDB(user, account);
      return true;
    },
    async jwt({ token, account }) {
      if (account) token.plan = await getUserPlan(token.sub);
      return token;
    },
  },
};
```

### API 보안 원칙

- 모든 API는 JWT 인증 필수. 공개 API (`/auth/*`, `/certs` 목록)만 예외
- **챕터 게이트는 반드시 서버에서 검증**. 클라이언트 단독 판단 금지
- 요금제 정보는 JWT에 포함하되, 민감한 결제 로직은 서버에서만 처리
- OpenAI API Key는 절대 클라이언트에 노출 금지. 백엔드 프록시를 통해서만 호출

---

## 9. 인프라 & 배포

### 초기 구성 (Phase 0~1, 비용 최소화)

```
프론트엔드: Vercel (무료 플랜 시작 → Pro 전환 시 $20/월)
백엔드 API: AWS EC2 t3.small (월 약 $15)
DB: AWS RDS db.t3.micro PostgreSQL (월 약 $13)
Redis: AWS ElastiCache t3.micro (월 약 $13)
스토리지: AWS S3 + CloudFront (사용량 기반, 초기 월 $5~10)
─────────────────────────────────────────────────────
초기 인프라 월 비용: 약 $46~51 (약 6~7만원)
```

### 환경 변수 목록

```bash
# DB
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# 결제
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=

# OpenAI
OPENAI_API_KEY=

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-northeast-2
S3_BUCKET_NAME=jobup-assets
CLOUDFRONT_URL=https://cdn.jobup.kr

# 앱
NEXT_PUBLIC_APP_URL=https://jobup.kr
```

### CI/CD

```yaml
# .github/workflows/deploy.yml (간략)
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      # Vercel이 자동 배포. 추가 설정 불필요
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to EC2
        run: |
          ssh ec2-user@${{ secrets.EC2_HOST }} "
            cd /app && git pull &&
            npm ci && npm run build &&
            pm2 restart jobup-api
          "
```

---

## 10. Phase별 개발 범위

### Phase 0 — 환경 구축 (1~2개월)

**개발 우선순위**

1. 모노레포 초기화 (Turborepo)
2. **DB 스키마 확정 + Prisma 마이그레이션** ← 콘텐츠팀 합류 전 필수 완료
3. 소셜 로그인 (NextAuth)
4. **Admin CMS — 문제 CRUD, 에피소드 등록** ← 콘텐츠팀 독립 작업 가능하게
5. 기본 API 골격 (인증 미들웨어, 에러 핸들러)
6. 통합 문제 포맷 JSON 스펙 확정 + 콘텐츠팀 문서 공유
7. TTS 방식 결정: **Phase 1은 사전 녹음 MP3** 고정
   - S3 폴더 구조: `audio/english/s{season}/ep{num}/step{3|4}.mp3`
   - 파일 명명 규칙을 콘텐츠·개발팀이 합의하여 문서화

**Phase 0 완료 기준**

- [ ] Admin에서 직무적성 문제 등록 → DB 저장 확인
- [ ] Admin에서 영어 에피소드 등록 + MP3 업로드 → S3 저장 확인
- [ ] 소셜 로그인 → JWT 발급 → 보호된 API 호출 확인

---

### Phase 1 — MVP 출시 (3~6개월)

**개발 범위**

- 직무적성 세션 (3과목 × 2문제, 레벨 시스템)
- 비즈니스 영어 STEP 1~3 (읽기·어휘·듣기 배열) — **STEP 4·5는 Phase 1 후반**
- IT 상식 챕터 (5문제)
- 챕터 게이트 (요금제별 제한)
- XP · 스트릭 · 하트 (기본)
- 리그전 (기본. 10명 그룹)
- Activity Garden (잔디) — 기본 버전
- MyRoom — Phase 1 후반, SVG 아이소메트릭 기본 방 + 아이템 3종
- Toss Payments 결제 (단건 구매 + 구독)
- 자격증 과정 1~2종 (재경관리사, TESAT)

**MVP 완료 기준**

- [ ] 무료 사용자가 3챕터 완료 후 4챕터 시도 시 업그레이드 모달 노출
- [ ] 영어 STEP 3에서 단어 배열 완료 → XP 적립 → 잔디 색상 변경 확인
- [ ] 결제 완료 후 Light 플랜 전환 → 챕터 한도 8개로 변경 확인
- [ ] 매주 월요일 리그 순위 리셋 확인

---

### Phase 2 — 유료화 강화 (7~10개월)

- 영어 STEP 4 (말하기. Web Speech API)
- 영어 STEP 5 (쓰기. GPT-4o-mini 채점)
- 심화 과정 3종 (공기업·대기업·금융권)
- 자격증 과정 5종 추가
- AI 자소서 첨삭 (GPT)
- MyRoom 전체 아이템 + 아이소메트릭 완성
- B2B 기업 구독 기초
- Google Cloud TTS 전환 (영어 오디오 자동 생성)

---

### Phase 3 — 앱 전환 (11~16개월)

- React Native (Expo) 전환
- 푸시 알림 (FCM) — 스트릭 유지 알림, 리그 순위 변동
- 앱스토어·플레이스토어 등록
- 오프라인 퀴즈 캐싱

---

### Phase 4 — 확장 (17개월~)

- 공무원 과정 (국어·영어·한국사·행정법)
- 코딩테스트 기초 (Python, SQL)
- 직장인 이직 서비스

---

## 11. 프로토타입 → 실제 구현 매핑

> 참조 파일: `jobup-v6.html`

프로토타입의 주요 함수·컴포넌트가 실제 구현에서 어떻게 대응되는지 정리합니다.

| 프로토타입 (jobup-v6.html) | 실제 구현 위치 | 비고 |
|---|---|---|
| `go(screenId)` | Next.js App Router 페이지 라우팅 | `router.push('/learn/english')` |
| `buildGarden()` | `components/garden/ActivityGarden.tsx` | SVG 렌더링 로직 동일하게 가져옴 |
| `startEng()` + `renderStep()` | `components/english/EnglishSessionOrchestrator.tsx` | Zustand store로 상태 관리 |
| `placeWord()` / `wbank` | `components/english/ListenArrange.tsx` | 단어 배열 UI |
| `toggleMic()` | `components/english/SpeakShadow.tsx` | Web Speech API 래핑 |
| `checkWrite()` | `POST /english/writing/grade` (백엔드) | GPT 채점은 서버에서만 |
| `isoTip()` + SVG 방 전체 | `components/myroom/IsometricRoom.tsx` | SVG 폴리곤 그대로 활용 |
| `dTab()` (서랍 탭) | `components/myroom/ItemDrawer.tsx` | |
| `resetQuiz()` / `submitQ()` | `components/quiz/QuizSession.tsx` | |
| `buildGarden()` (잔디 격자) | `components/garden/ActivityGarden.tsx` | |
| `openPayModal()` | `components/payment/UpgradeModal.tsx` | Toss Payments 연동 |
| 요금제 탭 (무료/라이트/프리미엄) | `components/payment/PlanSelector.tsx` | |

### 프로토타입에서 그대로 재사용 가능한 것

- **아이소메트릭 SVG 방**: 폴리곤 좌표 데이터를 `constants/room-items.ts`로 추출하면 JSX로 바로 사용 가능
- **잔디 격자 렌더링**: `buildGarden()` 로직을 거의 그대로 React 컴포넌트화 가능
- **색상 변수**: CSS 변수(`--grn`, `--blu` 등)를 Tailwind 커스텀 색상으로 등록

### 프로토타입과 달라지는 것

- 화면 전환: `go(id)` → Next.js `router.push()`
- 상태 관리: 전역 변수 → Zustand store
- API 호출: 없음(모두 인메모리) → `React Query` + REST API
- 인증: 없음 → NextAuth JWT 미들웨어

---

## 12. 개발 운영 원칙

### 코드 품질

```bash
# 커밋 전 필수 실행
npm run typecheck    # TypeScript 타입 오류 확인
npm run lint         # ESLint
npm run test         # 핵심 비즈니스 로직 단위 테스트 (챕터 게이트, XP 계산, 스트릭)
```

### 브랜치 전략

```
main          — 배포 브랜치 (직접 커밋 금지)
develop       — 개발 통합 브랜치
feature/*     — 기능 개발 (PR → develop)
hotfix/*      — 긴급 버그 수정 (PR → main + develop 동시)
```

### 2인 팀 협업 원칙

1. **범위 엄수**: Phase 1 MVP 기간 중 새 기능 추가 금지. 백로그에만 기록
2. **콘텐츠 선행**: Phase 0 Day 1부터 콘텐츠 제작과 개발 병렬 진행. 문제 없는 앱은 의미 없음
3. **주간 데모**: 매주 금요일 팀 전체에 작동하는 화면 시연
4. **SaaS 적극 활용**: Toss Payments, Vercel, AWS 관리형 서비스 우선. 직접 구현 최소화
5. **외주 엄금**: 초기 외주 개발사는 유지보수 불가 위험. 내부 개발자 집중

### 테스트 필수 항목

```typescript
// 반드시 단위 테스트로 커버해야 하는 핵심 로직
describe('챕터 게이트', () => {
  it('무료 사용자는 3챕터 이후 CHAPTER_LIMIT_REACHED 에러', ...);
  it('라이트 사용자는 8챕터까지 허용', ...);
  it('프리미엄 사용자는 무제한 허용', ...);
});

describe('XP & 스트릭', () => {
  it('어제 학습 후 오늘 학습 시 스트릭 연속 유지', ...);
  it('이틀 공백 후 학습 시 스트릭 1로 리셋', ...);
  it('스트릭 보너스 XP는 최대 20 XP', ...);
});

describe('레벨업', () => {
  it('누적 정답 30개 도달 시 레벨 1→2 상승', ...);
  it('레벨업 시 MyRoom 아이템 잠금 해제 트리거', ...);
});
```

### 주요 결정 사항 (Phase 0 착수 전 팀 전체 합의 필요)

- [ ] 챕터 수 카운팅 기준: 직무적성 3과목을 3챕터로 카운트하는가, 1챕터로 카운트하는가
- [ ] Light 요금제 추가 5챕터에 심화·자격증 포함 여부
- [ ] 스트릭 유지 기준: 하루 몇 챕터 완료 시 스트릭 인정
- [ ] 영어 STEP 4 말하기 스킵 시 XP 감액 비율
- [ ] MyRoom 타일 그리드 크기 (몇 × 몇 타일)

---

*이 문서는 PRD v4.0 기준으로 작성되었습니다. PRD 업데이트 시 함께 갱신하세요.*  
*최종 수정: 2025년 (Phase 0 착수 시점 기준)*
