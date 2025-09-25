package com.sevencode.speakle.spotify.dto.response;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@Data
public class SpotifySearchResponse {
    private TracksResponse tracks;

    @Data
    public static class TracksResponse {
        private List<Track> items;

        @Data
        public static class Track {
            private String id;
            private String name;
            private Album album;
            private List<Artist> artists;

            @Data
            public static class Album {
                private String id;
                private String name;
                private List<Image> images;

                @Data
                public static class Image {
                    private String url;
                    private Integer height;
                    private Integer width;
                }
            }

            @Data
            public static class Artist {
                private String id;
                private String name;
            }
        }
    }
}