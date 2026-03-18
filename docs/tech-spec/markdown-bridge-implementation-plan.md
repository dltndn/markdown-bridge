# Markdown Bridge Implementation Plan

## 문서 개요

- 기준 문서: [`markdown-bridge-tech-spec-draft.md`](./markdown-bridge-tech-spec-draft.md)
- 목적: 실제 개발자와 AI agent가 같은 기준으로 작업 단계를 수행하고, 마일스톤/피드백/다음 작업을 끊김 없이 이어갈 수 있도록 한다.
- 적용 범위: MVP 기준 `DOCX -> MD`, `MD -> DOCX`, `MD -> PDF`와 관련된 앱 구조, 변환 코어, UI, 테스트, 검증, 문서화
- 현재 확인된 상태:
  - Electron + React + TypeScript 스캐폴드 존재
  - 기본 IPC, 환경 점검, 변환 서비스, 작업 저장소, 렌더러 UI 초안 존재
  - 단위 테스트 파일 존재
  - `npm test`는 현재 `vitest: command not found`로 실패하므로 의존성 설치 전까지 테스트 기준선은 미검증 상태

## 작업 원칙

1. 작업 시작 전 반드시 테크스펙 전체를 꼼꼼하게 읽는다.
2. 모르겠거나 모호한 부분은 먼저 테크스펙에서 해답을 찾는다.
3. 모든 기능 작업은 항상 테스트 코드를 먼저 작성한다.
4. 작업 실행은 "실패하는 테스트 작성 -> 기능 구현 -> 테스트 통과 확인 -> 체크박스 갱신 -> 작업 세션 종료" 순서로 진행한다.
5. 각 작업은 다음 작업자가 즉시 이어받을 수 있을 정도로 구체적인 상태 기록을 남긴다.

## 작업 순서와 기준

### 세션 시작 체크

- [ ] 테크스펙 전체를 다시 읽고 이번 세션의 대상 범위를 한 문장으로 정리한다.
- [ ] 관련 섹션을 명시한다.
  - 예: `9. Conversion Engine Design`, `10. Job Queue Design`, `17. Testing Strategy`
- [ ] 현재 코드와 테스트 상태를 확인한다.
  - 기본 명령: `npm test`, `npm run typecheck`, `npm run lint`
- [ ] 막히는 부분이 있으면 테크스펙의 관련 조항을 다시 확인하고, 스펙에 답이 없을 때만 open question으로 남긴다.

### 작업 실행 루프

1. 작업할 task 하나만 선택한다.
2. 해당 task의 성공 기준을 테크스펙 문장으로 다시 확인한다.
3. 실패하는 테스트를 먼저 추가한다.
4. 테스트를 통과시키는 최소 구현을 작성한다.
5. `test`, `typecheck`, `lint` 중 해당 작업에 필요한 검증을 실행한다.
6. 검증이 통과하면 해당 task 단위로 commit 한다.
7. commit 메시지는 반드시 영어로 작성한다.
8. 생성된 commit hash를 작업 기록에 남긴다.
9. task 체크박스를 완료로 변경한다.
10. 아래 기록 템플릿을 채운 뒤 세션을 종료한다.

### 작업 완료 기준

- 테스트 코드가 먼저 존재해야 한다.
- 새 기능은 관련 테스트가 모두 통과해야 한다.
- 기존 동작 회귀가 없어야 한다.
- 테크스펙과 어긋나는 임의 확장은 하지 않는다.
- task 완료 시 반드시 commit 해야 한다.
- commit 메시지는 반드시 영어여야 한다.
- 작업 기록에 해당 commit hash가 포함되어야 한다.
- 피드백을 반영한 경우 추가 commit을 반드시 남겨야 한다.
- 완료 시마다 아래 3가지를 남긴다.
  - 확인자
  - 피드백 또는 특이사항
  - 다음 작업

### 작업 기록 템플릿

```md
- 작업: <완료한 task 이름>
- commit message: <영문 commit 메시지>
- commit hash: <해당 task commit hash>
- 확인자: <이름 또는 AI agent id>
- 피드백: <없으면 "없음">
- 다음 작업: <즉시 이어질 다음 task>
- 참고 스펙: <섹션 번호>
```

## Milestones

### Milestone 1. 개발 기준선 정리

목표: 스펙, 실행 환경, 테스트 루프를 작업자 공통 기준으로 고정한다.

#### Task Checklist

