package com.sevencode.speakle.member.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class JpaMemberEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "user_id")
	private Long id;

	@Column(name = "email", nullable = true, length = 255)
	private String email;

	@Column(name = "password", nullable = true, length = 255)
	private String password;

	@Column(name = "username", nullable = false, length = 50)
	private String username;

	@Column(name = "gender", length = 20)
	private String gender;

	@Column(name = "birth")
	private LocalDate birth;

	@Column(name = "profile_image_url", length = 500)
	private String profileImageUrl;

	@Column(name = "is_deleted", nullable = false)
	private boolean deleted;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private OffsetDateTime updatedAt;
}