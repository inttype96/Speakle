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
@Table(name = "idioms")
public class IdiomEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "idioms_id")
	private Long id;

	@Column(name = "song_id", nullable = false)
	private String songId;

	@Column(name = "situation", length = 255)
	private String situation;

	@Column(name = "location", length = 255)
	private String location;

	@Column(name = "phrase", nullable = false, length = 255)
	private String phrase;

	@JdbcTypeCode(SqlTypes.LONGVARCHAR)
	@Column(name = "meaning", nullable = false, columnDefinition = "TEXT")
	private String meaning;

	@JdbcTypeCode(SqlTypes.LONGVARCHAR)
	@Column(name = "examples", columnDefinition = "TEXT")
	private String examples;

	@Column(name = "level", length = 16)
	private String level;

	@JdbcTypeCode(SqlTypes.LONGVARCHAR)
	@Column(name = "tags", columnDefinition = "TEXT")
	private String tags;

	@CreationTimestamp
	@Column(name = "created_at")
	private OffsetDateTime createdAt;
}
