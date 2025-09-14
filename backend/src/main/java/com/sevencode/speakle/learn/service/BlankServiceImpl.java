package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.domain.entity.BlankEntity;
import com.sevencode.speakle.learn.domain.entity.LearnedSongEntity;
import com.sevencode.speakle.learn.dto.request.BlankQuestionRequest;
import com.sevencode.speakle.learn.dto.response.BlankQuestionResponse;
import com.sevencode.speakle.learn.exception.LearnedSongNotFoundException;
import com.sevencode.speakle.learn.exception.UnauthorizedAccessException;
import com.sevencode.speakle.learn.exception.ValidWordNotFoundException;
import com.sevencode.speakle.learn.repository.BlankRepository;
import com.sevencode.speakle.learn.repository.LearnedSongRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional
public class BlankServiceImpl implements BlankService{
    private final BlankRepository blankRepository;
    private final LearnedSongRepository learnedSongRepository;

    private final Random random = new Random();
    private static final Set<String> EXCLUDED_WORDS = Set.of(
            // 관사
            "a", "an", "the",

            // 대명사
            "i", "me", "my", "mine", "myself",
            "you", "your", "yours", "yourself", "yourselves",
            "he", "him", "his", "himself",
            "she", "her", "hers", "herself",
            "it", "its", "itself",
            "we", "us", "our", "ours", "ourselves",
            "they", "them", "their", "theirs", "themselves",
            "this", "that", "these", "those",
            "who", "whom", "whose", "which", "what",

            // 전치사
            "in", "on", "at", "by", "for", "with", "to", "from",
            "of", "about", "under", "over", "during", "before",
            "after", "into", "onto", "upon", "off",

            // be동사
            "am", "is", "are", "was", "were", "be", "been", "being",
            "ain't", "isn't", "aren't", "wasn't", "weren't",

            // 접속사
            "and", "or", "but", "so", "yet", "nor", "because",
            "since", "while", "if", "when", "where", "how", "why", "whether",

            // do 동사
            "do", "does", "did", "doing", "done",

            // have 동사
            "have", "has", "had", "having",

            // 기능어
            "not", "no", "yes", "please", "thank", "thanks", "here",
            "there", "now", "then", "today", "yesterday",
            "tomorrow", "very", "too", "such", "rather",
            "pretty", "just", "only", "even", "also", "still",

            // 숫자
            "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
            "first", "second", "third", "last", "next",

            // 일반적인 고유명사들
            "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december"
    );

    @Override
    public BlankQuestionResponse getBlankQuestion(BlankQuestionRequest req, Long userId) {
        // 1. 학습곡 존재 및 권한 확인
        LearnedSongEntity learned = learnedSongRepository.findById(req.getLearnedSongId())
                .orElseThrow(() -> new LearnedSongNotFoundException("존재하지 않는 학습곡입니다."));

        if (!Objects.equals(learned.getUserId(), userId)) {
            throw new UnauthorizedAccessException("접근할 수 있는 권한이 없습니다.");
        }

        // 2. recommendation_sentence에서 문장 조회
        // TODO: Recommendation_sentence 테이블에서 퀴즈 문장 가져오기 (getRecommendationSentence() 함수 구현하기)
        // RecommendationSentence recommendationSentence = getRecommendationSentence(
        //         request.getLearnedSongId(),
        //         request.getQuestionNumber()
        // );
        // String originalSentence = recommendationSentence.getCoreSentence();

        // 테스트용 더미 값
        String originalSentence = "The club isn't the best place to find a lover";
        //

        // 3. 빈칸 문제 생성
        BlankQuizResult quizResult = createBlankQuiz(originalSentence);

        // 4. BlankEntity 생성 및 저장
        BlankEntity blank = BlankEntity.builder()
                .learnedSongId(req.getLearnedSongId())
                .situation(req.getSituation())
                .location(req.getLocation())
                .songId(req.getSongId())
                .originSentence(originalSentence)
                // .korean(recommendationSentence.getKorean())      // TODO: recommendation_sentence 테이블 연결하면 주석 삭제하기
                .korean("클럽은 연인을 찾기에 최적의 장소가 아닙니다")    // TODO: recommendation_sentence 테이블 연결하면 삭제하기
                .question(quizResult.getQuestion())
                .answer(quizResult.getAnswers())
                .level(BlankEntity.Level.BEGINNER)
                .build();

        BlankEntity savedBlank = blankRepository.save(blank);

        // 5. 응답 데이터 생성
        BlankQuestionResponse res = BlankQuestionResponse.builder()
                .blankId(savedBlank.getBlankId())
                .learnedSongId(savedBlank.getLearnedSongId())
                .songId(savedBlank.getSongId())
                // .recommendationSentenceId(recommendationSentence.getRecommendationSentenceId())   // TODO: recommendation_sentence 테이블 연결하면 주석 삭제하기
                .recommendationSentenceId(123L)         // TODO: recommendation_sentence 테이블 연결하면 삭제하기
                .originSentence(savedBlank.getOriginSentence())
                .korean(savedBlank.getKorean())
                .question(savedBlank.getQuestion())
                .answer(quizResult.getAnswers())
                .createdAt(savedBlank.getCreatedAt())
                .build();

        return res;
    }

