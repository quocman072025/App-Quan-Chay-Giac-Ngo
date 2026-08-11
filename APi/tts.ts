let audio: HTMLAudioElement | null = null;
let lastObjectUrl: string | null = null;

export async function speak(text: string) {
  try {
    console.log('TTS text:', text);

    const res = await fetch('https://viettelai.vn/tts/speech_synthesis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*',
      },
      body: JSON.stringify({
        text,
        voice: 'hcm-diemmy',
        speed: 1,
        tts_return_option: 3,
        token: 'c299c2a2f44441a0fd8134e962489a1e',
        without_filter: false,
      }),
    });

    console.log('TTS status:', res.status, res.statusText);
    console.log('TTS content-type:', res.headers.get('content-type'));

    if (!res.ok) {
      const errorText = await res.text();
      console.error('TTS lỗi response:', errorText);
      alert('TTS lỗi: ' + errorText);
      return;
    }

    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await res.json();
      console.log('TTS JSON:', data);

      const audioUrl =
        data?.data?.url ||
        data?.url ||
        data?.audio_url ||
        data?.result?.url;

      if (!audioUrl) {
        console.error('Không tìm thấy audioUrl trong JSON:', data);
        alert('Không tìm thấy audioUrl, mở F12 > Console để xem lỗi');
        return;
      }

      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      audio = new Audio(audioUrl);
      await audio.play();
      return;
    }

    // Trường hợp Viettel trả thẳng file audio
    const blob = await res.blob();
    console.log('TTS blob:', blob);

    if (!blob || blob.size === 0) {
      alert('Không nhận được file âm thanh từ Viettel');
      return;
    }

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    if (lastObjectUrl) {
      URL.revokeObjectURL(lastObjectUrl);
    }

    lastObjectUrl = URL.createObjectURL(blob);
    audio = new Audio(lastObjectUrl);
    await audio.play();
  } catch (err) {
    console.error('TTS lỗi:', err);
    alert('Có lỗi khi gọi TTS, mở F12 > Console để xem chi tiết');
  }
}