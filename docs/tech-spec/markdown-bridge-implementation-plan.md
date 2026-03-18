# Markdown Bridge Implementation Plan

## 문서 개요

- 기준 문서: [`markdown-bridge-tech-spec-draft.md`](./markdown-bridge-tech-spec-draft.md)
- 목적: 실제 개발자와 AI agent가 같은 기준으로 작업 단계를 수행하고, 마일스톤/피드백/다음 작업을 끊김 없이 이어갈 수 있도록 한다.
- 적용 범위: MVP 기준 `DOCX -> MD`, `MD -> DOCX`, `MD -> PDF`와 관련된 앱 구조, 변환 코어, UI, 테스트, 검증, 문서화
- 문서 저장 규칙: `docs/` 폴더는 Git에 트래킹되지 않는 전제로 취급한다. 프로젝트 진행 중 새 문서, 작업 메모, 운영 기록, 후속 검토 문서가 필요하면 `documents/` 폴더를 사용한다.
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
6. 새로 작성하는 보조 문서가 필요하면 `docs/`가 아니라 `documents/`에 작성한다.

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
- 작업 기록은 완료한 각 task 바로 하위에 작성해야 한다.
- 단, Git에 트래킹되지 않는 문서만 변경한 경우에는 commit을 남기지 않아도 된다.
- 완료 시마다 아래 3가지를 남긴다.
  - 확인자
  - 피드백 또는 특이사항
  - 다음 작업

### 작업 기록 템플릿

```md
- [ ] 3.1 예시 task
  - 작업 기록:
    - commit message: <영문 commit 메시지>
    - commit hash: <해당 task commit hash>
    - 확인자: <이름 또는 AI agent id>
    - 피드백: <없으면 "없음">
    - 다음 작업: <즉시 이어질 다음 task 번호>
    - 참고 스펙: <섹션 번호>
```

## Milestones

### Milestone 1. 개발 기준선 정리

목표: 스펙, 실행 환경, 테스트 루프를 작업자 공통 기준으로 고정한다.

#### Task Checklist

