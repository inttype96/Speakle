// src/services/speakingService.ts
import { http } from "./http";
import type {
  SpeakingEvalReq, SpeakingEvalRes,
  SpeakingSubmitReq, SpeakingSubmitRes,
} from "@/types/speaking";


// 필요할 때 개발용 목업 On/Off
const USE_MOCK = false;

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
        songId: "1",
        title: "Shape of You",
        artists: "Ed Sheeran",
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

// ✅ 명세: JSON 바디만 사용 (multipart 아님)
export async function submitSpeakingResult(
  body: SpeakingSubmitReq, // { speakingId:number; script:string; audioBase64:string } 형태여도 아래에서 맞춰 넣어줌
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
        meta: {} as any,
      },
    };
  }

  // 서버 명세에 맞춰 필드명은 정확히 speakingId / script / audio
  const payload = {
    speakingId: body.speakingId,
    script: body.script,
    audio: (body as any).audio ?? (body as any).audioBase64, // 호출부가 audioBase64로 넘겨도 audio로 매핑
  };
  const res = await http.post<SpeakingSubmitRes>("/learn/speaking/result", payload, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
  return res.data;
}

/* =========================
 *  🔊 오디오 인코딩 유틸
 *  - 입력: webm/mp4/wav 등의 Blob
 *  - 출력: "RAW(헤더 없음) · 16kHz · Mono · PCM S16LE" base64 문자열
 * ========================= */

// src/services/speakingService.ts (하단에 추가)

/** Blob(webm/mp4/wav) -> RAW PCM S16LE (16kHz mono) base64 */
export async function blobToPCM16kBase64RAW(blob: Blob): Promise<string> {
  // 1) Blob을 ArrayBuffer로 변환
  const arrayBuf = await blob.arrayBuffer();
  const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
  let decoded: AudioBuffer;
  
  try {
    decoded = await ac.decodeAudioData(arrayBuf);
  } finally {
    try { ac.close(); } catch {}
  }

  // 2) 모노 다운믹스 - Python 코드와 동일한 방식으로 처리
  const srcSr = decoded.sampleRate;
  const frames = decoded.length;
  const channels = decoded.numberOfChannels;
  
  let monoF32 = new Float32Array(frames);
  
  if (channels === 1) {
    monoF32.set(decoded.getChannelData(0));
  } else {
    // 다중 채널의 경우 평균값 계산 (Python의 mean(axis=1)과 동일)
    for (let i = 0; i < frames; i++) {
      let sum = 0;
      for (let ch = 0; ch < channels; ch++) {
        sum += decoded.getChannelData(ch)[i];
      }
      monoF32[i] = sum / channels;
    }
  }

  // 3) 16kHz로 리샘플링 - 수동 리샘플링으로 변경 (Python scipy.signal.resample과 유사)
  const targetSr = 16000;
  let resampledF32: Float32Array;
  
  if (srcSr === targetSr) {
    resampledF32 = monoF32;
  } else {
    const ratio = srcSr / targetSr;
    const newLength = Math.floor(frames / ratio);
    resampledF32 = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, frames - 1);
      const fraction = srcIndex - srcIndexFloor;
      
      // 선형 보간 (Python scipy.signal.resample과 유사한 결과)
      if (srcIndexFloor === srcIndexCeil) {
        resampledF32[i] = monoF32[srcIndexFloor];
      } else {
        resampledF32[i] = monoF32[srcIndexFloor] * (1 - fraction) + monoF32[srcIndexCeil] * fraction;
      }
    }
  }

  // 4) Float32 [-1,1] → Int16 변환 (Python numpy의 astype(np.int16)과 동일)
  const int16Array = new Int16Array(resampledF32.length);
  
  for (let i = 0; i < resampledF32.length; i++) {
    let sample = resampledF32[i];
    
    // 클리핑
    if (sample > 1.0) sample = 1.0;
    else if (sample < -1.0) sample = -1.0;
    
    // Float32를 Int16으로 변환 (Python과 동일한 스케일링)
    if (sample >= 0) {
      int16Array[i] = Math.floor(sample * 32767);
    } else {
      int16Array[i] = Math.floor(sample * 32768);
    }
  }

  // 5) Int16Array를 바이트 배열로 변환 (Little Endian)
  const bytes = new Uint8Array(int16Array.buffer);

  // 6) Base64 인코딩 (Python의 base64.b64encode와 동일)
  let binary = '';
  const CHUNK_SIZE = 8192; // 메모리 효율성을 위한 청크 처리
  
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

// 디버깅을 위한 헬퍼 함수
export async function blobToPCM16kBase64RAWWithDebug(blob: Blob): Promise<{
  base64: string;
  info: {
    originalSampleRate: number;
    originalChannels: number;
    originalLength: number;
    resampledLength: number;
    base64Length: number;
  }
}> {
  const arrayBuf = await blob.arrayBuffer();
  const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
  let decoded: AudioBuffer;
  
  try {
    decoded = await ac.decodeAudioData(arrayBuf);
  } finally {
    try { ac.close(); } catch {}
  }

  const srcSr = decoded.sampleRate;
  const frames = decoded.length;
  const channels = decoded.numberOfChannels;

  let monoF32 = new Float32Array(frames);
  
  if (channels === 1) {
    monoF32.set(decoded.getChannelData(0));
  } else {
    for (let i = 0; i < frames; i++) {
      let sum = 0;
      for (let ch = 0; ch < channels; ch++) {
        sum += decoded.getChannelData(ch)[i];
      }
      monoF32[i] = sum / channels;
    }
  }

  const targetSr = 16000;
  let resampledF32: Float32Array;
  
  if (srcSr === targetSr) {
    resampledF32 = monoF32;
  } else {
    const ratio = srcSr / targetSr;
    const newLength = Math.floor(frames / ratio);
    resampledF32 = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, frames - 1);
      const fraction = srcIndex - srcIndexFloor;
      
      if (srcIndexFloor === srcIndexCeil) {
        resampledF32[i] = monoF32[srcIndexFloor];
      } else {
        resampledF32[i] = monoF32[srcIndexFloor] * (1 - fraction) + monoF32[srcIndexCeil] * fraction;
      }
    }
  }

  const int16Array = new Int16Array(resampledF32.length);
  
  for (let i = 0; i < resampledF32.length; i++) {
    let sample = resampledF32[i];
    
    if (sample > 1.0) sample = 1.0;
    else if (sample < -1.0) sample = -1.0;
    
    if (sample >= 0) {
      int16Array[i] = Math.floor(sample * 32767);
    } else {
      int16Array[i] = Math.floor(sample * 32768);
    }
  }

  const bytes = new Uint8Array(int16Array.buffer);
  
  let binary = '';
  const CHUNK_SIZE = 8192;
  
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  const base64 = btoa(binary);
  
  return {
    base64,
    info: {
      originalSampleRate: srcSr,
      originalChannels: channels,
      originalLength: frames,
      resampledLength: resampledF32.length,
      base64Length: base64.length
    }
  };
}