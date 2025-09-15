package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.domain.entity.DictationEntity;
import com.sevencode.speakle.learn.domain.entity.LearnedSongEntity;
import com.sevencode.speakle.learn.dto.request.DictationQuestionRequest;
import com.sevencode.speakle.learn.dto.response.DictationQuestionResponse;
import com.sevencode.speakle.learn.exception.LearnedSongNotFoundException;
import com.sevencode.speakle.learn.repository.DictationRepository;
import com.sevencode.speakle.learn.repository.LearnedSongRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class DictationServiceImpl implements DictationService{

    private final LearnedSongRepository learnedSongRepository;
    private final DictationRepository dictationRepository;

    /**
     * 딕테이션 문제 생성(조회)
     */
    @Override
    public DictationQuestionResponse getDictationQuestion(DictationQuestionRequest request, Long userId) {
        // 1. LearnedSong 조회
        LearnedSongEntity learnedSong = learnedSongRepository.findById(request.getLearnedSongId())
                .orElseThrow(() -> new LearnedSongNotFoundException("존재하지 않는 학습곡입니다."));

        // 2. 기존 딕테이션 조회 또는 생성
        DictationEntity dictation = findOrCreateDictation(request, learnedSong);

        // 3. 곡 정보 조회
        // SongEntity song = songRepository.findById(learnedSong.getSongId())
        //         .orElseThrow(() -> new RuntimeException("곡 정보를 찾을 수 없습니다."));

        // 4. 응답 데이터 생성
        // DictationQuestionResponse res = buildDictationData(dictation, song); // TODO: song_lyrics 테이블 연결하면 주석 삭제하기
        DictationQuestionResponse res = buildDictationData(dictation);  // TODO: song_lyrics 테이블 연결하면 삭제하기
        return res;
    }


    // ------------------------------------------------------------
    // 기존 딕테이션 조회 또는 새로 생성
    // ------------------------------------------------------------
    private DictationEntity findOrCreateDictation(DictationQuestionRequest request, LearnedSongEntity learnedSong) {
        // 기존 딕테이션 조회
        Optional<DictationEntity> existingDictation = dictationRepository
                .findByLearnedSongIdAndQuestionNumber(request.getLearnedSongId(), request.getQuestionNumber());

        if (existingDictation.isPresent()) {
            return existingDictation.get();
        } else {
            // 새로운 딕테이션 생성
            DictationEntity newDictation = createNewDictation(request, learnedSong);
            return newDictation;
        }
    }

    // ------------------------------------------------------------
    // 새로운 딕테이션 생성
    // ------------------------------------------------------------
    private DictationEntity createNewDictation(DictationQuestionRequest request, LearnedSongEntity learnedSong) {
        // Long sondId = learnedSong.getSongId();
        // 2. 해당 songId의 모든 가사 조회
        // TODO: sondId로 songs_lyrics 테이블에서 가사 데이터 가져오기
        // List<SongsLyricsEntity> allLyrics = songsLyricsRepository.findBySongIdWithEnglishLyrics(sondId);
        //
        // if (allLyrics.isEmpty()) {
        //     throw new NoSentenceAvailableException("사용 가능한 가사가 없습니다.");
        // }

        // 3. 이미 사용된 문장들 조회 (중복 방지)
        // TODO: learnedSongId로 dictation 테이블에서 이미 출제된 가사 데이터 가져오기
        // List<String> usedSentences = dictationRepository.findUsedSentencesByLearnedSongId(request.getLearnedSongId());

        // 4. 사용되지 않은 가사 필터링
        // TODO: 사용되지 않은 가사 필터링하기
        // List<SongsLyrics> availableLyrics = allLyrics.stream()
        //         .filter(lyrics -> !usedSentences.contains(lyrics.getEnglish()))
        //         .collect(Collectors.toList());

        // if (availableLyrics.isEmpty()) {
        //     throw new RuntimeException("더 이상 사용 가능한 가사가 없습니다.");
        // }

        // 5. 랜덤으로 가사 선택
        // TODO: 가사가 문제로 적합한지 검증 로직 추가하기(길이, 감탄사, 반복 문자의 여부)
        // Random random = new Random();
        // SongsLyrics selectedLyrics = availableLyrics.get(random.nextInt(availableLyrics.size()));


        // 6. 다음 가사 정보 조회하기
        // Long selectedLyricsId = selectedLyrics.getSongLyricsId();
        // SongLyrics nextLyrics = songsLyricsRepository.findBySongLyricsId(selectedLyricsId + 1);

        // 7. 딕테이션 세션 생성
        DictationEntity dictation = new DictationEntity();
        dictation.setLearnedSongId(request.getLearnedSongId());
        dictation.setSituation(learnedSong.getSituation());
        dictation.setLocation(learnedSong.getLocation());
        dictation.setSongId(learnedSong.getSongId());
        // TODO: song_lyrics 테이블 연결하면 주석 삭제하기
        // dictation.setStartTime(selectedLyrics.getStartTimeMs());
        // dictation.setEndTime(nextLyrics.getStartTimeMs());
        // dictation.setOriginSentence(selectedLyrics.getEnglish());
        // dictation.setAnswer(selectedLyrics.getEnglish());
        // TODO: song_lyrics 테이블 연결하면 삭제하기
        dictation.setStartTime(50000L);
        dictation.setEndTime(55000L);
        dictation.setOriginSentence("The club isn't the best place to find a lover");
        dictation.setAnswer("The club isn't the best place to find a lover");
        //
        dictation.setLevel(DictationEntity.Level.BEGINNER);
        dictation.setCreatedAt(LocalDateTime.now());
        dictation.setQuestionNumber(request.getQuestionNumber());

        return dictationRepository.save(dictation);
    }

    // ------------------------------------------------------------
    // 딕테이션 응답 데이터 생성
    // ------------------------------------------------------------
    // private DictationQuestionResponse buildDictationData(DictationEntity dictation, Song song) { // TODO: song 테이블 연결하면 주석 삭제하기
    private DictationQuestionResponse buildDictationData(DictationEntity dictation) {   // TODO: song 테이블 연결하면 삭제하기
        // TODO: artists 추출
        // String[] artists = parseArtistsFromJson(song.getArtists());
        String[] artists = new String[]{"Ed Sheeran"};

        // duration 계산
        Long duration = dictation.getEndTime() - dictation.getStartTime();

        return DictationQuestionResponse.builder()
                .dictationId(dictation.getDictationId())
                .questionNumber(dictation.getQuestionNumber())
                .learnedSongId(dictation.getLearnedSongId())
                .songId(dictation.getSongId())
                // TODO: song 테이블 연결하면 주석 삭제하기
                // .title(song.getTitle())
                // TODO: song 테이블 연결하면 삭제하기
                .title("shape of you")
                //
                .artists(artists)
                .coreSentence(dictation.getOriginSentence())
                .startTime(dictation.getStartTime())
                .duration(duration)
                .endTime(dictation.getEndTime())
                .createdAt(dictation.getCreatedAt())
                .build();
    }
}
