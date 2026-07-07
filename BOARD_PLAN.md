# 커뮤니티 게시판 구축 계획 (feature/build-board)

> 목표: 7월 내 커뮤니티 페이지 오픈. 1차 범위는 **자유 게시판**이며,
> 공연후기 게시판 / 팬 게시판(동적 생성)으로 확장 가능한 구조로 만든다.

## 확정된 결정사항

| 항목 | 결정 |
|---|---|
| 스키마 반영 | Prisma migrate 사용 안 함. **DDL 직접 실행 → `yarn db:pull` → `yarn db:generate`** (담당: hyuk) |
| 게시판 구조 | `board_tb` + `post_tb.board_id`로 여러 게시판 공용. 분리/파티셔닝 시 board_id가 기준 키 |
| 삭제 정책 | **Hard delete**. FK는 전부 ON DELETE CASCADE, S3 이미지는 앱 레벨에서 삭제 |
| 게시글 제목 | **50자** (varchar(50)) |
| 댓글 | 제목 없음(content만). 대댓글 1 depth 제한. 부모 삭제 시 대댓글도 cascade 삭제 |
| 이미지 | **글당 10장, 개당 5MB**. TOAST UI Editor 선업로드 방식 (아래 플로우 참고) |
| 에디터 | TOAST UI Editor — 위지윅 기본(`initialEditType: 'wysiwyg'`) + 마크다운 모드 전환 탭 표시. **서버는 마크다운 텍스트로 저장** (sanitize 불필요) |
| 좋아요/싫어요 | 둘 다 지원. 유저당 글 하나에 1개(unique), 같은 타입 재요청 = 취소(토글), 다른 타입 = 변경 |
| 신고 | 기존 report 시스템 재사용. `report_type_code`에 POST/COMMENT 행 추가로 해결 (스키마 변경 없음) |
| 공연/클럽 태그 | **후순위**. 나중에 `post_tag_tb(post_id, perform_id, club_id)` 별도 테이블로 추가 (기존 스키마 변경 없이 확장) |
| 자동 필터(싫어요 N개 이상 삭제) | 정책 미정, 이번 범위 제외 |

## 이미지 업로드 플로우 (TOAST UI 선업로드)

글이 저장되기 **전에** 에디터에서 이미지 업로드가 일어난다 (`addImageBlobHook`).

1. `POST /upload/post-image` — 단건 업로드(≤5MB) → S3 저장 → `post_img_tb`에 **post_id=NULL, user_id 기록** → `{ imageId, url }` 반환
2. 에디터가 본문 마크다운에 URL 삽입
3. 글 생성/수정 시 body에 `imageIds[]` 포함 → 서버가 **소유자 검증 + 10개 제한 검증** 후 post_id 연결
4. 글 수정 시 diff: imageIds에서 빠진 기존 이미지는 S3 파일 + row 삭제 (개별 추가/삭제)
5. 글 삭제 시: file_path 조회 → S3 삭제 → post 삭제(cascade)
6. 고아 이미지 정리: cron으로 `post_id IS NULL AND created_at < now() - 24h` → S3 + row 삭제 (`src/schedule/` 패턴 재사용)

## 진행 상황

### ✅ 1단계 — DB 스키마 (완료)

DDL 실행 + `db:pull` 완료. [prisma/schema.prisma](prisma/schema.prisma)에 반영됨:

- `board_tb` — FREE(자유 게시판), PERFORM_REVIEW(공연 후기 게시판) 행 삽입됨
- `post_category_code` — GENERAL(일반글), BAND_PROMO(밴드 홍보글), PERFORM_REVIEW(공연 후기) — 중고거래는 제외 확정
- `post_tb` — board_id, user_id, category_id(nullable, 자유 게시판만 사용), title(50), content(마크다운), (board_id, created_at DESC, id DESC) 인덱스
- `post_img_tb` — post_id **nullable**(선업로드), user_id(도용 방지)
- `post_comment_tb` — parent_id self-FK(대댓글), cascade
- `post_like_tb` — like_type('LIKE'|'DISLIKE'), unique(post_id, user_id)
- `report_type_code`에 POST, COMMENT 행 삽입됨

### ✅ 2단계 — 게시글 CRUD (완료)

생성: [src/schemas/post.schema.ts](src/schemas/post.schema.ts), [src/services/post.service.ts](src/services/post.service.ts), [src/routes/post.ts](src/routes/post.ts) (+ index.ts 등록, FileManager에 `deleteFile()` 추가)

| 엔드포인트 | 인증 | 내용 |
|---|---|---|
| `POST /posts` | requireAuth | body: title, boardCode(기본 FREE), categoryCode(자유 게시판만, 기본 GENERAL), content, imageIds[] |
| `GET /posts/:entityId` | optionalAuth | 상세. isMine, myLikeType, author(닉네임/프로필), images, like/dislike/comment 카운트 |
| `PATCH /posts/:entityId` | requireAuth | 소유자 검증. **imageIds = 최종 상태 전체 전송** — 빠진 이미지는 row + S3 삭제 |
| `DELETE /posts/:entityId` | requireAuth | 소유자 검증. DB hard delete(cascade) → S3 파일 best-effort 삭제 |

