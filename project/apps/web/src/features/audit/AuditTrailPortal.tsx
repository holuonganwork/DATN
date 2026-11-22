import { useMemo, useState } from "react";
import { roleLabels, type AppState } from "../../domain";

export function AuditTrailPortal({ state }: { state: AppState }) {
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const filteredEvents = useMemo(() => {
    if (categoryFilter === "ALL") return state.events;
    return state.events.filter((e) => e.aggregateType === categoryFilter);
  }, [state.events, categoryFilter]);

  return (
    <div className="page-stack">
      <div className="page-title-bar">
        <div>
          <span className="eyebrow">NHẬT KÝ SỰ KIỆN & ĐỒNG BỘ INDEXER</span>
          <h1>Nhật ký Kiểm toán Hệ thống & Giao dịch On-chain</h1>
        </div>

        <div className="filter-bar">
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="ALL">Tất cả phân mục ({state.events.length})</option>
            <option value="BATCH">Lô phát hành (BATCH)</option>
            <option value="CREDENTIAL">Chứng chỉ (CREDENTIAL)</option>
            <option value="ORGANIZATION">Tổ chức đào tạo (ORGANIZATION)</option>
            <option value="WALLET">Ví EVM (WALLET)</option>
            <option value="COURSE">Khóa đào tạo (COURSE)</option>
            <option value="LEARNER">Học viên (LEARNER)</option>
          </select>
        </div>
      </div>

      <div className="panel-card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Phân mục</th>
                <th>Hành động</th>
                <th>Tác nhân thực hiện</th>
                <th>Chi tiết kỹ thuật & Mã tương quan</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state-cell">
                      <strong>Chưa có sự kiện kiểm toán nào được ghi nhận.</strong>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <code>{ev.time}</code>
                    </td>
                    <td>
                      <span className="status-pill tone-info">{ev.aggregateType}</span>
                    </td>
                    <td>
                      <strong>{ev.action}</strong>
                    </td>
                    <td>
                      <span>{ev.actorName}</span>
                      <div className="cell-sub">{roleLabels[ev.actorRole]}</div>
                    </td>
                    <td>
                      <span>{ev.detail}</span>
                      <div className="cell-sub">
                        Correlation ID: <code>{ev.correlationId}</code>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
