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
@Table(name = "words")
public class WordEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "words_id")
	private Long id;

	@Column(name = "learned_song_id", nullable = false)
	private String learnedSongId;

	@Column(name = "situation", length = 255)
	private String situation;

	@Column(name = "location", length = 255)
	private String location;

	@Column(name = "word", nullable = false, length = 255)
	private String word;

	@Column(name = "phonetic", length = 255)
	private String phonetic;

	@JdbcTypeCode(SqlTypes.LONGVARCHAR)
	@Column(name = "meaning", nullable = false, columnDefinition = "TEXT")
	private String meaning;

	@Column(name = "pos", length = 32)
	private String pos;

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
