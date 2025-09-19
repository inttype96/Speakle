// package com.sevencode.speakle.parser.service.gms.config;

// import jakarta.validation.constraints.Min;
// import jakarta.validation.constraints.NotBlank;

// import org.springframework.boot.context.properties.ConfigurationProperties;
// import org.springframework.boot.context.properties.bind.DefaultValue;
// import org.springframework.validation.annotation.Validated;

// import java.time.Duration;

// /**
//  * GmsProperties
//  * - 목적: application.properties/yaml의 "gms.*" 설정 바인딩 + 검증.
//  * - 주요 항목:
//  *   · url              : 게이트웨이 엔드포인트
//  *   · key              : API 키(Bearer)
//  *   · responseTimeout  : HTTP 타임아웃(예: PT110S; MVC async보다 짧게 권장)
//  *   · maxInMemorySize  : WebClient 메모리 버퍼 상한
//  *   · defaults         : 모델/토큰/온도/사용자/스키마 기본값
//  */
// @Validated
// @ConfigurationProperties(prefix = "gms")
// public record GmsProperties(

// 	// 게이트웨이/모델 엔드포인트
// 	@NotBlank
// 	String url,

// 	// 인증 토큰(Bearer)
// 	@NotBlank
// 	String key,

// 	// 응답 타임아웃 (예: PT110S)
// 	@DefaultValue("PT60S")
// 	Duration responseTimeout,

// 	// WebClient in-memory 버퍼(기본 8MB)
// 	@DefaultValue("8388608")
// 	@Min(1024) // 최소 1KB
// 	int maxInMemorySize,

// 	// 기본 모델 파라미터 묶음
// 	@Validated
// 	Defaults defaults
// ) {
// 	// defaults 미지정 시 안전한 기본값으로 대체
// 	public GmsProperties {
// 		if (defaults == null) {
// 			defaults = Defaults.createDefault();
// 		}
// 	}

// 	/**
// 	 * Defaults
// 	 * - 목적: GMS 요청의 기본 파라미터 세트.
// 	 *   · model      : 기본 모델명
// 	 *   · maxTokens  : 응답 토큰 상한
// 	 *   · temperature: 생성 다양성
// 	 *   · user       : 호출자 태그(감사/리밋 구분)
// 	 *   · schemaName : 응답 스키마 이름(json_schema 사용 시)
// 	 */
// 	@Validated
// 	public static record Defaults(
// 		@NotBlank
// 		@DefaultValue("gpt-4o-mini")
// 		String model,

// 		@DefaultValue("1500")
// 		@Min(1)
// 		Integer maxTokens,

// 		@DefaultValue("0.2")
// 		Double temperature,

// 		@DefaultValue("service:parsing")
// 		String user,

// 		@DefaultValue("ParsingResponse")
// 		String schemaName

// 	) {
// 		// 코드 내 생성 시 사용할 내부 기본값 팩토리
// 		static Defaults createDefault() {
// 			return new Defaults("gpt-4o-mini", 1500, 0.2, "service:parsing", "ParsingResponse");
// 		}
// 	}
// }
package com.sevencode.speakle.parser.service.gms.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

/**
 * GmsProperties
 * - 목적: application.properties/yaml의 "gms.*" 설정 바인딩 + 검증.
 * - 주요 항목:
 *   · url              : 게이트웨이 엔드포인트
 *   · key              : API 키(Bearer)
 *   · responseTimeout  : HTTP 타임아웃(예: PT110S; MVC async보다 짧게 권장)
 *   · maxInMemorySize  : WebClient 메모리 버퍼 상한
 *   · defaults         : 모델/토큰/온도/사용자/스키마 기본값
 */
@Validated
@ConfigurationProperties(prefix = "gms")
public record GmsProperties(

        // 게이트웨이/모델 엔드포인트
        @NotBlank
        String url,

        // 인증 토큰(Bearer)
        @NotBlank
        String key,

        // 응답 타임아웃 (예: PT60S)
        @DefaultValue("PT60S")
        Duration responseTimeout,

        // WebClient in-memory 버퍼(기본 8MB)
        @DefaultValue("8388608")
        @Min(1024) // 최소 1KB
        int maxInMemorySize,

        // 기본 모델 파라미터 묶음
        @Validated
        Defaults defaults
) {
    // defaults 미지정 시 안전한 기본값으로 대체
    public GmsProperties {
        if (defaults == null) {
            defaults = Defaults.createDefault();
        }
    }

    /**
     * Defaults
     * - 목적: GMS 요청의 기본 파라미터 세트.
     *   · model                    : 기본 모델명
     *   · maxTokens                : 응답 토큰 상한
     *   · temperature              : 생성 다양성
     *   · user                     : 호출자 태그(감사/리밋 구분)
     *   · schemaName               : (파서용) JSON 스키마 이름
     *   · translationSchemaName    : (번역용) JSON 스키마 이름
     */
    @Validated
    public static record Defaults(
            @NotBlank
            @DefaultValue("gpt-4o-mini")
            String model,

            @DefaultValue("1500")
            @Min(1)
            Integer maxTokens,

            @DefaultValue("0.2")
            Double temperature,

            @DefaultValue("service:parsing")
            String user,

            // OpenAI 제약: ^[a-zA-Z0-9_-]+$
            @NotBlank
            @Pattern(regexp = "^[a-zA-Z0-9_-]+$")
            @DefaultValue("ParsingResponse")
            String schemaName,

            // 번역 전용 스키마 이름 (점(.) 금지)
            @NotBlank
            @Pattern(regexp = "^[a-zA-Z0-9_-]+$")
            @DefaultValue("lyrics_translation_v1")
            String translationSchemaName
    ) {
        // 코드 내 생성 시 사용할 내부 기본값 팩토리
        static Defaults createDefault() {
            return new Defaults(
                    "gpt-4o-mini",
                    1500,
                    0.2,
                    "service:parsing",
                    "ParsingResponse",
                    "lyrics_translation_v1"
            );
        }
    }
}
