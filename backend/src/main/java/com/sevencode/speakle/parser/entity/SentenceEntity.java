package com.sevencode.speakle.parser.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Getter
@Setter
@Entity
@Table(name = "sentences")
public class SentenceEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "sentences_id")
	private Long id;

	@Column(name = "song_id", nullable = false)
	private String songId;

	@Column(name = "situation", length = 255)
	private String situation;

	@Column(name = "location", length = 255)
	private String location;

	// TEXT 컬럼을 문자열(STRING)로 다루도록 지정 → IgnoreCase 파생 메서드 정상 작동
	@JdbcTypeCode(SqlTypes.LONGVARCHAR)
	@Column(name = "sentence", nullable = false, columnDefinition = "TEXT")
	private String sentence;

	// 필요하면 translation도 동일 처리(권장)
	@JdbcTypeCode(SqlTypes.LONGVARCHAR)
	@Column(name = "translation", nullable = false, columnDefinition = "TEXT")
	private String translation;

	@Column(name = "level", length = 16)
	private String level;

	@JdbcTypeCode(SqlTypes.LONGVARCHAR)
	@Column(name = "tags", columnDefinition = "TEXT")
	private String tags;

	@CreationTimestamp
	@Column(name = "created_at")
	private OffsetDateTime createdAt;
}
