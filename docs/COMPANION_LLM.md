# Companion — 온디바이스 LLM 검토

> 목표: **오픈소스 LLM을 Android 기기에서 직접 구동**.
> 요구사항: 한국어 품질 충분, 하위 기종은 차단(최소 스펙 요구).
> Claude API는 **백업(클라우드 fallback)** 으로만 유지.

---

## 1. 후보 모델 비교

| 모델 | 파라미터 | 한국어 | 라이선스 | Android 런타임 | 비고 |
|---|---|---|---|---|---|
| **Gemma 3n E2B / E4B** ★ | 2B / 4B (effective) | ◎ | Gemma (상업 OK) | MediaPipe LLM / LiteRT | **모바일 전용 설계**, 메모리 공유 MatFormer, 2025 발표 |
| **Gemma 3 1B / 4B** | 1B / 4B | ◎ | Gemma | MediaPipe LLM | 일반 Gemma 3 — 온디바이스 4B 가능 |
| **Llama 3.2 1B / 3B** | 1B / 3B | △ | Llama Community | llama.cpp, ExecuTorch | 한국어는 Gemma 대비 약함 |
| **Qwen 2.5 1.5B / 3B** | 1.5B / 3B | ◎ | Apache 2.0 | llama.cpp, MLC-LLM | 한·중 탁월, 상업 제한 없음 |
| **Phi-3.5 mini** | 3.8B | △ | MIT | llama.cpp | 한국어 부족 |
| **Gemini Nano (AICore)** | - | ◎ | 시스템 API | Google AICore | Pixel 8+/Galaxy S24+ **전용**, 다운로드 0, 무료 |

★ **1순위 추천: Gemma 3n** — Google이 모바일용으로 설계한 최신 변종. 영상·음성·텍스트 멀티모달이며 KV-cache 메모리가 일반 Gemma 3 대비 30~40% 낮음.

> 참고: "Gemma 4"는 2026년 4월 현재 공식 릴리스 없음. Google 계열 중 **모바일 최적화는 Gemma 3n**이 최신. 공식 업데이트 나오면 교체 전제.

---

## 2. 런타임 선택

| 런타임 | 장점 | 단점 |
|---|---|---|
| **MediaPipe LLM Inference API** ★ | Google 공식 · Kotlin SDK · Gemma 3/3n 최적화 · GPU/NNAPI 자동 | 지원 모델 고정 목록 |
| **LiteRT** (TFLite 후속) | 범용 · GPU delegate | LLM 추상화는 직접 구현 |
| **llama.cpp (JNI)** | GGUF 전 모델 · CPU | Android 배포 복잡, NDK 필요 |
| **MLC-LLM** | GPU 가속 우수 | 빌드 파이프라인 무거움 |
| **Google AICore** | 제로 다운로드 · 시스템 최적화 | **Pixel 8+/S24+ 전용** |

**전략**: AICore 가능하면 AICore, 아니면 MediaPipe + Gemma 3n. **llama.cpp는 초기엔 도입 금지**(유지비 큼).

---

## 3. 기기 스펙별 전략 (Tiered)

| 티어 | RAM | 대표 기기 | 모델 | 다운로드 | 추론 속도(예상) |
|---|---|---|---|---|---|
| **S (Nano)** | - | Pixel 8/9/10, Galaxy S24/S25 | **Gemini Nano (AICore)** | 0 (OS 내장) | 20~30 tok/s |
| **A** | 8GB+ | Galaxy S22/S23, Pixel 7+, 중상 기종 | **Gemma 3n E4B Q4** | ~2.5GB | 6~12 tok/s (GPU) |
| **B** | 6GB | Galaxy A54/A55, 중급 | **Gemma 3n E2B Q4** or Gemma 3 1B | ~1.3GB / 0.7GB | 10~20 tok/s |
| **차단** | 4GB 이하 / Android 10 미만 | 저가 · 구형 | (Companion 비활성) | - | - |

**최소 요구사항 (앱에 명시)**
- Android **12+ (API 31+)**
- RAM **6GB 이상**
- 저장공간 여유 **3GB 이상** (Tier A 기준)
- OpenGL ES 3.1 또는 Vulkan 1.1

미달 시 Companion 탭을 숨기고 "이 기기는 AI 상담을 지원하지 않습니다" 안내.

---

## 4. 런타임 판정 로직

```kotlin
suspend fun resolveCompanionBackend(): CompanionBackend {
  // 1) Tier S: Google AICore (Gemini Nano)
  if (AICoreGenerativeModel.isAvailable(context)) {
    return CompanionBackend.AICore
  }
  // 2) Tier A/B: MediaPipe LLM with Gemma 3n
  val ram = getTotalRamBytes()
  val sdk = Build.VERSION.SDK_INT
  if (sdk >= 31 && ram >= 8L * GB) return CompanionBackend.MediaPipe(model = "gemma-3n-e4b-q4")
  if (sdk >= 31 && ram >= 6L * GB) return CompanionBackend.MediaPipe(model = "gemma-3n-e2b-q4")
  // 3) 그 외: 비활성 (또는 Claude cloud fallback 옵션)
  return CompanionBackend.Disabled
}
```

모델 파일은 **첫 Companion 오픈 시 다운로드**(Wi-Fi 권장 표시, 취소 가능, 재시도).
앱 용량을 부풀리지 않도록 APK에 번들하지 않음.

---

## 5. 개인정보 · 안전

- **온디바이스 추론의 장점 = 데이터 미전송** — Companion 대화는 외부로 나가지 않음. 고령자 건강 Q&A에 적합.
- 시스템 프롬프트에 **"진단/처방 금지, 응급은 119 유도"** 명시.
- 출력 필터: 약 상호작용·용량 안내는 미리 정의된 **RAG 지식베이스**(로컬 SQLite)에서 인용, LLM이 숫자 생성 안 하도록 가드.
- Claude API fallback을 만들 경우, 사용자에게 **"클라우드로 전송됩니다"** 확인 필수.

---

## 6. 결정 사항 & 액션

**결정**
- 1순위 모델: **Gemma 3n E4B** (Tier A), E2B (Tier B)
- 런타임: **MediaPipe LLM Inference API** (+ AICore가 가능하면 우선)
- 한국어 대안: Qwen 2.5 3B Instruct (라이선스 Apache 2.0, Gemma보다 유연)을 **A/B 테스트 후보**로 보관

**즉시 액션**
1. MediaPipe LLM Android sample로 Gemma 3n E2B/E4B 벤치 (토큰/초, 배터리, 발열)
2. 한국어 돌봄 Q&A 평가셋 30문항 작성 → Gemma 3n vs Qwen 2.5 블라인드 비교
3. 앱 최소 사양 공지 문구 작성 (Play Store 설명 + 앱 내)
4. AICore 탐지 코드 프로토타입
5. 모델 다운로더 구현 (WorkManager + progress UI)
