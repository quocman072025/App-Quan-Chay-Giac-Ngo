import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { menuItems, MenuItem } from '../data/menu';

export interface MenuSetting {
  item_id: string;
  sort_order: number;
  is_available: boolean;
  updated_at?: string;
}

export type MenuSettingMap = Record<string, MenuSetting>;

export interface MenuItemWithSetting extends MenuItem {
  sortOrder: number;
  isAvailable: boolean;
}

const DEFAULT_SETTINGS: MenuSetting[] = menuItems.map((item, index) => ({
  item_id: item.id,
  sort_order: index,
  is_available: true,
}));

const mergeSettings = (rows: MenuSetting[]): MenuItemWithSetting[] => {
  const byId = new Map(rows.map((row) => [row.item_id, row]));

  return menuItems
    .map((item, originalIndex) => {
      const setting = byId.get(item.id);
      return {
        ...item,
        sortOrder: setting?.sort_order ?? originalIndex,
        isAvailable: setting?.is_available ?? true,
      };
    })
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        menuItems.indexOf(a) - menuItems.indexOf(b)
    );
};

export async function loadMenuSettings(): Promise<MenuSettingMap> {
  const { data, error } = await supabase
    .from('menu_settings')
    .select('item_id, sort_order, is_available, updated_at')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Lỗi lấy menu_settings:', error);
    throw error;
  }

  return Object.fromEntries(
    ((data ?? []) as MenuSetting[]).map((row) => [row.item_id, row])
  );
}

export async function saveMenuSetting(setting: {
  item_id: string;
  sort_order: number;
  is_available: boolean;
}): Promise<MenuSetting> {
  const { data, error } = await supabase
    .from('menu_settings')
    .upsert(
      {
        item_id: setting.item_id,
        sort_order: setting.sort_order,
        is_available: setting.is_available,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'item_id' }
    )
    .select('item_id, sort_order, is_available, updated_at')
    .single();

  if (error) {
    console.error('Lỗi lưu menu_setting:', error);
    throw error;
  }

  return data as MenuSetting;
}

export async function saveMenuSettings(
  settings: Array<{
    item_id: string;
    sort_order: number;
    is_available: boolean;
  }>
): Promise<MenuSetting[]> {
  if (settings.length === 0) return [];

  const now = new Date().toISOString();

  const rows = settings.map((setting) => ({
    item_id: setting.item_id,
    sort_order: setting.sort_order,
    is_available: setting.is_available,
    updated_at: now,
  }));

  const { data, error } = await supabase
    .from('menu_settings')
    .upsert(rows, { onConflict: 'item_id' })
    .select('item_id, sort_order, is_available, updated_at');

  if (error) {
    console.error('Lỗi lưu menu_settings:', error);
    throw error;
  }

  return (data ?? []) as MenuSetting[];
}

export const useMenuSettings = () => {
  const [settings, setSettings] =
    useState<MenuSetting[]>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('menu_settings')
        .select('item_id, sort_order, is_available, updated_at')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Lỗi lấy cài đặt menu:', error);
        return;
      }

      setSettings((data ?? []) as MenuSetting[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();

    const channel = supabase
      .channel(`menu-settings-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_settings',
        },
        () => {
          void fetchSettings();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  const items = useMemo(
    () => mergeSettings(settings),
    [settings]
  );

  const saveSettings = useCallback(
    async (nextItems: MenuItemWithSetting[]) => {
      setSaving(true);

      try {
        const payload = nextItems.map((item, index) => ({
          item_id: item.id,
          sort_order: index,
          is_available: item.isAvailable,
        }));

        const { data, error } = await supabase
          .from('menu_settings')
          .upsert(payload, { onConflict: 'item_id' })
          .select('item_id, sort_order, is_available, updated_at');

        if (error) {
          console.error('Lỗi lưu cài đặt menu:', error);
          alert(`Không thể lưu cài đặt menu: ${error.message}`);
          return false;
        }

        setSettings((data ?? payload) as MenuSetting[]);
        return true;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  return {
    items,
    loading,
    saving,
    saveSettings,
    refresh: fetchSettings,
  };
};