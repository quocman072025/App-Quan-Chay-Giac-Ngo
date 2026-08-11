let audio: HTMLAudioElement | null = null;
let url: string | null = null;

export async function speak(
  text: string,
  voice: string = 'hcm-phuongly'
) {
  try {
    const res = await fetch('https://viettelai.vn/tts/speech_synthesis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*',
      },
      body: JSON.stringify({
        text,
        voice,
        speed: 0.85,
        tts_return_option: 3,
        token: 'c299c2a2f44441a0fd8134e962489a1e',
        without_filter: false,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('TTS lỗi:', errorText);
      return;
    }

    const blob = await res.blob();

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    if (url) {
      URL.revokeObjectURL(url);
    }

    url = URL.createObjectURL(blob);

    const newAudio = new Audio();
    newAudio.src = url;
    newAudio.preload = 'auto';
    newAudio.volume = 1;

    audio = newAudio;

    await new Promise<void>((resolve) => {
      newAudio.oncanplaythrough = () => resolve();
      setTimeout(() => resolve(), 300);
    });

    await newAudio.play();
  } catch (err) {
    console.error('TTS lỗi:', err);
  }
}