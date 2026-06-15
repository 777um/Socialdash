
import yt_dlp
import os
from pydub import AudioSegment
from openai import OpenAI

# Initialize OpenAI client (API key is pre-configured in sandbox environment)
client = OpenAI()

def download_video_and_extract_audio(video_url, output_audio_path="downloaded_audio.mp3"):
    # Define temporary video path
    temp_video_path = "temp_video.mp4"

    # Step 1: Download the video
    ydl_opts_video = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': temp_video_path,
        'quiet': False,
        'no_warnings': False,
    }
    print(f"Tentando baixar o vídeo de: {video_url}")
    try:
        with yt_dlp.YoutubeDL(ydl_opts_video) as ydl:
            ydl.download([video_url])
        print(f"Vídeo baixado para: {temp_video_path}")
    except Exception as e:
        print(f"Erro ao baixar o vídeo: {e}")
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)
        return None

    # Step 2: Extract audio from the downloaded video
    if os.path.exists(temp_video_path):
        print(f"Extraindo áudio de {temp_video_path} para {output_audio_path}")
        try:
            audio = AudioSegment.from_file(temp_video_path)
            audio.export(output_audio_path, format="mp3")
            print("Áudio extraído com sucesso.")
            os.remove(temp_video_path) # Clean up temporary video file
            print(f"Arquivo de vídeo temporário {temp_video_path} removido.")
            return output_audio_path
        except Exception as e:
            print(f"Erro ao extrair áudio: {e}")
            os.remove(temp_video_path)
            print(f"Arquivo de vídeo temporário {temp_video_path} removido.")
            return None
    return None

def transcribe_audio(audio_file_path):
    try:
        # Whisper API supports files up to 25 MB
        if os.path.getsize(audio_file_path) > 25 * 1024 * 1024:
            print("O arquivo de áudio é muito grande para a Whisper API (limite de 25MB).")
            print("Por favor, forneça um arquivo menor ou divida-o.")
            return None

        with open(audio_file_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file
            )
        return transcript.text
    except Exception as e:
        print(f"Erro ao transcrever áudio: {e}")
        return None

if __name__ == '__main__':
    video_url = input("Por favor, insira a URL do vídeo do YouTube para transcrever: ")
    
    audio_output_file = "downloaded_audio.mp3"
    downloaded_audio_file = download_video_and_extract_audio(video_url, audio_output_file)

    if downloaded_audio_file and os.path.exists(downloaded_audio_file):
        print("Transcrevendo áudio com Whisper API...")
        transcription_text = transcribe_audio(downloaded_audio_file)

        if transcription_text:
            output_txt_file = "transcription.txt"
            with open(output_txt_file, "w", encoding="utf-8") as f:
                f.write(transcription_text)
            print(f"Transcrição salva em: {output_txt_file}")
            print("\n--- Conteúdo da Transcrição ---")
            print(transcription_text[:500] + "..." if len(transcription_text) > 500 else transcription_text)
            print("-------------------------------")
        else:
            print("Não foi possível obter a transcrição.")
        
        os.remove(downloaded_audio_file) # Clean up downloaded audio file
        print(f"Arquivo de áudio temporário {downloaded_audio_file} removido.")
    else:
        print("Falha ao baixar ou extrair o áudio.")
