/**
 * 사용자 인증 엔드포인트-작성자:kang
 *
 * 주요 기능 
 * 로그인 -> access_token 발급, refresh_token 저장
 * 로그아웃 -> refresh_token revoke
 * 리프레시 -> refresh_token revoke + 재발급
 * revoke all 
 */
package com.sevencode.speakle.auth.controller;
import com.sevencode.speakle.auth.dto.*;
import com.sevencode.speakle.auth.service.AuthService;
import com.sevencode.speakle.common.dto.ResponseWrapper;
import com.sevencode.speakle.config.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.*;
import io.swagger.v3.oas.annotations.responses.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Auth", description = "사용자 인증 엔드포인트")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Operation(
        summary = "로그인",
        description = "access_token 발급 및 refresh_token 저장",
        responses = {
            @ApiResponse(responseCode = "200", description = "성공", content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = TokenResponse.class),
                examples = @ExampleObject(value = """
                {
                  "status": 200,
                  "message": "로그인에 성공했습니다.",
                  "data": {
                    "tokenType": "Bearer",
                    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
                    "refreshToken": "dGhpc2lzYXJlZnJlc2h0b2tlbg==",
                    "expiresAt": "2025-09-08T12:00:00Z"
                  }
                }
                """)
            )),
            @ApiResponse(responseCode = "401", description = "자격 증명 오류")
        }
    )
    @PostMapping("/login")
    public ResponseEntity<ResponseWrapper<TokenResponse>> login(@Valid @RequestBody LoginRequest req) {
        TokenResponse tokens = authService.login(req);
        return ResponseEntity.ok(ResponseWrapper.success(200, "로그인에 성공했습니다.", tokens));
    }

    @Operation(
        summary = "로그아웃",
        description = "refresh_token revoke",
        security = @SecurityRequirement(name = "bearerAuth"),
        responses = @ApiResponse(responseCode = "200", description = "성공", content = @Content(
            mediaType = "application/json",
            examples = @ExampleObject(value = """
            {"status":200,"message":"로그아웃 되었습니다.","data":null}
            """)
        ))
    )
    @PostMapping("/logout")
    public ResponseEntity<ResponseWrapper<Void>> logout(@Valid @RequestBody LogoutRequest req) {
        authService.logout(req.refreshToken());
        return ResponseEntity.ok(ResponseWrapper.success(200, "로그아웃 되었습니다.", null));
    }

    @Operation(
        summary = "리프레시",
        description = "refresh_token 검증 후 재발급",
        responses = @ApiResponse(responseCode = "200", description = "성공", content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = TokenResponse.class),
            examples = @ExampleObject(value = """
            {
              "status": 200,
              "message": "토큰이 재발급되었습니다.",
              "data": {
                "tokenType": "Bearer",
                "accessToken": "eyJhbGciOiJIUzI1NiIs...",
                "refreshToken": "dGhpc2lzYXJlZnJlc2h0b2tlbg==",
                "expiresAt": "2025-09-08T12:00:00Z"
              }
            }
            """)
        ))
    )
    @PostMapping("/refresh")
    public ResponseEntity<ResponseWrapper<TokenResponse>> refresh(@Valid @RequestBody RefreshRequest req) {
        TokenResponse tokens = authService.refresh(req);
        return ResponseEntity.ok(ResponseWrapper.success(200, "토큰이 재발급되었습니다.", tokens));
    }

    @Operation(
        summary = "전체 로그아웃",
        description = "해당 사용자의 모든 refresh_token revoke",
        security = @SecurityRequirement(name = "bearerAuth"),
        responses = @ApiResponse(responseCode = "200", description = "성공", content = @Content(
            mediaType = "application/json",
            examples = @ExampleObject(value = """
            {"status":200,"message":"모든 세션에서 로그아웃 되었습니다.","data":null}
            """)
        ))
    )
    @PostMapping("/logout-all")
    public ResponseEntity<ResponseWrapper<Void>> logoutAll(@AuthenticationPrincipal UserPrincipal me) {
        authService.logoutAll(me.userId());
        return ResponseEntity.ok(ResponseWrapper.success(200, "모든 세션에서 로그아웃 되었습니다.", null));
    }
}