# Draft: Phase 3 이상 동작 분석

## Requirements (confirmed)
- Phase 2가 끝나기 전에 Phase 3가 겹쳐서 튀어나옴 (데스크톱/모바일 모두)
- Phase2 마지막 즈음 Phase3 첫 카드가 너무 일찍 노출됨 (Phase III 텍스트 이전, 배너 위로 올라옴)
- Phase3 끝에서 스크롤 위치가 순간이동(점프)함
- 위로 스크롤 시에도 특정 지점에서 카드 뭉치로 점프 후 정상 스크롤
- 모바일에서 스크롤/스와이프가 안 되어 화면이 내려가지 않음 (Galaxy 폰, 삼성 브라우저)
- 데스크톱 크롬에서 Phase2/Phase3 겹침 재현됨 (줌 100%)

## Technical Decisions
- 테스트 인프라 설정 포함 (프레임워크 선택 예정)

## Research Findings
- `src/styles/global.scss:11`에서 `html, body`가 `overflow: hidden`으로 고정 (Lenis 전제)
- 모바일에서 Lenis 비활성화 (`src/components/SmoothScrollWrapper.tsx:22`)
- `src/index.css`에 모바일 스크롤 해제 규칙 존재하지만 `main.tsx`에서 import되지 않음
- Phase3는 `StackGallery`의 ScrollTrigger pin 타임라인 사용 (`src/components/StackGallery.tsx:41`)
- Phase2→3 사이 스페이서 20vh (`src/components/MixedGallery.tsx:94`)
- 카드 스타일은 absolute + 65vh 높이 (`src/styles/MixedGallery.module.scss:73`)
- 테스트 스크립트 부재 (`package.json`에 test 스크립트 없음)

## Open Questions
- 겹침/튀어나옴이 데스크톱/모바일 둘 다인지
- 문제가 발생하는 브라우저/OS/해상도
- 재현 가능한 구체 스텝과 기대 동작

## Scope Boundaries
- INCLUDE: Phase 2~3 구간 레이아웃/스크롤/ScrollTrigger 동작 분석
- EXCLUDE: 기타 섹션 리디자인 (요청 전까지)
