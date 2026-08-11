export type SoundSettings = {
  enabled: boolean;
  speechEnabled: boolean;
  orderSoundEnabled: boolean;
  paymentSoundEnabled: boolean;
  kitchenDoneSoundEnabled: boolean;
};

const STORAGE_KEY = 'giacngo_sound_settings_v1';

export const defaultSoundSettings: SoundSettings = {
  enabled: true,
  speechEnabled: true,
  orderSoundEnabled: true,
  paymentSoundEnabled: true,
  kitchenDoneSoundEnabled: true,
};

export function getSoundSettings(): SoundSettings {
  if (typeof window === 'undefined') return defaultSoundSettings;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSoundSettings;

    return {
      ...defaultSoundSettings,
      ...JSON.parse(raw),
    };
  } catch {
    return defaultSoundSettings;
  }
}

export function saveSoundSettings(settings: Partial<SoundSettings>) {
  if (typeof window === 'undefined') return;

  const next = {
    ...getSoundSettings(),
    ...settings,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

/** Tương thích với App.tsx cũ */
export function getSoundEnabled(): boolean {
  return getSoundSettings().enabled;
}

/** Tương thích với App.tsx cũ */
export function setSoundEnabled(enabled: boolean) {
  saveSoundSettings({ enabled });
}