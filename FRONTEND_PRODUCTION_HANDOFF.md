# LexKotib frontend production handoff

Ushbu hujjat frontend dasturchi uchun production muhitiga ulanish bo‘yicha yakuniy
handoff hisoblanadi. Endpointlarning to‘liq request/response contractlari
[`FRONTEND_INTEGRATION_GUIDE.md`](./FRONTEND_INTEGRATION_GUIDE.md) faylida berilgan.

## 1. Production manzillar

```text
API origin:       https://api.beezy.uz
REST base URL:    https://api.beezy.uz/api/v1
Health readiness: https://api.beezy.uz/health/ready
SignalR hub:      https://api.beezy.uz/hubs/demo-transcript
```

Swagger productionda o‘chirilgan. `storageKey`, MinIO manzili va VM ichki
portlarini public URL sifatida ishlatmang.

Frontend konfiguratsiyasida origin va REST base URLni alohida saqlash tavsiya
etiladi:

```env
VITE_API_ORIGIN=https://api.beezy.uz
VITE_API_BASE_URL=https://api.beezy.uz/api/v1
```

Next.js uchun:

```env
NEXT_PUBLIC_API_ORIGIN=https://api.beezy.uz
NEXT_PUBLIC_API_BASE_URL=https://api.beezy.uz/api/v1
```

REST so‘rovlarida `API_BASE_URL`, health va SignalR uchun `API_ORIGIN`
ishlatiladi. `/api/v1` prefiksini ikki marta qo‘shmang.

## 2. Hozirgi CORS cheklovi

Backendda hozir CORS konfiguratsiyasi yo‘q. Postman, `curl` va server-to-server
so‘rovlar ishlaydi, lekin boshqa originda joylashgan browser frontend so‘rovlari
bloklanadi.

Frontend production domeni aniqlangach, backend jamoasiga aynan to‘liq originni
yuboring, masalan:

```text
https://app.beezy.uz
```

Backend faqat tasdiqlangan originni allowlist qilishi kerak. Productionda
`Access-Control-Allow-Origin: *` ishlatilmasin. CORS tayyor bo‘lmaguncha lokal
frontend dev-server proxy yoki same-origin reverse proxy ishlatishi mumkin.

## 3. Umumiy HTTP qoidalari

JSON so‘rovlar:

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <accessToken>
X-Request-ID: <ixtiyoriy UUID>
```

`Authorization` faqat public endpointlardan tashqari barcha so‘rovlarga
qo‘shiladi. Har responsedagi `X-Request-ID`ni error monitoringda saqlang.

Public endpointlar:

```text
GET  /health/live
GET  /health/ready
GET  /api/v1/system
POST /api/v1/auth/login
POST /api/v1/auth/refresh
```

## 4. Minimal ulanish tekshiruvi

```bash
curl https://api.beezy.uz/health/ready
curl https://api.beezy.uz/api/v1/system
```

Kutiladigan system response:

```json
{
  "service": "LexKotib.Api",
  "apiVersion": "v1"
}
```

Browser kodi:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const response = await fetch(`${API_BASE_URL}/system`, {
  headers: { Accept: "application/json" },
});

if (!response.ok) {
  throw new Error(`API connectivity failed: ${response.status}`);
}
```

## 5. Authentication

Login:

```http
POST https://api.beezy.uz/api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "<password>"
}
```

Muvaffaqiyatli response:

```json
{
  "accessToken": "eyJ...",
  "accessTokenExpiresAt": "2026-07-29T12:00:00+00:00",
  "refreshToken": "random-refresh-token",
  "refreshTokenExpiresAt": "2026-08-12T11:45:00+00:00"
}
```

Asosiy auth endpointlari:

