package com.sevencode.speakle.config.redis;

import com.sevencode.speakle.event.consumer.PlaylistEventConsumer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.stream.StreamMessageListenerContainer;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class StreamListenerConfig {

	private final PlaylistEventConsumer playlistEventConsumer;

	@Bean
	public ApplicationRunner streamListenerRunner(
		StreamMessageListenerContainer<String, MapRecord<String, String, String>> container,
		String streamConsumerName
	) {
		return args -> {
			log.info("===== StreamListener 초기화 시작 =====");

			container.receive(
				Consumer.from(RedisStreamsConfig.GROUP, streamConsumerName),
				StreamOffset.create(
					com.sevencode.speakle.event.publisher.UserEventPublisher.STREAM_KEY,
					ReadOffset.from(">")  // Consumer Group에서 미처리 메시지부터
				),
				playlistEventConsumer::onMessage
			);

			if (!container.isRunning()) {
				container.start();
				log.info("Redis Streams 컨테이너 시작됨");
			}
			log.info("===== StreamListener 초기화 완료 =====");
		};
	}
}
