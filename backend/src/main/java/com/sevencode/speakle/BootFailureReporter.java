package com.sevencode.speakle;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationFailedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class BootFailureReporter implements ApplicationListener<ApplicationFailedEvent> {
	@Override
	public void onApplicationEvent(ApplicationFailedEvent e) {
		log.error("=== BOOT FAILURE ===", e.getException());
	}
}