```text
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

Access token default 15 daqiqa, refresh token default 14 kun yashaydi. Refresh
token har yangilashda rotation qilinadi. Bir vaqtda ko‘p request `401` olsa,
faqat bitta refresh request yuboring; qolgan requestlar shu natijani kutsin.
Muvaffaqiyatli refreshdan keyin access va refresh tokenlarni birga almashtiring.

Logout `204 No Content` qaytarsa, lokal tokenlarni tozalang. Login ma’lumotlari
source code yoki frontend environment fayliga kiritilmasin; production accountni
administrator beradi.

## 6. Error handling

Application xatolari odatda RFC Problem Details formatida keladi:

```json
{
  "type": "https://errors.lexkotib.uz/concurrency-conflict",
  "title": "Conflict",
  "status": 409,
  "detail": "Resource boshqa foydalanuvchi tomonidan o‘zgartirilgan.",
  "code": "CONCURRENCY_CONFLICT",
  "requestId": "uuid"
}
```

Frontend quyidagilarni alohida handle qilsin:

| Status | Harakat                                                           |
| ------ | ----------------------------------------------------------------- |
| `400`  | Field yoki business validation xabarini ko‘rsatish                |
| `401`  | Bir marta refresh; muvaffaqiyatsiz bo‘lsa login sahifasiga o‘tish |
| `403`  | Role yoki case-level access yo‘qligini ko‘rsatish                 |
| `404`  | Not-found holati                                                  |
| `409`  | Resursni qayta olish; mutationni avtomatik takrorlamaslik         |
| `500`  | Generic xabar va `requestId`ni monitoringga yozish                |

ASP.NET `ValidationProblemDetails` responseda `errors` dictionary qaytarishi
mumkin. Ayrim `401/403` responselar body’siz kelishi mumkin; error parser faqat
JSON bodyga tayanmasin.

## 7. Upload, download va background joblar

- Audio va DOCX upload uchun `FormData` ishlating.
- `multipart/form-data` uchun `Content-Type`ni qo‘lda o‘rnatmang; browser boundary
  qiymatini o‘zi qo‘shadi.
- Binary downloadni JSON emas, `Blob` sifatida qabul qiling.
- `storageKey`ni public URL sifatida ochmang.
- `202 Accepted` responsedagi `jobId` orqali `GET /api/v1/jobs/{jobId}`ni terminal
  holatgacha poll qiling.
- Polling komponent unmount yoki route change bo‘lganda bekor qilinsin.

## 8. Optimistic concurrency

Ko‘plab mutation requestlari `expectedVersion` talab qiladi:

1. GET responsedagi `version`ni saqlang.
2. Mutationga aynan shu qiymatni yuboring.
3. Muvaffaqiyatli responsedagi yangi `version` bilan state’ni yangilang.
4. `409 CONCURRENCY_CONFLICT` bo‘lsa resursni refetch qiling va foydalanuvchiga
   konflikt haqida xabar bering.
5. Eski mutationni avtomatik qayta yubormang.

## 9. SignalR

SignalR hub REST base URL ostida emas:

```text
https://api.beezy.uz/hubs/demo-transcript?hearingId=<uuid>
```

Hozir bu production audio streaming emas, faqat demo transcript hub. Browserda
hozircha `LongPolling` transportini majburan ishlating:

```ts
import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
  .withUrl(`${import.meta.env.VITE_API_ORIGIN}/hubs/demo-transcript?hearingId=${hearingId}`, {
    accessTokenFactory: () => accessToken,
    transport: signalR.HttpTransportType.LongPolling,
  })
  .withAutomaticReconnect()
  .build();
```

WebSocket query-token authentication backendda hali yoqilmagan.

## 10. Frontend uchun asosiy workflow

1. Login qiling va `/auth/me` orqali foydalanuvchi rolini oling.
2. Case, participant va hearing yarating.
3. Hearingni boshlang, audio yuklang va hearingni to‘xtating.
4. Transcription jobni queue qiling va yakunigacha poll qiling.
5. Transcriptni tahrirlang, segmentlarni verify qiling, validate va approve qiling.
6. Procedural eventlarni extract, review va verify qiling.
7. Tasdiqlangan manbalardan document generate qiling.
8. Documentni reviewga yuboring, approve yoki changes request oqimini bajaring.
9. Approved documentni DOCX sifatida yuklang; PDF export jobni alohida poll qiling.

To‘liq endpointlar, DTOlar, enumlar, state machine va payload misollari
[`FRONTEND_INTEGRATION_GUIDE.md`](./FRONTEND_INTEGRATION_GUIDE.md)da mavjud.

## 11. Hozirgi muhim cheklovlar

- CORS hali sozlanmagan.
- Swagger productionda o‘chirilgan.
- User/judge list endpointi yo‘q.
- Hearing GET/list endpointlari yo‘q.
- Case bo‘yicha document list endpointi yo‘q.
- PDF download endpointi yo‘q; hozir faqat `pdfStorageKey` qaytadi.
- Production realtime audio/WebSocket protokoli hali mavjud emas.
- SignalR browser client hozir `LongPolling` ishlatishi kerak.

Frontend routing state va local cache’ni shu cheklovlarni hisobga olib loyihalasin.

## 12. Handoff checklist

- [ ] Production frontend origin backend jamoasiga CORS uchun yuborildi. _(external — app origin aniqlangach yuboriladi, §2/§3)_
- [x] API origin va REST base URL alohida sozlandi.
- [x] Bearer token protected requestlarga qo‘shildi.
- [x] Refresh rotation single-flight tarzda implement qilindi.
- [x] `401`, `403`, Problem Details va ValidationProblemDetails handle qilindi.
- [x] `X-Request-ID` error monitoringga yozildi. _(har `ApiError`da ushlanadi; tashqi sink (Sentry) — follow-up)_
- [x] Role bilan birga case-level access ham hisobga olindi.
- [x] `expectedVersion` mutationlarda yuborildi.
- [x] Uploadlar `FormData`, downloadlar `Blob` bilan ishladi.
- [x] Background job polling cancel va terminal statuslarni handle qildi.
- [x] Approved transcript va document UI’da readonly qilindi.
- [x] Secret, password va production tokenlar frontend repositoryga kiritilmadi.
