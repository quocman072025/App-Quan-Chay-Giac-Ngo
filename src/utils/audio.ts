let unlocked = false;
let activeAudio: HTMLAudioElement | null = null;
let unlockAudioEl: HTMLAudioElement | null = null;

export async function unlockAppAudio() {
  if (unlocked) return;

  try {
    unlockAudioEl = new Audio('/ting.mp3');
    unlockAudioEl.volume = 0;
    await unlockAudioEl.play();

    unlocked = true;
    console.log('[audio] unlocked SUCCESS');
  } catch (error) {
    console.warn('[audio] unlock failed:', error);
  }
}

async function playSound(src: string, volume: number = 1) {
  return new Promise<void>(async (resolve) => {
    try {
      if (!unlocked) {
        await unlockAppAudio();
      }

      if (!unlocked) {
        console.warn('[audio] chưa unlock → bỏ qua sound');
        resolve();
        return;
      }

      if (activeAudio) {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      }

      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = volume;
      activeAudio = audio;

      audio.onended = () => resolve();
      audio.onerror = () => {
        console.error(`Không phát được âm thanh: ${src}`);
        resolve();
      };

      await audio.play();

      setTimeout(resolve, 1500);
    } catch (error) {
      console.error(`Lỗi phát âm thanh ${src}:`, error);
      resolve();
    }
  });
}

export async function playNewOrderSound() {
  await playSound('/thong-bao.mp3', 1);
}

export async function playDoneSound() {
  await playSound('/hoan-thanh.mp3', 1);
}

export async function playPaymentSound() {
  await playSound('/ting.mp3', 1);
}

export async function playDeliverSound() {
  await playSound('/xe-may.mp3', 1);
}