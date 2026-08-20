# LexKotib AI release audit

Date: 2026-08-20

## Confirmed root causes

1. Production backend selected `Mock` STT and had the LexKotib AI integration disabled.
2. The deployed Cloud Run service exposed an older, incompatible API; the backend-required STT and document endpoints returned 404.
3. The frontend microphone control displayed an input level but did not record or upload audio.
4. The frontend expected `courtCaseId` in hearing responses although the backend returns `caseId`.
5. Hearing and case-document list endpoints were missing, so the UI carried state in `sessionStorage` and rendered mock data.
6. New-case “AI analysis” used filenames only and did not inspect uploaded documents.
7. Product branding was split across Court AI Assistant, Sud AI Yordamchisi, SudKotib AI and LexKotib.
8. The test dependency graph contained a high-severity SSH.NET advisory through an old Testcontainers version.

## Implemented release changes

- Canonical product name: **LexKotib AI**.
- Real persisted hearing list/detail and case-document list API contracts.
- Browser `MediaRecorder` capture with automatic WebM upload and final STT queue after stopping a hearing.
- MIME normalization for `audio/webm;codecs=opus`.
- Private backend proxy for source-grounded PDF/DOCX/TXT Case Memory extraction.
- Four expert-reference document families:
  - economic hearing protocol;
  - economic cassation ruling leaving an appeal without review;
  - civil debt recovery court order;
  - criminal judgment with mandatory judge-approved outcome.
- Removed routed fake hearing/session controls and scripted transcript publishing from the frontend.
- Expanded controlled document types without allowing the AI to choose a judicial outcome.
- Added Vertex primary/fallback model handling.
- Kept the old `SudKotibAi__*` deployment keys readable for one transition release; all new configuration and provider output use `LexKotibAi` / `LexKotibAI`.
- Updated Testcontainers to 4.14.0 and made architecture tests cross-platform.

## Verification completed

- Frontend TypeScript check: passed.
- Frontend ESLint: no errors (two pre-existing auth-hook warnings remain).
- Frontend production build: passed.
- LexKotib AI tests: 10 passed.
- LexKotib AI health/OpenAPI smoke: passed.
- Backend Release tests in an isolated VM directory:
  - unit: 29 passed;
  - integration: 23 passed;
  - architecture: 9 passed.

## Production cutover completed

- Private Cloud Run service: `lexkotib-ai-platform` in `us-central1`.
- Deployed revision: `lexkotib-ai-platform-00001-lrm`.
- Canonical service audience: `https://lexkotib-ai-platform-156676755216.us-central1.run.app`.
- Unauthenticated access returns `403`; there is no `allUsers` invoker binding.
- Service-scoped `roles/run.invoker` is granted only to the VM runtime service account.
- API and Worker use `Stt__FinalProvider=LexKotibAI`; the LexKotib AI integration and document AI are enabled.
- Public readiness endpoint `https://api.beezy.uz/health/ready` returns `200`.
- Production frontend `https://beezy.uz` serves the LexKotib AI build over HTTPS.
- Authenticated synthetic-audio STT smoke completed through the VM identity and returned segmented Uzbek output.
- Authenticated document smoke completed from extraction through controlled drafting and DOCX rendering.
- Chrome production checks covered the dashboard, demo case, hearing/STT placement and the expert document templates.

## Isolation and rollback boundary

- LexKotib API, Worker and frontend were deployed from separate immutable release directories.
- LexKotib PostgreSQL, Redis and MinIO were not restarted.
- Qarz AI API, frontend and PostgreSQL were not modified or restarted; all retained their existing ten-day uptime during the final verification.
- The shared VM service account was not replaced because it is also used by Qarz AI. Access to the new AI service was added at the individual Cloud Run service level only.

## Explicit limitation

This release provides real microphone capture and automatic **final** transcription after the hearing is stopped. It does not claim Google streaming interim text. A production interim transcript requires a separate authenticated gRPC streaming proxy; the final source-of-record transcript remains the post-hearing job.

Existing Google Cloud project, bucket, Artifact Registry and service-account IDs that contain the old infrastructure slug are not renamed in place because they are resource identities, not product branding.
