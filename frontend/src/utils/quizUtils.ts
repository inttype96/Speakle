/**
 * 퀴즈 채점/전처리 유틸
 * - 비교 규칙이 바뀌어도 여기만 수정하면 전역 반영
 */

/** 간단 정규화: 소문자화 + 다중 공백 축소 + 트림 */
export const normalize = (s: string) =>
  s.toLowerCase().replace(/\s+/g, " ").trim();

/** 사용자 입력과 정답 단어/구를 비교 (대소문자/공백 무시) */
export const isCorrectAnswer = (user: string, answerWord: string) =>
  normalize(user) === normalize(answerWord);

/** (옵션) 구두점/하이픈까지 무시하고 싶을 때 사용하는 더 느슨한 정규화 */
export const normalizeLoose = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "") // 글자/숫자/공백 외 제거(유니코드 안전)
    .replace(/\s+/g, " ")
    .trim();
