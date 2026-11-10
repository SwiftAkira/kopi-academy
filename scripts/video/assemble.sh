#!/usr/bin/env bash
# Assemble final.mp4 in the current work directory, as in step 12 of the explainer-video skill:
# pad each chapter's voice to its clip, concat clips and audio, mix sound effects, mux.
# Usage: cd private/video-work/<id> && bash ../_engine/assemble.sh
set -euo pipefail
# Lora and Inter for the engine: point FONTCONFIG_FILE at a fontconfig file that includes them.
export FONTCONFIG_FILE="${FONTCONFIG_FILE:-$(cd "$(dirname "$0")" && pwd)/fonts.conf}"
LEADS=($(python3 -c "from scenes import CH; print(' '.join(str(int(round(c[3]*1000))) for c in CH))"))
: > vlist.txt; : > alist.txt
for idx in "${!LEADS[@]}"; do
  i=$((idx + 1)); n=$(printf "%02d" "$i")
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "scenes/c$n.mp4")
  ffmpeg -v error -y -i "audio/s$i.wav" -af "adelay=${LEADS[$idx]}:all=1,apad" -t "$dur" -ar 48000 -ac 1 "audio/p$i.wav"
  echo "file 'scenes/c$n.mp4'" >> vlist.txt
  echo "file 'audio/p$i.wav'" >> alist.txt
done
ffmpeg -v error -y -f concat -safe 0 -i vlist.txt -c copy video_all.mp4
ffmpeg -v error -y -f concat -safe 0 -i alist.txt -c copy audio_all.wav
python3 mix_sfx.py audio_all.wav audio_mix.wav
ffmpeg -v error -y -i video_all.mp4 -i audio_mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -movflags +faststart final.mp4
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height -of default=nw=1 final.mp4 | tr '\n' ' '; echo