- [x] 1.1 Electron + React + TypeScript 기본 스캐폴드가 존재하는지 확인한다.
- [x] 1.2 Typed IPC, main/preload/renderer 분리가 코드에 반영되어 있는지 확인한다.
- [x] 1.3 로컬 개발 환경 재현 절차를 문서화한다.
  - `npm install`
  - `npm test`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run dev`
  - 작업 기록:
    - commit message: 없음 (문서만 변경)
    - commit hash: N/A
    - 확인자: Codex
    - 피드백: 없음
    - 다음 작업: 1.4
    - 참고 스펙: 17. Testing Strategy
- [x] 1.4 현재 미설치 의존성 상태에서 왜 테스트가 실행되지 않는지 기록한다.
  - `npm install` 이전에는 `node_modules`가 없어서 `vitest` 실행 파일이 생성되지 않으며, 그 결과 `npm test`는 로컬 의존성 설치 후에만 실행 가능하다.
  - 작업 기록:
    - commit message: 없음 (문서만 변경)
    - commit hash: N/A
    - 확인자: Codex
    - 피드백: 없음
    - 다음 작업: 1.5
    - 참고 스펙: 17. Testing Strategy
- [x] 1.5 세션 시작/종료 체크리스트를 README 또는 별도 운영 문서에 반영한다.
  - 세션 시작: 대상 task와 관련 섹션을 확인하고, 환경/검증 명령의 전제 조건을 점검한다.
  - 세션 종료: 작업 기록을 갱신하고, 검증 상태와 다음 작업을 남긴 뒤 종료한다.
  - 작업 기록:
    - commit message: 없음 (문서만 변경)
    - commit hash: N/A
    - 확인자: Codex
    - 피드백: 없음
    - 다음 작업: 2.6
    - 참고 스펙: 17. Testing Strategy

#### 완료 기준

- 신규 작업자가 저장소를 받아 개발/검증 명령을 바로 실행할 수 있어야 한다.
- 테스트 선행 원칙과 세션 종료 규칙이 문서에 남아 있어야 한다.

### Milestone 2. 환경 점검 및 파일시스템 규칙 완성

목표: 스펙 6, 8, 14에 맞춰 환경 상태와 입력/출력 검증을 안정화한다.

#### Task Checklist

- [x] 2.1 `Pandoc` 탐지 로직을 구현한다.
- [x] 2.2 PDF 엔진 탐지 로직을 구현한다.
- [x] 2.3 파일 선택 및 출력 디렉터리 선택 IPC를 연결한다.
- [x] 2.4 확장자 기반 입력 포맷 판별과 지원 경로 판별 로직을 구현한다.
  - 작업 기록:
    - commit message: fix: reject unsupported conversions during job creation
    - commit hash: 16d6a8d
    - 확인자: Codex
    - 피드백: 지원되지 않는 변환 경로가 job 생성 시점이 아니라 큐 진입 이후에 실패하고 있어, `createJob` 단계에서 즉시 `failed`로 정규화하도록 보완했다.
    - 검증: `npm run typecheck`, `npx vitest run tests/unit/conversion-service.test.ts tests/unit/command-builder.test.ts tests/unit/paths.test.ts --root .`
    - 추가 피드백 반영:
      - commit message: fix: summarize initial failed job items
      - commit hash: 8b5a1e7
      - 반영 내용: 초기 `failed` / `skipped` 항목이 생성 직후 summary에 반영되지 않던 문제를 `JobStore.create()`에서 보완했다.
      - 검증: `npm run typecheck`, `npx vitest run tests/unit/conversion-service.test.ts tests/unit/command-builder.test.ts tests/unit/paths.test.ts --root .`
    - 다음 작업: 2.6
    - 참고 스펙: 8. User Flow to System Flow Mapping, 14. Filesystem Behavior
- [x] 2.5 충돌 정책 `skip` / `overwrite` / `rename`의 기본 경로 해석 로직을 구현한다.
- [x] 2.6 환경 점검 로직에 대한 단위 테스트를 먼저 추가한다.
  - 작업 기록:
    - commit message: test: cover environment service checks
    - commit hash: fa3fdcf
    - 확인자: Codex
    - 피드백: `EnvironmentService`의 `pandoc` 탐지, PDF 엔진 탐지, `pandoc` 미설치 시 issue 노출 규칙을 단위 테스트로 고정했다.
    - 검증: `npm run typecheck`, `npx vitest run --root . tests/unit/environment.test.ts tests/unit/conversion-service.test.ts tests/unit/command-builder.test.ts tests/unit/paths.test.ts`
    - 추가 피드백 반영:
      - commit message: test: harden environment service checks
      - commit hash: c5233c2
      - 반영 내용: happy-path 테스트의 플랫폼 의존성을 제거하고, `pandoc` 미설치 상태에서도 PDF 엔진이 감지될 수 있는 조합에서 `pdfExportAvailable`가 `false`로 유지되는지 추가 검증했다.
      - 검증: `npm run typecheck`, `npx vitest run --root . tests/unit/environment.test.ts tests/unit/conversion-service.test.ts tests/unit/command-builder.test.ts tests/unit/paths.test.ts`, `npx eslint tests/unit/environment.test.ts`
    - 다음 작업: 2.7
    - 참고 스펙: 6. Process Model, 8. User Flow to System Flow Mapping
- [x] 2.7 지원하지 않는 플랫폼 처리와 메시지 기준을 테스트로 고정한다.
  - 작업 기록:
    - commit message: test: lock unsupported platform environment behavior
    - commit hash: 825e7f1
    - 확인자: Codex
    - 피드백: unsupported 플랫폼 처리가 호스트에 따라 흔들리지 않도록 `EnvironmentService`의 플랫폼 값을 `unsupported`로 정규화하고, issue code/message를 단위 테스트로 고정했다.
    - 검증: `npm run typecheck`, `npx vitest run --root . tests/unit/environment.test.ts tests/unit/conversion-service.test.ts tests/unit/command-builder.test.ts tests/unit/paths.test.ts`, `npx eslint tests/unit/environment.test.ts src/main/system/environment.ts src/shared/contracts.ts`
    - 추가 피드백 반영:
      - commit message: 없음 (문서만 변경)
      - commit hash: N/A
      - 반영 내용: 테크스펙 초안의 `EnvironmentStatus.platform` 예시를 `"darwin" | "win32" | "unsupported"`로 갱신해 코드/테스트와 정합성을 맞췄다.
      - 검증: `docs/tech-spec/markdown-bridge-tech-spec-draft.md`의 데이터 모델 섹션 확인
    - 다음 작업: 2.8
    - 참고 스펙: 6. Process Model, 11. Error Handling Strategy
- [x] 2.8 출력 디렉터리 생성 실패, 입력 파일 없음, 잘못된 설정에 대한 오류 정규화 테스트를 추가한다.
  - 작업 기록:
    - commit message: test: lock normalized conversion setup failures
    - commit hash: d0cc183
    - 확인자: Codex
    - 피드백: `ConversionService`에 대해 출력 디렉터리 생성 실패는 `output_write_failed`, 빈 입력/출력 설정은 `invalid_configuration`, 처리 단계의 누락 입력 파일은 `input_not_found`로 정규화되는 테스트를 추가하고 필요한 최소 구현을 보완했다.
    - 검증: `npm run typecheck`, `npx vitest run --root . tests/unit/conversion-service.test.ts tests/unit/environment.test.ts tests/unit/command-builder.test.ts tests/unit/paths.test.ts`, `npx eslint src/main/services/conversion-service.ts tests/unit/conversion-service.test.ts`
    - 다음 작업: 2.9
    - 참고 스펙: 11. Error Handling Strategy, 14. Filesystem Behavior
- [x] 2.9 환경 배너에 표시되는 issue 메시지가 스펙의 error category와 일치하는지 검토한다.
  - 작업 기록:
    - commit message: test: lock environment banner issue messages
    - commit hash: ce2981b
    - 확인자: Codex
    - 피드백: `EnvironmentBanner`는 이미 `EnvironmentStatus.issues[].message`를 그대로 렌더링하고 있었고, `pandoc_not_found`, `pdf_engine_missing`, `unsupported_platform` 메시지가 warning 배너에 그대로 노출되는 테스트를 추가해 정합성을 고정했다.
    - 검증: `npm run typecheck`, `npx vitest run --root . tests/unit/environment-banner.test.tsx tests/unit/environment.test.ts tests/unit/conversion-service.test.ts tests/unit/command-builder.test.ts tests/unit/paths.test.ts`, `npx eslint tests/unit/environment-banner.test.tsx src/renderer/features/environment/EnvironmentBanner.tsx`
    - 다음 작업: 3.5
    - 참고 스펙: 11. Error Handling Strategy, 12. IPC Design

#### 완료 기준

- 환경 상태와 파일시스템 관련 실패가 모두 명시적 에러 코드로 수렴해야 한다.
- 경로/충돌 정책의 기대 동작이 테스트로 고정되어야 한다.

### Milestone 3. 변환 코어와 큐 동작 완성

목표: 스펙 9, 10, 11에 맞춰 변환 실행과 상태 전이를 신뢰 가능하게 만든다.

#### Task Checklist

- [x] 3.1 지원 경로별 `Pandoc` 인자 생성 로직을 구현한다.
- [x] 3.2 메인 프로세스에서 `spawn` 기반 실행 경로를 구현한다.
- [x] 3.3 배치 생성 후 항목별 상태를 `queued -> validating -> processing -> success/failed/skipped`로 갱신한다.
- [x] 3.4 단일 실패가 배치 전체를 중단하지 않도록 큐를 구성한다.
  - 작업 기록:
    - commit message: fix: keep queue running after unexpected item failures
    - commit hash: b9993f9
    - 확인자: Codex
    - 피드백: `processItem()` 내부의 예기치 않은 예외가 큐 루프를 탈출시키고 `processing` 플래그를 고착시켜 이후 항목이 영구 대기 상태가 되는 문제를 보완했다.
    - 검증: `npm run typecheck`, `npx vitest run --root . tests/unit/conversion-service.test.ts tests/unit/environment.test.ts tests/unit/command-builder.test.ts tests/unit/paths.test.ts`, `npx eslint src/main/services/conversion-service.ts tests/unit/conversion-service.test.ts`
    - 다음 작업: 3.5
    - 참고 스펙: 10. Job Queue Design, 11. Error Handling Strategy
- [x] 3.5 `command-builder` 테스트를 확장한다.
  - `MD -> DOCX`
  - `MD -> PDF`
  - 미래 옵션 플래그 삽입 지점
  - 작업 기록:
    - commit message: test: expand command builder coverage
    - commit hash: cdb1ac3
    - 확인자: Codex
    - 피드백: `buildPandocArgs()`에 대해 `MD -> DOCX`, `MD -> PDF`, 그리고 향후 옵션 플래그가 추가되더라도 `-o <output>`가 인자 배열의 끝에 유지되어야 한다는 회귀 포인트를 테스트로 고정했다.
    - 검증: `npx vitest run --root . tests/unit/command-builder.test.ts`, `npm run typecheck`, `npx eslint tests/unit/command-builder.test.ts`
    - 다음 작업: 3.6
    - 참고 스펙: 9.2 Conversion Rules, 9.3 Command Builder
- [x] 3.6 `ConversionService` 단위 테스트를 먼저 추가한다.
  - 입력 파일 없음
  - `pandoc_not_found`
  - `pdf_engine_missing`
  - `unsupported_conversion_path`
  - 성공/실패 혼합 배치
  - 작업 기록:
    - commit message: test: cover conversion service failure scenarios
    - commit hash: 0aa39c5
    - 확인자: Codex
    - 피드백: 기존 `input_not_found` / `unsupported_conversion_path` 범위를 유지한 채 `pandoc_not_found`, `pdf_engine_missing`, 성공/실패 혼합 배치까지 `ConversionService` 단위 테스트로 고정했다. mixed batch를 안정적으로 검증하기 위해 `ConversionService`에 실행 함수 주입 지점을 최소 추가했다.
    - 검증: `npx vitest run --root . tests/unit/conversion-service.test.ts`, `npm run typecheck`, `npx eslint src/main/services/conversion-service.ts tests/unit/conversion-service.test.ts`
    - 다음 작업: 3.7
    - 참고 스펙: 10. Job Queue Design, 11. Error Handling Strategy
- [x] 3.7 큐 동시성 기본값 `1`이 유지되는지 테스트로 고정한다.
  - 작업 기록:
    - commit message: test: lock queue default concurrency to one
    - commit hash: 3795889
    - 확인자: Codex
    - 피드백: `ConversionService` 단위 테스트에 첫 번째 변환 실행을 의도적으로 지연시키는 회귀 케이스를 추가해, 첫 번째 항목이 `processing`인 동안 두 번째 항목이 계속 `queued`로 남고 첫 작업 종료 후에만 실행되는 직렬 큐 동작을 고정했다.
    - 검증: `npx vitest run --root . tests/unit/conversion-service.test.ts`, `npm run typecheck`, `npx eslint tests/unit/conversion-service.test.ts`
    - 다음 작업: 3.8
    - 참고 스펙: 10. Job Queue Design
- [x] 3.8 raw process error와 사용자용 에러 메시지의 분리 전략을 구현하거나 TODO로 명시한다.
  - 작업 기록:
    - commit message: refactor: separate conversion error details
    - commit hash: 6907002
    - 확인자: Codex
    - 피드백: `JobItem`에 `errorDetails`를 추가해 raw process failure text를 보존하고, `errorMessage`는 `Conversion failed.` 같은 사용자용 메시지로 분리했다. `conversion_failed` 경로뿐 아니라 예상치 못한 실패도 동일한 분리 규칙을 따르도록 고정했다.
    - 검증: `npx vitest run --root . tests/unit/conversion-service.test.ts`, `npm run typecheck`, `npx eslint src/main/services/conversion-service.ts src/shared/contracts.ts tests/unit/conversion-service.test.ts`
    - 다음 작업: 3.9
    - 참고 스펙: 11. Error Handling Strategy
- [x] 3.9 `PDF -> MD`는 실험 경로로 남길지 비활성화할지 결정하고, 결정 전까지는 capability gating 테스트를 먼저 작성한다.
  - 작업 기록:
    - commit message: test: gate pdf to md capability
    - commit hash: d315531
    - 확인자: Codex
    - 피드백: `getConversionCapabilities()`가 `experimentalPdfImport=false` 상태를 유지하고 `pdf->md`를 `supportedPaths`에서 제외하는지 고정하는 테스트를 추가했다. 렌더러 측 `ConversionForm` 문구도 `PDF -> MD`가 이 scaffold에서 비활성이라고 명시하도록 회귀로 묶었다.
    - 검증: `npx vitest run --root . tests/unit/capabilities.test.ts tests/unit/conversion-form.test.tsx`, `npm run typecheck`, `npx eslint tests/unit/capabilities.test.ts tests/unit/conversion-form.test.tsx`
    - 다음 작업: 없음
    - 참고 스펙: 9.2 Conversion Rules, 11. Error Handling Strategy

#### 완료 기준

- 변환 결과와 실패 이유가 항목 단위로 일관되게 기록되어야 한다.
- 큐 동작은 성공/실패 혼합 상황에서도 예측 가능해야 한다.

### Milestone 4. IPC 계약과 데이터 모델 안정화

목표: 스펙 12, 13을 기준으로 renderer와 main 사이 계약을 고정한다.

#### Task Checklist

- [x] 4.1 기본 IPC surface를 구현한다.
  - 작업 기록:
    - commit message: refactor: align ipc subscribe channel
    - commit hash: aa05f3e
    - 확인자: Codex
    - 피드백: IPC 이벤트 채널을 `conversion:subscribe`로 정리해 스펙 12의 표면과 구현을 맞췄다. preload의 구독 해제 경로도 같은 채널로 맞춰 기존 `onJobUpdated` API 동작은 유지했다.
    - 검증: `npx eslint src/main/ipc/register.ts src/preload/index.ts`, `npm run typecheck`
    - 다음 작업: 4.3
    - 참고 스펙: 12. IPC Design
- [x] 4.2 공유 계약 타입을 별도 모듈에서 관리한다.
- [x] 4.3 IPC 요청/응답 흐름에 대한 통합 테스트를 먼저 추가한다.
  - 작업 기록:
    - commit message: test: cover ipc create job flow
    - commit hash: c325fe3
    - 확인자: Codex
    - 피드백: `tests/integration/ipc-register.test.ts`에서 Electron boundary를 mock하고 `registerIpcHandlers()`가 등록한 IPC handler를 직접 호출해 `conversion:createJob` 요청과 응답 흐름을 고정했다. 같은 흐름 안에서 `conversion:getJob`과 `conversion:listJobs`도 확인해 생성된 job이 IPC surface를 통해 일관되게 조회되는지 검증했다.
    - 검증: `npx vitest run --root . tests/integration/ipc-register.test.ts`, `npx eslint tests/integration/ipc-register.test.ts`
    - 다음 작업: 4.4
    - 참고 스펙: 12. IPC Design
- [x] 4.4 `conversion:subscribe` 이벤트 계약을 테스트로 고정한다.
  - 작업 기록:
    - commit message: test: lock preload subscribe contract
    - commit hash: 5f355a8
    - 확인자: Codex
    - 피드백: `tests/unit/preload.test.ts`에서 preload 브리지의 `onJobUpdated`가 `conversion:subscribe`에 구독하고, `JobUpdateEvent` payload를 그대로 전달하며, cleanup 시 같은 listener를 해제하는 계약을 고정했다.
    - 검증: `npx vitest run --root . tests/unit/preload.test.ts`, `npx eslint tests/unit/preload.test.ts src/preload/index.ts`, `npm run typecheck`
    - 다음 작업: 4.5
    - 참고 스펙: 12. IPC Design
- [x] 4.5 `JobUpdateEvent`, `ConversionJob.summary`, `EnvironmentStatus`의 shape 회귀 테스트를 추가한다.
  - 작업 기록:
    - commit message: test: lock shared contract shapes
    - commit hash: 2dfdaee
    - 확인자: Codex
    - 피드백: `src/shared/contracts.ts`를 기준으로 `JobUpdateEvent`, `ConversionJob.summary`, `EnvironmentStatus`의 대표 shape를 `toStrictEqual` 회귀 테스트로 고정해 계약 변경이 필드 추가/누락까지 포함해 즉시 드러나도록 했다.
    - 검증: `npx vitest run --root . tests/unit/contracts-shape.test.ts`, `npm run typecheck`, `npx eslint tests/unit/contracts-shape.test.ts`
    - 다음 작업: 4.6
    - 참고 스펙: 12. IPC Design, 13. Data Model Draft
- [x] 4.6 unbounded payload가 전달되지 않도록 응답 필드 검토 기준을 문서화한다.
  - 작업 기록:
    - commit message: docs: define ipc payload review criteria
    - commit hash: 727ed4d
    - 확인자: Codex
    - 피드백: 현재 IPC 응답 surface를 기준으로 `src/shared/contracts.ts`에 정의된 타입만 반환하도록 검토 기준을 문서화했다. `conversion:subscribe`와 `conversion:createJob` 계열에 대해 raw object blob, Electron 객체, stack trace, 무제한 배열을 금지하고, `JobItem.errorDetails`처럼 예외적으로 허용되는 raw text는 bounded string으로만 다루도록 정리했다.
    - 검증: `git diff --check -- documents/ipc-response-payload-review-criteria.md docs/tech-spec/markdown-bridge-implementation-plan.md`
    - 다음 작업: 없음
    - 참고 스펙: 12. IPC Design, 13. Data Model Draft

#### 완료 기준

- IPC 계약 변경 시 테스트 실패로 즉시 감지되어야 한다.
- renderer는 preload API 외의 privileged API에 의존하지 않아야 한다.

### Milestone 5. UI 작업 흐름 완성

목표: 스펙 8, 15에 맞춰 실제 사용 흐름이 끊기지 않도록 UI를 정리한다.

#### Task Checklist

- [x] 5.1 파일 선택, 포맷 선택, 출력 경로 선택 UI를 구성한다.
  - 작업 기록:
    - commit message: fix: render selected file list
    - commit hash: b5fd917
    - 확인자: Codex
    - 피드백: `ConversionForm`의 selected files 영역에 실제 파일 목록을 렌더링하도록 보강해, 파일 선택 UI가 단순 카운트가 아니라 선택된 경로를 확인할 수 있는 화면이 되도록 정정했다.
    - 검증: `npx vitest run --root . tests/unit/conversion-form.test.tsx`, `npm run typecheck`, `npx eslint src/renderer/features/conversion/ConversionForm.tsx src/renderer/styles/global.css tests/unit/conversion-form.test.tsx`
    - 다음 작업: 5.2
    - 참고 스펙: 8. Main User Flow, 15. UI Surface Draft
- [x] 5.2 작업 결과 패널과 환경 배너를 구성한다.
  - 작업 기록:
    - commit message: feat: add open output folder action
    - commit hash: 49f0850
    - 확인자: Codex
    - 피드백: Results panel에 `Open output folder` 액션을 추가하고, preload와 main IPC를 통해 `dialog:openOutputFolder` 경로를 연결했다. job에 output path가 존재할 때만 버튼이 보이도록 해서 결과 패널이 배치 요약, 항목 상태, 출력 폴더 진입점까지 갖추도록 정리했다.
    - 검증: `npx vitest run --root . tests/unit/jobs-panel.test.tsx tests/unit/preload.test.ts tests/integration/ipc-register.test.ts`, `npm run typecheck`, `npx eslint src/main/ipc/register.ts src/preload/index.ts src/renderer/app/App.tsx src/renderer/features/jobs/JobsPanel.tsx tests/unit/jobs-panel.test.tsx tests/unit/preload.test.ts tests/integration/ipc-register.test.ts`
    - 다음 작업: 5.3
    - 참고 스펙: 15. UI Surface Draft
- [x] 5.3 UI 상호작용 테스트를 먼저 추가한다.
  - 작업 기록:
    - commit message: test: cover ui interaction flows
    - commit hash: e90cdc1
    - 확인자: Codex
    - 피드백: 파일 미선택 상태와 PDF -> MD 차단 상태를 `ConversionForm` 렌더 테스트로 고정하고, `job-state` helper로 변환 요청 후 job 반영 흐름을 분리해 검증했다. `JobsPanel`에는 실패 항목 메시지 노출 회귀를 추가해 결과 패널의 핵심 상호작용을 우선 커버했다.
    - 검증: `npx vitest run --root . tests/unit/conversion-form.test.tsx tests/unit/jobs-panel.test.tsx tests/unit/app-job-state.test.ts`, `npm run typecheck`, `npx eslint src/renderer/app/App.tsx src/renderer/app/job-state.ts src/renderer/features/conversion/ConversionForm.tsx src/renderer/features/jobs/JobsPanel.tsx tests/unit/app-job-state.test.ts tests/unit/conversion-form.test.tsx tests/unit/jobs-panel.test.tsx`
    - 다음 작업: 5.4
    - 참고 스펙: 8. Main User Flow, 15. UI Surface Draft
- [x] 5.4 drag-and-drop 유무를 스펙 기준으로 판단하고 범위를 명시한다.
  - 작업 기록:
    - commit message: docs: clarify file intake scope
    - commit hash: 2a8dd97
    - 확인자: Codex
    - 피드백: MVP 파일 입력은 파일 선택기만 사용하고, drag-and-drop, drag-in folders, file watching은 이번 범위에서 제외한다는 점을 UI 문구와 `documents/drag-drop-scope-note.md`에 명시했다.
    - 검증: `npx vitest run --root . tests/unit/conversion-form.test.tsx`, `npm run typecheck`, `npx eslint src/renderer/features/conversion/ConversionForm.tsx tests/unit/conversion-form.test.tsx`
    - 다음 작업: 5.5
    - 참고 스펙: 15. UI Surface Draft, 19. Open Technical Questions
- [x] 5.5 배치 요약, 항목 상태, 에러 상세, 출력 폴더 열기 액션을 스펙 기준으로 보강한다.
  - 작업 기록:
    - commit message: feat: enrich job results summary
    - commit hash: ab7b8a8
    - 확인자: Codex
    - 피드백: 결과 패널의 배치 요약에 `queued`와 `processing`을 포함해 현재 job 상태를 더 정확히 보이게 했고, 실패 항목에는 `errorMessage`와 `errorDetails`를 함께 노출해 사용자용 메시지와 원인 상세를 분리했다. 출력 폴더 열기 액션은 기존 경로를 유지했다.
    - 검증: `npx vitest run --root . tests/unit/jobs-panel.test.tsx`, `npm run typecheck`, `npx eslint src/renderer/features/jobs/JobsPanel.tsx tests/unit/jobs-panel.test.tsx`
    - 다음 작업: 5.6
    - 참고 스펙: 15. UI Surface Draft
- [x] 5.6 `MD -> PDF` 준비 부족 시 안내 메시지가 온보딩/배너/실패 상태에서 일관되는지 검토한다.
  - 작업 기록:
    - commit message: fix: align pdf engine missing guidance
    - commit hash: d2b4412
    - 확인자: Codex
    - 피드백: `pdf_engine_missing` 안내 문구를 `src/shared/messages.ts`의 공용 상수로 묶어 환경 배너와 변환 실패 상태가 동일한 MD -> PDF 안내를 사용하도록 정리했다. 관련 테스트도 같은 상수를 기준으로 고정해 onboarding, banner, failure state가 같은 메시지를 유지하도록 맞췄다.
    - 검증: `npx vitest run --root . tests/unit/environment-banner.test.tsx tests/unit/environment.test.ts tests/unit/conversion-service.test.ts`, `npm run typecheck`, `npx eslint src/main/system/environment.ts src/main/services/conversion-service.ts tests/unit/environment-banner.test.tsx tests/unit/environment.test.ts tests/unit/conversion-service.test.ts`
    - 다음 작업: Milestone 6
    - 참고 스펙: 11. Error Handling Strategy, 15. UI Surface Draft

#### 완료 기준

- 사용자는 환경 문제와 변환 결과를 UI만 보고 이해할 수 있어야 한다.
- UI의 주요 상태 전이는 테스트 또는 수동 검증 시나리오로 커버되어야 한다.

### Milestone 6. 로깅, 수동 검증, 문서화 마감

목표: 스펙 16, 17, 19, 20을 기준으로 출시 전 점검과 후속 의사결정 자료를 남긴다.

#### Task Checklist

- [x] 6.1 main process 구조화 로그 기준을 먼저 테스트 또는 스파이 검증으로 정의한다.
  - 작업 기록:
    - commit message: feat: add main structured logging standard
    - commit hash: a3efb10
    - 확인자: Codex
    - 피드백: `src/main/logging.ts`에 구조화 로그 기준을 추가하고 `main/index.ts`, `main/ipc/register.ts`, `main/system/environment.ts`, `main/services/conversion-service.ts`에 연결했다. `app:startup`, `process:exit`, `environment:checked`, `job:created`, `job:completed`, `pandoc:execution_failed`, `job:item_failed` 이벤트를 테스트와 스파이 검증으로 먼저 고정해 main process 로그 표준을 코드보다 앞서 정의했다.
    - 검증: `npx vitest run --root . tests/unit/main-logger.test.ts tests/unit/environment.test.ts tests/unit/conversion-service.test.ts`, `npx eslint src/main/index.ts src/main/ipc/register.ts src/main/logging.ts src/main/services/conversion-service.ts src/main/system/environment.ts tests/unit/main-logger.test.ts tests/unit/environment.test.ts tests/unit/conversion-service.test.ts`, `npm run typecheck`
    - 다음 작업: 6.2
    - 참고 스펙: 16. Logging and Diagnostics, 17. Testing Strategy
- [x] 6.2 로그에 문서 본문이 남지 않도록 안전 기준을 명시한다.
  - 작업 기록:
    - commit message: fix: redact document body fields from logs
    - commit hash: TBD
    - 확인자: Codex
    - 피드백: `src/main/logging.ts`에 재귀적 log sanitizer를 추가해 `body`, `content`, `documentBody`, `documentContent`, `markdown`, `rawContent`, `rawText`, `extractedText` 키를 `[redacted]`로 마스킹하도록 보강했다. 스펙 16에는 summary metadata만 기록하고 사용자 작성 텍스트는 logger 호출 전에 요약하라는 기준을 명시했다.
    - 검증: `npx vitest run --root . tests/unit/main-logger.test.ts tests/unit/environment.test.ts tests/unit/conversion-service.test.ts`, `npm run typecheck`, `npx eslint src/main/logging.ts tests/unit/main-logger.test.ts`
    - 다음 작업: 6.3
    - 참고 스펙: 16. Logging and Diagnostics, 17. Testing Strategy
- [ ] 6.3 `macOS` 수동 검증 시나리오를 체크리스트로 작성한다.
- [ ] 6.4 `Windows` 수동 검증 시나리오를 체크리스트로 작성한다.
- [ ] 6.5 `Pandoc` 없음 / PDF 엔진 없음 / 혼합 배치 / 실험 경로 차단 케이스를 수동 검증 항목에 포함한다.
- [ ] 6.6 아래 open question의 의사결정 결과를 ADR 또는 후속 문서로 분리한다.
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
- 작업 기록은 완료한 해당 task 번호 바로 아래에 작성한다.
- 스펙으로 해결 가능한 질문은 문서 내 섹션 번호를 함께 기록한다.
- 스펙에 답이 없는 질문만 `Open Question`으로 분리한다.
- 체크박스는 테스트 통과 후에만 갱신한다.
- task 완료 시점마다 반드시 commit 하고, 영어 commit 메시지와 commit hash를 기록한다.
- 단, Git에 트래킹되지 않는 문서만 변경한 세션은 commit 의무에서 제외한다.
- 피드백 반영은 기존 commit 수정으로 끝내지 말고 추가 commit으로 남긴다.
- 피드백 반영 후에도 새 commit hash와 반영 내용을 작업 기록에 추가한다.
- 체크박스를 갱신한 세션은 반드시 "다음 작업" 한 줄을 남기고 종료한다.

## Open Questions 관리 방식

- `MD -> PDF`의 플랫폼별 최적 PDF 엔진 조합은 프로토타입 결과를 근거로 결정한다.
- `PDF -> MD`는 MVP 포함 여부가 확정되기 전까지 capability gating과 limitation messaging만 유지한다.
- job history persistence는 MVP 범위를 넘길 가능성이 있으므로 메모리 유지와 세션 유지 중 하나로 ADR을 남긴다.
