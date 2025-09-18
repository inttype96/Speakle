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
@Table(name = "expressions")
public class ExpressionEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "expressions_id")
	private Long id;

	@Column(name = "learned_song_id", nullable = false)
	private String learnedSongId;

	@Column(name = "situation", length = 255)
	private String situation;

	@Column(name = "location", length = 255)
	private String location;

	@Column(name = "expression", nullable = false, length = 255)
	private String expression;

	@JdbcTypeCode(SqlTypes.LONGVARCHAR)
	@Column(name = "meaning", nullable = false, columnDefinition = "TEXT")
	private String meaning;

	@JdbcTypeCode(SqlTypes.LONGVARCHAR)
	@Column(name = "context", columnDefinition = "TEXT")
	private String context;

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
