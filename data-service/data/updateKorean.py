# songs_lyrics.sql → update_korean.sql 변환
input_file = r"C:\Users\SSAFY\Downloads\songs_lyrics.sql"
output_file = r"C:\Users\SSAFY\Downloads\update_korean.sql"

with open(input_file, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

updates = []
in_copy = False
for line in lines:
    if line.startswith("COPY public.songs_lyrics"):
        in_copy = True
        continue
    if in_copy:
        if line.strip() == "\\.":
            break
        parts = line.strip().split("\t")
        if len(parts) >= 5:
            songs_lyrics_id, english, korean, start_time_ms, song_id = parts[:5]
            korean_safe = korean.replace("'", "''")
            sql = f"UPDATE songs_lyrics SET korean='{korean_safe}' WHERE songs_lyrics_id='{songs_lyrics_id}';"
            updates.append(sql)

with open(output_file, "w", encoding="utf-8") as f:
    f.write("\n".join(updates))

print(f"완료! 총 {len(updates)} 개의 UPDATE문 생성됨 → {output_file}")
