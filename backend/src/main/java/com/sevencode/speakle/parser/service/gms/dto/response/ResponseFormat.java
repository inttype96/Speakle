package com.sevencode.speakle.parser.service.gms.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * ResponseFormat
 * - 용도: OpenAI Responses API의 response_format 래핑.
 * - 특징: type이 "json_schema"일 때 json_schema(name + schema) 제공.
 * - 전송 최적화: null 필드는 직렬화에서 제외(@JsonInclude.NON_NULL).
 *
 * 사용 예)
 *   ResponseFormat.JsonSchema js = new ResponseFormat.JsonSchema("ParsingResponse", schemaJson);
 *   ResponseFormat rf = new ResponseFormat("json_schema", js);
 *   request.setResponse_format(rf);
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ResponseFormat {
	private String type;          // 예: "json_schema"
	private JsonSchema json_schema; // 스키마 지정(옵션)

	public ResponseFormat() {
	}

	public ResponseFormat(String type, JsonSchema json_schema) {
		this.type = type;
		this.json_schema = json_schema;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public JsonSchema getJson_schema() {
		return json_schema;
	}

	public void setJson_schema(JsonSchema json_schema) {
		this.json_schema = json_schema;
	}

	/**
	 * json_schema 페이로드
	 * - name  : 스키마 식별자(게이트웨이/모델 로그 구분에 유용)
	 * - schema: 실제 JSON Schema(v1 호환). 자유로운 JsonNode로 보관.
	 */
	@JsonInclude(JsonInclude.Include.NON_NULL)
	public static class JsonSchema {
		private String name;   // 스키마 이름(필수 권장)
		private JsonNode schema; // 스키마 본문(JSON)

		public JsonSchema() {
		}

		public JsonSchema(String name, JsonNode schema) {
			this.name = name;
			this.schema = schema;
		}

		public String getName() {
			return name;
		}

		public void setName(String name) {
			this.name = name;
		}

		public JsonNode getSchema() {
			return schema;
		}

		public void setSchema(JsonNode schema) {
			this.schema = schema;
		}
	}
}
