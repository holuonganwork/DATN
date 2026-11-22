import type { NoticeBanner } from "../../domain";

interface ToastViewportProps {
  notice: NoticeBanner | null;
  noticeHovered: boolean;
  onHoverChange: (hovered: boolean) => void;
  onDismiss: () => void;
}

export function ToastViewport({
  notice,
  noticeHovered,
  onHoverChange,
  onDismiss,
}: ToastViewportProps) {
  return (
    <div className="toast-popup-viewport" aria-live="polite" aria-atomic="true">
      {notice && (
        <div
          key={notice.id}
          role={notice.tone === "danger" ? "alert" : "status"}
          className={`toast-popup-card tone-${notice.tone}`}
          onMouseEnter={() => onHoverChange(true)}
          onMouseLeave={() => onHoverChange(false)}
        >
          <div className="toast-popup-surface">
            <div className="toast-popup-head">
              <span className="notice-badge">
                {notice.tone === "success"
                  ? "THÀNH CÔNG"
                  : notice.tone === "warning"
                    ? "CHÚ Ý"
                    : "LỖI NGHIỆP VỤ"}
              </span>
              <button
                type="button"
                className="notice-dismiss"
                aria-label="Đóng thông báo"
                onClick={onDismiss}
              >
                Đóng ✕
              </button>
            </div>
            <p className="toast-popup-message">{notice.message}</p>
          </div>
          <div
            className={`toast-popup-progress${noticeHovered ? " paused" : ""}`}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
