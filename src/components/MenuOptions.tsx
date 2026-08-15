import { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  GripVertical,
  Power,
  RotateCcw,
  Save,
  X,
} from 'lucide-react';
import { Category } from '../data/menu';
import { MenuItemWithSetting, useMenuSettings } from '../data/menuSettings';

const categories: Category[] = ['Món chính', 'Bánh mì', 'Đồ uống', 'Món thêm', 'Thực phẩm'];

export default function MenuOptions() {
  const { items, loading, saving, saveSettings } = useMenuSettings();
  const [activeCategory, setActiveCategory] = useState<Category>('Món chính');
  const [draftItems, setDraftItems] = useState<MenuItemWithSetting[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const workingItems = draftItems.length > 0 ? draftItems : items;

  const visibleItems = useMemo(
    () => workingItems.filter((item) => item.category === activeCategory),
    [workingItems, activeCategory]
  );

  const updateItem = (id: string, patch: Partial<MenuItemWithSetting>) => {
    setDraftItems((current) => {
      const base = current.length > 0 ? current : items;
      return base.map((item) => (item.id === id ? { ...item, ...patch } : item));
    });
  };

  const resetDraft = () => setDraftItems([]);

  const handleToggle = (id: string) => {
    const current = workingItems.find((item) => item.id === id);
    if (!current) return;
    updateItem(id, { isAvailable: !current.isAvailable });
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;

    setDraftItems((current) => {
      const base = [...(current.length > 0 ? current : items)];
      const sourceIndex = base.findIndex((item) => item.id === draggedId);
      const targetIndex = base.findIndex((item) => item.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return base;

      const [moved] = base.splice(sourceIndex, 1);
      base.splice(targetIndex, 0, moved);

      return base;
    });

    setDraggedId(null);
  };

  const handleSave = async () => {
    await saveSettings(workingItems);
    setDraftItems([]);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Đang tải tùy chọn menu...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-hidden flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">TÙY CHỌN MENU</h1>
            <p className="text-sm text-gray-500 mt-1">
              Kéo thả để đổi thứ tự món. Tắt món để POS hiển thị “Hết món”.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {draftItems.length > 0 && (
              <button
                type="button"
                onClick={resetDraft}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Hoàn tác
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || draftItems.length === 0}
              className="px-4 py-2.5 rounded-xl bg-lime-600 hover:bg-lime-700 text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <div className="flex gap-2 min-w-max">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`px-4 sm:px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category
                    ? 'bg-lime-600 text-white shadow-md shadow-lime-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 lg:p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDraggedId(item.id)}
              onDragEnd={() => setDraggedId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(item.id)}
              className={`text-left rounded-2xl p-3 sm:p-4 border shadow-sm transition-all min-h-[145px] flex flex-col justify-between cursor-grab active:cursor-grabbing ${
                item.isAvailable
                  ? 'bg-white border-gray-100 hover:border-lime-300'
                  : 'bg-gray-100 border-gray-200 opacity-60'
              } ${draggedId === item.id ? 'ring-2 ring-lime-400' : ''}`}
            >
              <div className="flex items-start gap-2">
                <GripVertical className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h3 className={`font-medium line-clamp-2 leading-tight text-sm sm:text-base ${
                    item.isAvailable ? 'text-gray-800' : 'text-gray-500'
                  }`}>
                    {item.name}
                  </h3>
                  <span className="inline-block mt-2 text-[11px] sm:text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                    {item.unit}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mt-3">
                <div>
                  <p className="text-lime-600 font-bold text-sm sm:text-base">
                    {item.price.toLocaleString('vi-VN')}đ
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold mt-1 ${
                      item.isAvailable ? 'text-lime-700' : 'text-red-500'
                    }`}
                  >
                    {item.isAvailable ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {item.isAvailable ? 'Đang bán' : 'Hết món'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(item.id)}
                  className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    item.isAvailable
                      ? 'bg-lime-50 text-lime-700 hover:bg-lime-100'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                  title={item.isAvailable ? 'Tắt món' : 'Bật bán món'}
                >
                  <Power className="w-4 h-4" />
                  {item.isAvailable ? 'Tắt món' : 'Bật món'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-3 text-sm text-gray-500 shrink-0 flex items-center gap-2">
        <ChevronDown className="w-4 h-4" />
        Kéo một món lên/xuống để đổi vị trí trong nhóm “{activeCategory}”.
      </div>
    </div>
  );
}