- [x] Electron + React + TypeScript 기본 스캐폴드가 존재하는지 확인한다.
- [x] Typed IPC, main/preload/renderer 분리가 코드에 반영되어 있는지 확인한다.
- [x] 로컬 개발 환경 재현 절차를 문서화한다.
  - `npm install`
  - `npm test`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run dev`
- [ ] 현재 미설치 의존성 상태에서 왜 테스트가 실행되지 않는지 기록한다.
- [ ] 세션 시작/종료 체크리스트를 README 또는 별도 운영 문서에 반영한다.

#### 완료 기준

- 신규 작업자가 저장소를 받아 개발/검증 명령을 바로 실행할 수 있어야 한다.
- 테스트 선행 원칙과 세션 종료 규칙이 문서에 남아 있어야 한다.

### Milestone 2. 환경 점검 및 파일시스템 규칙 완성

목표: 스펙 6, 8, 14에 맞춰 환경 상태와 입력/출력 검증을 안정화한다.

#### Task Checklist

- [x] `Pandoc` 탐지 로직을 구현한다.
- [x] PDF 엔진 탐지 로직을 구현한다.
- [x] 파일 선택 및 출력 디렉터리 선택 IPC를 연결한다.
- [x] 확장자 기반 입력 포맷 판별과 지원 경로 판별 로직을 구현한다.
- [x] 충돌 정책 `skip` / `overwrite` / `rename`의 기본 경로 해석 로직을 구현한다.
- [ ] 환경 점검 로직에 대한 단위 테스트를 먼저 추가한다.
- [ ] 지원하지 않는 플랫폼 처리와 메시지 기준을 테스트로 고정한다.
- [ ] 출력 디렉터리 생성 실패, 입력 파일 없음, 잘못된 설정에 대한 오류 정규화 테스트를 추가한다.
- [ ] 환경 배너에 표시되는 issue 메시지가 스펙의 error category와 일치하는지 검토한다.

#### 완료 기준

- 환경 상태와 파일시스템 관련 실패가 모두 명시적 에러 코드로 수렴해야 한다.
- 경로/충돌 정책의 기대 동작이 테스트로 고정되어야 한다.

### Milestone 3. 변환 코어와 큐 동작 완성

목표: 스펙 9, 10, 11에 맞춰 변환 실행과 상태 전이를 신뢰 가능하게 만든다.

#### Task Checklist

- [x] 지원 경로별 `Pandoc` 인자 생성 로직을 구현한다.
- [x] 메인 프로세스에서 `spawn` 기반 실행 경로를 구현한다.
- [x] 배치 생성 후 항목별 상태를 `queued -> validating -> processing -> success/failed/skipped`로 갱신한다.
- [x] 단일 실패가 배치 전체를 중단하지 않도록 큐를 구성한다.
- [ ] `command-builder` 테스트를 확장한다.
  - `MD -> DOCX`
  - `MD -> PDF`
  - 미래 옵션 플래그 삽입 지점
- [ ] `ConversionService` 단위 테스트를 먼저 추가한다.
  - 입력 파일 없음
  - `pandoc_not_found`
  - `pdf_engine_missing`
  - `unsupported_conversion_path`
  - 성공/실패 혼합 배치
- [ ] 큐 동시성 기본값 `1`이 유지되는지 테스트로 고정한다.
- [ ] raw process error와 사용자용 에러 메시지의 분리 전략을 구현하거나 TODO로 명시한다.
- [ ] `PDF -> MD`는 실험 경로로 남길지 비활성화할지 결정하고, 결정 전까지는 capability gating 테스트를 먼저 작성한다.

#### 완료 기준

- 변환 결과와 실패 이유가 항목 단위로 일관되게 기록되어야 한다.
- 큐 동작은 성공/실패 혼합 상황에서도 예측 가능해야 한다.

### Milestone 4. IPC 계약과 데이터 모델 안정화

목표: 스펙 12, 13을 기준으로 renderer와 main 사이 계약을 고정한다.

#### Task Checklist

- [x] 기본 IPC surface를 구현한다.
- [x] 공유 계약 타입을 별도 모듈에서 관리한다.
- [ ] IPC 요청/응답 흐름에 대한 통합 테스트를 먼저 추가한다.
- [ ] `conversion:subscribe` 이벤트 계약을 테스트로 고정한다.
- [ ] `JobUpdateEvent`, `ConversionJob.summary`, `EnvironmentStatus`의 shape 회귀 테스트를 추가한다.
- [ ] unbounded payload가 전달되지 않도록 응답 필드 검토 기준을 문서화한다.

#### 완료 기준

- IPC 계약 변경 시 테스트 실패로 즉시 감지되어야 한다.
- renderer는 preload API 외의 privileged API에 의존하지 않아야 한다.

### Milestone 5. UI 작업 흐름 완성

목표: 스펙 8, 15에 맞춰 실제 사용 흐름이 끊기지 않도록 UI를 정리한다.

#### Task Checklist

- [x] 파일 선택, 포맷 선택, 출력 경로 선택 UI를 구성한다.
- [x] 작업 결과 패널과 환경 배너를 구성한다.
- [ ] UI 상호작용 테스트를 먼저 추가한다.
  - 파일 미선택 상태
  - 지원되지 않는 조합 차단
  - 변환 요청 후 job 반영
  - 실패 항목 메시지 노출
- [ ] drag-and-drop 유무를 스펙 기준으로 판단하고 범위를 명시한다.
- [ ] 배치 요약, 항목 상태, 에러 상세, 출력 폴더 열기 액션을 스펙 기준으로 보강한다.
- [ ] `MD -> PDF` 준비 부족 시 안내 메시지가 온보딩/배너/실패 상태에서 일관되는지 검토한다.

#### 완료 기준

- 사용자는 환경 문제와 변환 결과를 UI만 보고 이해할 수 있어야 한다.
- UI의 주요 상태 전이는 테스트 또는 수동 검증 시나리오로 커버되어야 한다.

### Milestone 6. 로깅, 수동 검증, 문서화 마감

목표: 스펙 16, 17, 19, 20을 기준으로 출시 전 점검과 후속 의사결정 자료를 남긴다.

#### Task Checklist

- [ ] main process 구조화 로그 기준을 먼저 테스트 또는 스파이 검증으로 정의한다.
- [ ] 로그에 문서 본문이 남지 않도록 안전 기준을 명시한다.
- [ ] `macOS` 수동 검증 시나리오를 체크리스트로 작성한다.
- [ ] `Windows` 수동 검증 시나리오를 체크리스트로 작성한다.
- [ ] `Pandoc` 없음 / PDF 엔진 없음 / 혼합 배치 / 실험 경로 차단 케이스를 수동 검증 항목에 포함한다.
- [ ] 아래 open question의 의사결정 결과를 ADR 또는 후속 문서로 분리한다.
  - `MD -> PDF` 권장 구성
  - `PDF -> MD` MVP 포함 여부
  - job history persistence 범위

#### 완료 기준

- 다음 작업자는 어떤 환경에서 무엇을 검증해야 하는지 문서만 보고 실행할 수 있어야 한다.
- 남은 기술 의사결정이 구현 작업과 분리되어 추적 가능해야 한다.

## 우선순위 높은 다음 작업

1. 의존성을 설치하고 테스트/타입체크/린트 기준선을 확보한다.
2. `ConversionService`와 `EnvironmentService`에 대한 실패 테스트를 먼저 추가한다.
3. IPC 통합 테스트 골격을 만들고 `conversion:createJob` 흐름을 고정한다.
4. UI 상호작용 테스트를 추가해 스펙상의 사용자 흐름을 회귀 방지한다.

## 피드백 관리 규칙

- 각 milestone 완료 또는 중간 중단 시 작업 기록 템플릿을 남긴다.
- 스펙으로 해결 가능한 질문은 문서 내 섹션 번호를 함께 기록한다.
- 스펙에 답이 없는 질문만 `Open Question`으로 분리한다.
- 체크박스는 테스트 통과 후에만 갱신한다.
- task 완료 시점마다 반드시 commit 하고, 영어 commit 메시지와 commit hash를 기록한다.
- 피드백 반영은 기존 commit 수정으로 끝내지 말고 추가 commit으로 남긴다.
- 피드백 반영 후에도 새 commit hash와 반영 내용을 작업 기록에 추가한다.
- 체크박스를 갱신한 세션은 반드시 "다음 작업" 한 줄을 남기고 종료한다.

## Open Questions 관리 방식

- `MD -> PDF`의 플랫폼별 최적 PDF 엔진 조합은 프로토타입 결과를 근거로 결정한다.
- `PDF -> MD`는 MVP 포함 여부가 확정되기 전까지 capability gating과 limitation messaging만 유지한다.
- job history persistence는 MVP 범위를 넘길 가능성이 있으므로 메모리 유지와 세션 유지 중 하나로 ADR을 남긴다.

## 작업 기록

- 작업: 로컬 개발 환경 재현 절차를 문서화한다.
- commit message: `docs: add local development setup guide`
- commit hash: `<pending>`
- 확인자: `<pending>`
- 피드백: `<pending>`
- 다음 작업: 현재 미설치 의존성 상태에서 왜 테스트가 실행되지 않는지 기록한다.
- 참고 스펙: `2. Product Constraints`, `5. Proposed Repository Structure`, `17. Testing Strategy`