구현 메모:
- 이미지 연결(`linkImages`)은 `user_id = 본인 AND (post_id IS NULL OR post_id = 해당 글)` 조건의 updateMany로 소유권/도용 검증
- S3 삭제는 라우트에서 best-effort (실패 시 로그만, 응답은 성공) — DB가 source of truth
- 스모크 테스트 완료: dev 서버 부팅, 글 insert 후 GET 상세 응답 구조 확인, 데이터 정리 완료
- ⚠️ `yarn lint`가 기존부터 깨져 있음 (eslint.config.mts "Plugin not found" — 이 작업과 무관, 별도 수리 필요)

### ✅ 3단계 — 리스트 조회 (완료)

- `GET /posts` — query: `board`(기본 FREE), `category`(옵션), `keyword`(제목+내용 OR contains, insensitive), `sort`(`commonCreatedAtSortBy`, `-createdAt` 기본), `offset`/`limit`(기본 10, 최대 100)
- 응답: `paginatedResponseSchema` (items + total + offset + limit)
- 아이템: id, boardCode, category, title, createdAt/updatedAt, author(닉네임/프로필), likeCount(LIKE만), commentCount
- 스모크 테스트 완료: 기본 최신순 / 카테고리 필터 / 키워드 검색 / 오래된순 / 페이지네이션 전부 확인
- 검색 성능: 초기엔 LIKE로 충분. 느려지면 pg_trgm 인덱스 추가
- 카테고리는 **GENERAL/BAND_PROMO/PERFORM_REVIEW 3종으로 확정** (중고거래는 스펙에서 제외됨, 2026-07-06)

### ✅ 4단계 — 이미지 업로드 (완료)

- `UploadType.POST` 추가 (maxFiles 10, 폴더 `post/{userId}`) — [src/types/file.types.ts](src/types/file.types.ts)
- `FileManager.saveFile()` 추가 — savefiles와 달리 기존 폴더를 안 지우는 단건 저장 (선업로드는 파일이 누적되므로)
- `POST /upload/post-image` — 한 장씩 업로드, post_id NULL로 등록, `{ id, filePath }` 반환. 5MB는 multipart 전역 limits + FileManager 검증 (이중)
- 고아 이미지 정리 cron — [src/schedule/post.schedule.ts](src/schedule/post.schedule.ts), 매일 03:30 KST, post_id NULL + 24시간 경과분 R2+DB 삭제 (production만 실행됨 — 기존 스케줄 등록 패턴)
- 스모크 테스트 완료: JWT 발급 → 업로드(R2) → 글 생성 시 이미지 연결 → 인증 상세(isMine=true, images 포함) → 삭제 시 cascade + R2 파일 삭제까지 전체 플로우 확인

### ✅ 5단계 — 댓글 (완료)

생성: [src/schemas/postComment.schema.ts](src/schemas/postComment.schema.ts), [src/services/postComment.service.ts](src/services/postComment.service.ts), [src/routes/postComment.ts](src/routes/postComment.ts) (+ index.ts 등록)

| 엔드포인트 | 인증 | 내용 |
|---|---|---|
| `POST /posts/:entityId/comments` | requireAuth | content(최대 1000자), parentId(옵션). 대댓글 1 depth 검증 |
| `GET /posts/:entityId/comments` | optionalAuth | 등록순 고정, 페이지네이션은 최상위 댓글 기준(total도 최상위만). isMine 포함 |
| `PATCH /comments/:entityId` | requireAuth | 소유자 검증 |
| `DELETE /comments/:entityId` | requireAuth | 소유자 검증, hard delete (대댓글 cascade) |

구현 메모:
- **n-depth 확장 대비 설계**: 대댓글은 중첩이 아닌 **flat 배열 + parentId**로 응답 (`items[].replies[]`). n-depth 허용 시 API 구조 변경 없음. depth 제한은 postComment.service.ts `createComment`의 검사 한 줄 — 그것만 제거하면 n-depth
- 부모 댓글 검증: 존재 + 같은 게시글 소속 + 부모가 최상위인지(1 depth) 확인
- 스모크 테스트 완료: 댓글/대댓글 작성, 2뎁스 400 거부, 수정(updatedAt 반영), 목록 구조, 삭제 cascade 전부 확인

### ⬜ 6단계 — 좋아요/싫어요 + 신고 연결

- `POST /posts/:entityId/like` — body: likeType(LIKE/DISLIKE). 토글/변경 로직. [perform_review_like 패턴](src/routes/performanceReview.ts) 참고
- 신고: 기존 `POST /report` 그대로 사용 가능한지 [report.service.ts](src/services/report.service.ts) 검증 로직 확인

### ⬜ 7단계 — 마무리

- Swagger 문서 확인 (`tags: ['Posts']` 등)
- `yarn lint` 통과
- dev 서버(`yarn dev`)로 전체 플로우 수동 검증: 글 작성 → 이미지 → 리스트/검색/정렬 → 댓글/대댓글 → 좋아요 → 신고 → 수정 → 삭제

## 참고: 기존 코드 컨벤션

- 라우트: `fastify.get/post(...)` + preHandler `[fastify.requireAuth]` 또는 `[fastify.optionalAuth]`, `request.userId`로 유저 확인
- 에러: `BadRequestError`, `NotFoundError` from `@/common/error.js`
- 페이지네이션: offset/limit 방식 (넘버 방식 UI는 프론트가 page→offset 변환)
- import 경로: `@/` alias + `.js` 확장자
- 프론트(framer-ui)도 develop 브랜치에서 작업
