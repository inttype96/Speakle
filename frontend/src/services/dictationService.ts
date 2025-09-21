import { http } from "./http";
import type { DictationStartReq,
    DictationItem,
    DictationStartRes,
    DictationMarkingReq,
    DictationMarkingRes,
    DictationCompleteRes } from "@/types/dictation";

export async function startDictation(params: DictationStartReq): Promise<DictationItem> {
    const res = await http.post<DictationStartRes>("/learn/dictation/start", params, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data.data;
  }
  
  export async function submitDictation(req: DictationMarkingReq) {
    const res = await http.post<DictationMarkingRes>("/learn/dictation/result", req, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data.data;
  }
  
  export async function completeDictation(learnedSongId: number) {
    const res = await http.get<DictationCompleteRes>(`/learn/dictation/complete`, {
      params: { learnedSongId },
    });
    return res.data.data;
  }