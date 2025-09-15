package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.domain.entity.BlankEntity;
import com.sevencode.speakle.learn.domain.entity.BlankResultEntity;
import com.sevencode.speakle.learn.domain.entity.LearnedSongEntity;
import com.sevencode.speakle.learn.dto.request.BlankQuestionRequest;
import com.sevencode.speakle.learn.dto.request.BlankResultRequest;
import com.sevencode.speakle.learn.dto.response.BlankQuestionResponse;
import com.sevencode.speakle.learn.dto.response.BlankResultResponse;
import com.sevencode.speakle.learn.dto.response.BlankCompleteResponse;
import com.sevencode.speakle.learn.exception.*;
import com.sevencode.speakle.learn.repository.BlankRepository;
import com.sevencode.speakle.learn.repository.BlankResultRepository;
import com.sevencode.speakle.learn.repository.LearnedSongRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BlankServiceImpl implements BlankService{
    private final BlankRepository blankRepository;
    private final BlankResultRepository blankResultRepository;
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

    /**
     * 빈칸 문제 생성(조회)
     */
    @Override
    public BlankQuestionResponse getBlankQuestion(BlankQuestionRequest req, Long userId) {
        // 1. 학습곡 존재 및 권한 확인
        LearnedSongEntity learned = learnedSongRepository.findById(req.getLearnedSongId())
                .orElseThrow(() -> new LearnedSongNotFoundException("존재하지 않는 학습곡입니다."));

        if (!Objects.equals(learned.getUserId(), userId)) {
            throw new UnauthorizedAccessException("접근할 수 있는 권한이 없습니다.");
        }

        // 2. learned_song_id와 questionNumber(order)로 기존 데이터 조회
        Optional<BlankEntity> existingBlank = blankRepository.findByLearnedSongIdAndQuestionNumber(
                req.getLearnedSongId(),
                req.getQuestionNumber()
        );

        if (existingBlank.isPresent()) {
            // 기존 데이터가 있으면 조회하여 반환
            return convertToBlankQuestionResponse(existingBlank.get());
        }

        // 3. 기존 데이터가 없으면 새로 생성
        return createNewBlankQuestion(req, userId);
    }

    // ------------------------------------------------------------
    // 새로운 빈칸 문제 생성
    // ------------------------------------------------------------
    private BlankQuestionResponse createNewBlankQuestion(BlankQuestionRequest req, Long userId) {
        String originalSentence;
        String korean;
        Long recommendationSentenceId = null;

        // 1. questionNumber에 따라 문장 출처 결정
        if(req.getQuestionNumber()==1){
            // 첫 번째 문제: recommendation_sentence 테이블에서 가져오기
            // TODO: Recommendation_sentence 테이블에서 퀴즈 문장 가져오기 (getRecommendationSentence() 함수 구현하기)
            // RecommendationSentence recommendationSentence = getRecommendationSentence(
            //         request.getLearnedSongId(),
            //         request.getQuestionNumber()
            // );
            // originalSentence = recommendationSentence.getCoreSentence();
            // korean = recommendationSentence.getKorean();
            // recommendationSentenceId = recommendationSentence.getRecommendationSentenceId();
            // 테스트용 더미 값
            originalSentence = "The club isn't the best place to find a lover";
            korean = "클럽은 연인을 찾기에 최적의 장소가 아닙니다";
            recommendationSentenceId = 123L;
            //
        }else{
            // 두 번째, 세 번째 문제: sentences 테이블에서 가져오기
            // TODO : Sentence 테이블에서 learnedSongId인 데이터 개수 계산하기
            // long sentenceCount = sentenceRepository.countByLearnedSongId(learnedSongId);
            // 테스트용 더미 값
            long sentenceCount = 6;
            //

            if (sentenceCount == 0) {
                throw new NoSentenceAvailableException("해당 학습 곡에서 추출할 문장이 없습니다.");
            }

            // 문장 조회 (학습한 sentence에서 가져오기)
            // TODO : Sentence 테이블에서 Sentence 객체 기져오기
            //  List<SentencesEntity> sentences = sentencesRepository.findByLearnedSongIdOrderBySentencesIdAsc(learnedSongId);
            // 테스트용 더미 값
            List<String> sentences = new ArrayList<>(Arrays.asList(
                    "I have to buy new shoes",
                    "I've been tryna call",
                    "Sin City's cold and empty",
                    "I said ooh I'm blinede by the lights",
                    "I'm running out of time",
                    "So I hit the road in overdrive"));
            //

            int index;
            if(sentenceCount == 6){
                index = (req.getQuestionNumber() * 2) - 3;   // 빈칸 게임에 2, 4, 5번 문장 가져오기
            }else{
                index = req.getQuestionNumber() - 1;         // 빈칸 게임에 1, 2번 문장 가져오기
            }

            if(index >= sentences.size()){
                throw new IllegalArgumentException("해당 questionNumber에 맞는 문장이 존재하지 않습니다.");
            }

            // String coreSentence = sentences.get(index).getSentence();
            // 테스트용 코드
            originalSentence =  sentences.get(index);
            //
        }

        // 2. 빈칸 문제 생성
        BlankQuizResult quizResult = createBlankQuiz(originalSentence);

        // 3. BlankEntity 생성 및 저장
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("question", quizResult.getQuestion());
        meta.put("answer", quizResult.getAnswers()); // List<String> -> JSON 배열로 직렬화됨
        meta.put("originSentence", originalSentence);
//        meta.put("korean", recommendationSentence.getKorean());   // TODO: recommendation_sentence 테이블 연결하면 주석 삭제하기
        meta.put("korean", "클럽은 연인을 찾기에 최적의 장소가 아닙니다"); // TODO: recommendation_sentence 테이블 연결하면 삭제하기

        BlankEntity blank = BlankEntity.builder()
                .learnedSongId(req.getLearnedSongId())
                .situation(req.getSituation())
                .location(req.getLocation())
                .songId(req.getSongId())
                .originSentence(originalSentence)
                // .korean(recommendationSentence.getKorean())      // TODO: recommendation_sentence 테이블 연결하면 주석 삭제하기
                .korean("클럽은 연인을 찾기에 최적의 장소가 아닙니다")    // TODO: recommendation_sentence 테이블 연결하면 삭제하기
                .question(quizResult.getQuestion())
                .answer(quizResult.getAnswers().toArray(new String[0]))
                .level(BlankEntity.Level.BEGINNER)
                .questionNumber(req.getQuestionNumber())
                .meta(meta)
                .build();

        BlankEntity savedBlank = blankRepository.save(blank);

        // 4. 응답 데이터 생성
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

        return true;
    }

    // ------------------------------------------------------------
    // 유효한 단어 중 빈칸으로 만들 단어 랜덤 선택 (중복 없이)
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



    // ------------------------------------------------------------
    // questionNumber에 따라 적절한 BlankEntity 선택
    // ------------------------------------------------------------
    private BlankEntity selectBlankByQuestionNumber(List<BlankEntity> blanks, Integer questionNumber) {
        if (blanks.isEmpty()) {
            throw new BlankNotFoundException("해당 퀴즈를 찾을 수 없습니다.");
        }
        switch (questionNumber) {
            case 1:
                return blanks.get(0);
            case 2:
                return blanks.get(1);
            case 3:
                return blanks.get(2);
            default:
                return blanks.get(0);
        }
    }

    // ------------------------------------------------------------
    // BlankEntity를 BlankQuestionResponse로 변환
    // ------------------------------------------------------------
    private BlankQuestionResponse convertToBlankQuestionResponse(BlankEntity blank) {
        // answer 배열을 List로 변환
        List<String> answerList = Arrays.asList(blank.getAnswer());

        return BlankQuestionResponse.builder()
                .blankId(blank.getBlankId())
                .learnedSongId(blank.getLearnedSongId())
                .songId(blank.getSongId())
                .recommendationSentenceId(123L) // TODO: recommendation_sentence 테이블 연결하면 수정
                .originSentence(blank.getOriginSentence())
                .korean(blank.getKorean())
                .question(blank.getQuestion())
                .answer(answerList)
                .createdAt(blank.getCreatedAt())
                .build();
    }

    /**
     * 빈칸 퀴즈 채점 결과 저장
     */
    @Override
    public BlankResultResponse saveBlankResult(BlankResultRequest req, Long userId) {
        // 1. 권한 확인 및 빈칸 게임 존재 확인
        BlankEntity blank = blankRepository.findById(req.getBlankId())
                .orElseThrow(() -> new BlankNotFoundException("존재하지 않는 퀴즈입니다."));

        Long learnedSongId = blank.getLearnedSongId();
        LearnedSongEntity learnedSongEntity = learnedSongRepository.findById(learnedSongId)
                .orElseThrow(() -> new LearnedSongNotFoundException("존재하지 않는 학습곡입니다."));

        if (!Objects.equals(learnedSongEntity.getUserId(), userId)) {
            throw new UnauthorizedAccessException("접근할 수 있는 권한이 없습니다.");
        }

        // 3. meta 정보 구성 (camelCase로 변경)
        Map<String, Object> meta = new HashMap<>();
        meta.put("originSentence", req.getOriginSentence());
        meta.put("question", req.getQuestion());
        meta.put("correctAnswer", req.getCorrectAnswer());
        meta.put("userAnswer", req.getUserAnswer());

        // 4. BlankResultEntity 생성 & 저장
        BlankResultEntity blankResult;
        // 기존 BlankResult 존재 여부 확인
        Optional<BlankResultEntity> existingBlankResult = blankResultRepository
                .findByBlankIdAndUserId(req.getBlankId(), userId);

        if(existingBlankResult.isPresent()){
            // 기존 데이터가 존재하면 업데이트
            blankResult = existingBlankResult.get();
            blankResult.setIsCorrect(req.getIsCorrect());
            blankResult.setScore(req.getScore());
            blankResult.setMeta(meta);
            blankResult.setCreatedAt(LocalDateTime.now());
        }
        else{
            // 기존 데이터가 없으면 새로 생성
            blankResult = BlankResultEntity.builder()
                    .userId(userId)
                    .blankId(req.getBlankId())
                    .isCorrect(req.getIsCorrect())
                    .score(req.getScore())
                    .meta(meta)
                    .build();
        }

        try {
            BlankResultEntity savedResult = blankResultRepository.save(blankResult);

            // 5. 포인트 업데이트 (정답인 경우)
            if (req.getIsCorrect()) {
                // TODO: 포인트 업데이트 로직 추가
            }

            // 6. 응답 생성
            return BlankResultResponse.builder()
                    .blankResultId(savedResult.getBlankResultId())
                    .userId(savedResult.getUserId())
                    .blankId(savedResult.getBlankId())
                    .isCorrect(savedResult.getIsCorrect())
                    .score(savedResult.getScore())
                    .createdAt(savedResult.getCreatedAt())
                    .meta(savedResult.getMeta())
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("퀴즈 결과 저장 중 오류 발생");
        }
    }

    /**
     * 빈칸 퀴즈 종료
     */
    public BlankCompleteResponse getBlankComplete(Long learnedSongId, Long userId) {
        // 1. 권한 확인
        LearnedSongEntity learnedSongEntity = learnedSongRepository.findById(learnedSongId)
                .orElseThrow(() -> new LearnedSongNotFoundException("존재하지 않는 학습곡입니다."));

        if (!Objects.equals(learnedSongEntity.getUserId(), userId)) {
            throw new UnauthorizedAccessException("접근할 수 있는 권한이 없습니다.");
        }

        // 2. learned_song_id로 blank 테이블에서 데이터 조회
        List<BlankEntity> blanks = blankRepository.findByLearnedSongId(learnedSongId);

        if (blanks.isEmpty()) {
            throw new BlankNotFoundException("해당 퀴즈를 찾을 수 없습니다.");
        }

        // 3. blank_id 리스트 추출
        List<Long> blankIds = blanks.stream()
                .map(BlankEntity::getBlankId)
                .collect(Collectors.toList());

        // 4. blank_result에서 해당 결과들 조회
        List<BlankResultEntity> blankResults = blankResultRepository
                .findByBlankIdInAndUserId(blankIds, userId);

        if (blankResults.isEmpty()) {
            throw new BlankResultNotFoundException("해당 퀴즈 결과를 찾을 수 없습니다.");
        }

        // 5. 응답 데이터 구성
        return buildBlankCompleteResponse(blanks, blankResults);
    }

    // ------------------------------------------------------------
    // 빈칸 퀴즈 완료 응답 생성
    // ------------------------------------------------------------
    private BlankCompleteResponse buildBlankCompleteResponse(List<BlankEntity> blanks, List<BlankResultEntity> blankResults) {
        // Blank 데이터를 Map으로 변환 (빠른 조회를 위해)
        Map<Long, BlankEntity> blankMap = blanks.stream()
                .collect(Collectors.toMap(BlankEntity::getBlankId, blank -> blank));

        List<BlankCompleteResponse.BlankResult> results = new ArrayList<>();
        int correctCount = 0;
        int totalScore = 0;

        for (BlankResultEntity blankResult : blankResults) {
            BlankEntity blank = blankMap.get(blankResult.getBlankId());
            if (blank == null) continue;

            // meta 데이터 파싱
            BlankCompleteResponse.BlankMeta meta = parseMetaData(blank, blankResult);

            BlankCompleteResponse.BlankResult result = new BlankCompleteResponse.BlankResult();
            result.setBlankResultId(blankResult.getBlankResultId());
            result.setUserId(blankResult.getUserId());
            result.setBlankId(blankResult.getBlankId());
            result.setIsCorrect(blankResult.getIsCorrect());
            result.setScore(blankResult.getScore());
            result.setCreatedAt(blankResult.getCreatedAt());
            result.setMeta(meta);

            results.add(result);

            if (Boolean.TRUE.equals(blankResult.getIsCorrect())) {
                correctCount++;
            }
            totalScore += blankResult.getScore();
        }
        
        // blankId를 기준으로 오름차순 정렬
        results.sort(Comparator.comparing(BlankCompleteResponse.BlankResult::getBlankId));
        
        // Summary 생성
        BlankCompleteResponse.Summary summary = new BlankCompleteResponse.Summary();
        summary.setTotalQuestions(results.size());
        summary.setCorrectAnswers(correctCount);
        summary.setTotalScore(totalScore);

        // 최종 응답 구성
        BlankCompleteResponse res = new BlankCompleteResponse();
        res.setSummary(summary);
        res.setResults(results);
        return res;
    }

    // ------------------------------------------------------------
    // 메타 데이터 생성
    // ------------------------------------------------------------
    private BlankCompleteResponse.BlankMeta parseMetaData(BlankEntity blank, BlankResultEntity blankResult) {
//        // correctAnswer 파싱 (blank 테이블의 answer 필드에서)
        List<String> correctAnswer = Arrays.asList(blank.getAnswer());

        // userAnswer 파싱 (blankResult의 meta에서)
        List<String> userAnswer = parseUserAnswerFromMeta(blankResult.getMeta());

        return BlankCompleteResponse.BlankMeta.builder()
                .originSentence(blank.getOriginSentence())
                .question(blank.getQuestion())
                .correctAnswer(correctAnswer)
                .userAnswer(userAnswer)
                .build();
    }

    // ------------------------------------------------------------
    // 메타 데이터 중에서 userAnswer 생성
    // ------------------------------------------------------------
    private List<String> parseUserAnswerFromMeta(Map<String, Object> meta) {
        try {
            if (meta == null) {
                return new ArrayList<>();
            }

            Object userAnswerObj = meta.get("userAnswer");
            if (userAnswerObj == null) {
                return new ArrayList<>();
            }
            else {
                List<String> userAnswerList = (List<String>) userAnswerObj;
                return userAnswerList.stream()
                        .map(Object::toString)
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
