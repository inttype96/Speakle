package com.sevencode.speakle.projecttest.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 빌드/실행 테스트용 초간단 엔드포인트
 * - /projecttest        : text/plain 헬스 체크
 * - /projecttest/page   : text/html 간단 페이지 렌더링
 */
@RestController
public class ProjectTestController {
	private static final Logger log = LoggerFactory.getLogger(ProjectTestController.class);

	// 가장 단순한 핑 엔드포인트
	@GetMapping(value = "/projecttest", produces = MediaType.TEXT_PLAIN_VALUE)
	public String ping() {
		log.info("projecttest called");
		return "projecttest is up";
	}

	// 템플릿 엔진 없이 간단 HTML 문자열 반환
	@GetMapping(value = "/projecttest/page", produces = MediaType.TEXT_HTML_VALUE)
	public ResponseEntity<String> page() {
		log.info("projecttest/page called");
		String html = """
			<!doctype html>
			<html lang="ko">
			  <head>
			    <meta charset="utf-8"/>
			    <meta name="viewport" content="width=device-width, initial-scale=1"/>
			    <title>Project Test</title>
			    <style>
			      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 40px; }
			      .card { max-width: 520px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; }
			      h1 { margin: 0 0 12px 0; font-size: 20px; }
			      p { margin: 8px 0; color: #374151; }
			      code { background: #f3f4f6; padding: 2px 6px; border-radius: 6px; }
			    </style>
			  </head>
			  <body>
			    <div class="card">
			      <h1> Build & Run OK</h1>
			      <p>현재 시간: <span id="now"></span></p>
			      <p>헬스체크: <code>GET /projecttest</code></p>
			      <p>이 페이지: <code>GET /projecttest/page</code></p>
			    </div>
			    <script>
			      document.getElementById('now').textContent = new Date().toLocaleString();
			    </script>
			  </body>
			</html>
			""";
		return ResponseEntity.ok(html);
	}
}
