// src/services/speakingService.ts
import { http } from "./http";
import type {
  SpeakingEvalReq, SpeakingEvalRes,
  SpeakingSubmitReq, SpeakingSubmitRes,
} from "@/types/speaking";

// 필요할 때 개발용 목업 On/Off
const USE_MOCK = true;

export async function evaluateSpeaking(
  body: SpeakingEvalReq,
  accessToken?: string
): Promise<SpeakingEvalRes> {
  if (USE_MOCK) {
    return {
      status: 200,
      message: "스피킹 평가 문장을 조회했습니다. [mock]",
      data: {
        speakingId: 20,
        learnedSongId: body.learnedSongId,
        songId: 1,
        coreSentence: "The club isn't the best place to find a lover",
      },
    };
  }

  const res = await http.post<SpeakingEvalRes>(
    "/learn/speaking/evaluate",
    body,
    {
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    }
  );
  return res.data;
}

export async function submitSpeakingResult(
  body: SpeakingSubmitReq,
  accessToken?: string
): Promise<SpeakingSubmitRes> {
  if (USE_MOCK) {
    return {
      status: 200,
      message: "스피킹 결과가 저장되었습니다. [mock]",
      data: {
        speakingResultId: 9101,
        speakingId: body.speakingId,
        isCorrect: true,
        score: 4,
        createdAt: new Date().toISOString(),
        meta: {
          origin_sentence: body.script,
          recognized: body.script,
          score: "4.160036",
        },
      },
    };
  }

  // 명세: multipart/form-data + audio는 BASE64 문자열 필드
  const fd = new FormData();
  fd.append("speakingId", String(body.speakingId));
  fd.append("script", body.script);
  fd.append("audio", body.audioBase64);

  const res = await http.post<SpeakingSubmitRes>("/learn/speaking/result", fd, {
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
  return res.data;
}

// Blob → Base64 (dataURL) → prefix 제거해 순수 base64 반환
export function blobToBase64String(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const dataUrl = String(fr.result ?? "");
      const base64 = dataUrl.split(",")[1] ?? ""; // "data:...;base64,XXXX" → "XXXX"
      resolve(base64);
    };
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}
