//package com.sevencode.speakle.song.controller;
//
//import com.sevencode.speakle.song.service.CsvImportService;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.Map;
//
//@Slf4j
//@RestController
//@RequestMapping("/api/data")
//@RequiredArgsConstructor
//public class DataImportController {
//
//    private final CsvImportService csvImportService;
//
//    /**
//     * 모든 데이터 적재 (Songs + Lyrics)
//     */
//    @PostMapping("/import/all")
//    public ResponseEntity<Map<String, Object>> importAllData() {
//        log.info("Starting full data import...");
//        try {
//            Map<String, Object> result = csvImportService.importAllData();
//            return ResponseEntity.ok(result);
//        } catch (Exception e) {
//            log.error("Failed to import data", e);
//            return ResponseEntity.internalServerError()
//                    .body(Map.of("error", e.getMessage()));
//        }
//    }
//
//    /**
//     * Song 메타데이터만 적재
//     */
//    @PostMapping("/import/songs")
//    public ResponseEntity<Map<String, Object>> importSongs() {
//        log.info("Starting song import...");
//        try {
//            Map<String, Object> result = csvImportService.importSongs();
//            return ResponseEntity.ok(result);
//        } catch (Exception e) {
//            log.error("Failed to import songs", e);
//            return ResponseEntity.internalServerError()
//                    .body(Map.of("error", e.getMessage()));
//        }
//    }
//
//    /**
//     * Lyrics 데이터만 적재
//     */
//    @PostMapping("/import/lyrics")
//    public ResponseEntity<Map<String, Object>> importLyrics() {
//        log.info("Starting lyrics import...");
//        try {
//            Map<String, Object> result = csvImportService.importLyrics();
//            return ResponseEntity.ok(result);
//        } catch (Exception e) {
//            log.error("Failed to import lyrics", e);
//            return ResponseEntity.internalServerError()
//                    .body(Map.of("error", e.getMessage()));
//        }
//    }
//
//    /**
//     * 데이터 개수 확인
//     */
//    @GetMapping("/count")
//    public ResponseEntity<Map<String, Object>> getDataCount() {
//        try {
//            Map<String, Object> result = csvImportService.getDataCount();
//            return ResponseEntity.ok(result);
//        } catch (Exception e) {
//            log.error("Failed to get data count", e);
//            return ResponseEntity.internalServerError()
//                    .body(Map.of("error", e.getMessage()));
//        }
//    }
//
//    /**
//     * 모든 데이터 삭제
//     */
//    @DeleteMapping("/clear")
//    public ResponseEntity<Map<String, Object>> clearAllData() {
//        log.warn("CLEARING ALL DATA - This action cannot be undone!");
//        try {
//            csvImportService.clearAll();
//            return ResponseEntity.ok(Map.of("message", "All data cleared successfully"));
//        } catch (Exception e) {
//            log.error("Failed to clear data", e);
//            return ResponseEntity.internalServerError()
//                    .body(Map.of("error", e.getMessage()));
//        }
//    }
//}