    // ------------------------------------------------------------
    // 빈칸 문제 생성
    // ------------------------------------------------------------
    private BlankQuizResult createBlankQuiz(String sentence) {
        String[] words = sentence.split("\\s+");
        List<String> validWords = new ArrayList<>();

        // 1. 빈칸 퀴즈에 유효한 단어만 필터링
        for (String word : words) {
            if (isValidWord(word) && isValidWord(word.toLowerCase())) {
                validWords.add(word);
            }
        }

        if(validWords.isEmpty()){
            throw new ValidWordNotFoundException("빈칸으로 만들 적절한 단어를 찾을 수 없습니다.");
        }

        // 2. 랜덤하게 빈칸 개수 결정 (1~3개, 단 유효한 단어 수를 초과하지 않음)
        int maxBlanks = Math.min(3, validWords.size());
        int blankCount = random.nextInt(maxBlanks) + 1; // 1~maxBlanks 사이

        // 3. 유효한 단어 중 빈칸으로 만들 단어 랜덤 선택 (쭝복 없이)
        List<String> selectedWords = selectRandomWords(validWords, blankCount);

        // 4. 채점을 위해 선택한 단어들 원본 문장 순서대로 정렬
        List<String> orderedAnswers = sortByOriginalOrder(sentence, selectedWords);

        // 5. 빈칸 문제 생성
        String question = createQuestionWithMultipleBlanks(sentence, orderedAnswers);

        return new BlankQuizResult(question, orderedAnswers);
    }

    // ------------------------------------------------------------
    // 빈칸 퀴즈에 유효한 단어만 필터링
    // ------------------------------------------------------------
    private boolean isValidWord(String word) {
        // 1. 제외 단어 체크
        if (EXCLUDED_WORDS.contains(word)) return false;

        // 2. 숫자만인 단어 제외
        if (word.matches("\\d+")) return false;

        // 3. 소문자만 포함되어야 함 (고유명사를 제외하기 위해)
        if(!word.equals(word.toLowerCase())) return false;
//        if (!word.matches(".*[a-z].*")) return false;

        return true;
    }

    // ------------------------------------------------------------
    // 유효한 단어 중 빈칸으로 만들 단어 랜덤 선택 (쭝복 없이)
    // ------------------------------------------------------------
    private List<String> selectRandomWords(List<String> validWords, int count) {
        List<String> shuffled = new ArrayList<>(validWords);
        Collections.shuffle(shuffled, random);

        return shuffled.subList(0, Math.min(count, shuffled.size()));
    }

    // ------------------------------------------------------------
    // 채점을 위해 선택한 단어들 원본 문장 순서대로 정렬
    // ------------------------------------------------------------
    private List<String> sortByOriginalOrder(String sentence, List<String> selectedWords) {
        String[] originalWords = sentence.split("\\s+");
        List<String> orderedWords = new ArrayList<>();

        // 원본 문장 순서로 순회하면서 선택된 단어 찾기
        for (String originalWord : originalWords) {
            if (selectedWords.contains(originalWord)) {
                orderedWords.add(originalWord);
                selectedWords.remove(originalWord); // 중복 처리
            }
        }
        return orderedWords;
    }

    // ------------------------------------------------------------
    // 빈칸 문제 생성
    // ------------------------------------------------------------
    private String createQuestionWithMultipleBlanks(String sentence, List<String> targetWords) {
        String result = sentence;

        for (String targetWord : targetWords) {
            String blank = "_".repeat(targetWord.length());
            // 단어 경계를 고려한 첫 번째 매칭만 교체
            result = result.replaceFirst("\\b" + Pattern.quote(targetWord) + "\\b", blank);
        }
        return result;
    }


    // ------------------------------------------------------------
    // 빈칸 문제(문제, 정답) 클래스
    // ------------------------------------------------------------
    private static class BlankQuizResult {
        private final String question;
        private final List<String> answers;

        public BlankQuizResult(String question, List<String> answers) {
            this.question = question;
            this.answers = answers;
        }

        public String getQuestion() {
            return question;
        }

        public List<String> getAnswers() {
            return answers;
        }
    }
}
