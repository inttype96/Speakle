package com.sevencode.speakle;

/*  ------------------------------------------------------------
 * Spring Boot 애플리케이션의 진입점 (entry point)
 *  ------------------------------------------------------------
 * - Java 프로그램은 항상 `public static void main(String[] args)` 부터 실행됨
 * - Spring Boot는 이 main 메서드 안에서 `SpringApplication.run(...)` 을 호출하여
 *   내장 서버(Tomcat, Jetty 등)를 띄우고, IoC 컨테이너(ApplicationContext)를 초기화함
 * - 즉, 이 클래스 하나로:
 *  * 서버 실행
 *   * Bean 스캔(@Component, @Service, @Repository, @Controller 등)
 *   * @Configuration, @EnableAutoConfiguration 처리
 *   * application.properties(yml) 설정 로딩
 *   * 모든 의존성(starters) 기반 자동 설정
 ------------------------------------------------------------*/

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}
}
