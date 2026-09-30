import React, { useState } from 'react';
import { CallHistoryItem } from '../types';
import { X, Trash2, RotateCcw, Copy, Check, History } from 'lucide-react';
import { playButtonClick } from '../utils/soundEffects';

interface CallHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: CallHistoryItem[];
  onClearHistory: () => void;
  onResetCalledStatus: () => void;
  soundVolume: number;
}

const MODE_LABELS: Record<string, string> = {
  cage: '🎱 Lồng cầu',
  wheel: '🎡 Vòng quay',
  box: '🎁 Hộp bí mật',
  balloon: '🎈 Bóng bay',
  number: '🎰 Máy chọn số',
};

export const CallHistoryModal: React.FC<CallHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onResetCalledStatus,
  soundVolume,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    playButtonClick(soundVolume);
    const text = history
      .map((item, idx) => `${idx + 1}. ${item.studentName} (Số: ${item.studentNumber})`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900">
                Lịch sử học sinh đã gọi
              </h3>
              <p className="text-xs text-slate-500">
                Đã gọi: <strong className="text-amber-600">{history.length}</strong> lượt
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playButtonClick(soundVolume);
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4">
          {history.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <History className="w-12 h-12 mx-auto stroke-[1.5] mb-2 opacity-50" />
              <p className="text-sm font-semibold">Chưa có học sinh nào được gọi.</p>
              <p className="text-xs mt-1">Hãy nhấn nút quay để bắt đầu gọi tên học sinh!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item, idx) => {
                const timeStr = new Date(item.calledAt).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{item.studentName}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>Số: {item.studentNumber}</span>
                          <span>·</span>
                          <span>{timeStr}</span>
                          <span>·</span>
                          <span className="text-amber-600 font-medium">{MODE_LABELS[item.mode] || item.mode}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors"
                  title="Sao chép toàn bộ danh sách đã gọi"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Bạn có chắc muốn xóa lịch sử các lần gọi này?')) {
                      playButtonClick(soundVolume);
                      onClearHistory();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa lịch sử</span>
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => {
              playButtonClick(soundVolume);
              onResetCalledStatus();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại lượt gọi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
