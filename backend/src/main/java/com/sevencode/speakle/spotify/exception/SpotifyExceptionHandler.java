package com.sevencode.speakle.spotify.exception;

import java.time.Instant;

import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import com.sevencode.speakle.spotify.dto.response.SpotifyErrorResponse;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Order(1)
@RestControllerAdvice(basePackages = "com.sevencode.speakle.spotify")
public class SpotifyExceptionHandler {

    @ExceptionHandler(SpotifyNotLinkedException.class)
    public ResponseEntity<SpotifyErrorResponse> handleSpotifyNotLinked(
            SpotifyNotLinkedException ex, WebRequest request) {
        log.warn("Spotify not linked: {}", ex.getMessage());

        SpotifyErrorResponse errorResponse = SpotifyErrorResponse.of(
            "SPOTIFY_NOT_LINKED",
            ex.getMessage(),
            HttpStatus.NOT_FOUND.value(),
            getRequestPath(request)
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(InvalidStateException.class)
    public ResponseEntity<SpotifyErrorResponse> handleInvalidState(
            InvalidStateException ex, WebRequest request) {
        log.warn("Invalid OAuth state: {}", ex.getMessage());

        SpotifyErrorResponse errorResponse = SpotifyErrorResponse.of(
            "INVALID_OAUTH_STATE",
            ex.getMessage(),
            HttpStatus.BAD_REQUEST.value(),
            getRequestPath(request)
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(SpotifyApiException.class)
    public ResponseEntity<SpotifyErrorResponse> handleSpotifyApi(
            SpotifyApiException ex, WebRequest request) {
        log.warn("Spotify API error: {} (status: {})", ex.getMessage(), ex.getStatusCode());

        HttpStatus httpStatus = mapSpotifyStatusToHttp(ex.getStatusCode());

        SpotifyErrorResponse errorResponse = SpotifyErrorResponse.of(
            "SPOTIFY_API_ERROR",
            ex.getMessage(),
            httpStatus.value(),
            getRequestPath(request)
        );

        return ResponseEntity.status(httpStatus).body(errorResponse);
    }

    @ExceptionHandler(SpotifyException.class)
    public ResponseEntity<SpotifyErrorResponse> handleGenericSpotify(
            SpotifyException ex, WebRequest request) {
        log.error("Generic Spotify error: {}", ex.getMessage(), ex);

        SpotifyErrorResponse errorResponse = SpotifyErrorResponse.of(
            "SPOTIFY_ERROR",
            ex.getMessage(),
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            getRequestPath(request)
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    private HttpStatus mapSpotifyStatusToHttp(int spotifyStatusCode) {
        return switch (spotifyStatusCode) {
            case 400 -> HttpStatus.BAD_REQUEST;
            case 401 -> HttpStatus.UNAUTHORIZED;
            case 403 -> HttpStatus.FORBIDDEN;
            case 404 -> HttpStatus.NOT_FOUND;
            case 429 -> HttpStatus.TOO_MANY_REQUESTS;
            case 500, 502, 503 -> HttpStatus.SERVICE_UNAVAILABLE;
            default -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
    }

    private String getRequestPath(WebRequest request) {
        String description = request.getDescription(false);
        // "uri=/api/spotify/player" 형태에서 경로 추출
        if (description.startsWith("uri=")) {
            return description.substring(4);
        }
        return description;
    }
}
