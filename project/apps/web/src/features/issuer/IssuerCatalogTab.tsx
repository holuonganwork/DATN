import { useState, type FormEvent } from "react";
import { createCourse, createLearner, type AppState, type NoticeBanner } from "../../domain";

interface IssuerCatalogTabProps {
  state: AppState;
  selectedOrg: AppState["organizations"][number];
  orgCourses: AppState["courses"];
  orgLearners: AppState["learners"];
  onStateChange: (next: AppState) => void;
  onNotify: (tone: NoticeBanner["tone"], message: string) => void;
}

export function IssuerCatalogTab({
  state,
  selectedOrg,
  orgCourses,
  orgLearners,
  onStateChange,
  onNotify,
}: IssuerCatalogTabProps) {
  const [courseCode, setCourseCode] = useState<string>("");
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [courseVersion, setCourseVersion] = useState<string>("");
  const [courseHours, setCourseHours] = useState<string>("");
  const [courseGradingRule, setCourseGradingRule] = useState<string>("");

  const [learnerCode, setLearnerCode] = useState<string>("");
  const [learnerName, setLearnerName] = useState<string>("");
  const [learnerCohort, setLearnerCohort] = useState<string>("");

  function handleCreateCourse(event: FormEvent) {
    event.preventDefault();
    const res = createCourse(state, {
      organizationId: selectedOrg.id,
      code: courseCode,
      name: courseTitle,
      version: courseVersion,
      durationHours: Number(courseHours),
      gradingRule: courseGradingRule,
    });
    if (res.error) {
      onNotify("danger", res.error);
      return;
    }
    onStateChange(res.state);
    setCourseCode("");
    setCourseTitle("");
    setCourseVersion("");
    setCourseHours("");
    setCourseGradingRule("");
    onNotify("success", "Đã thêm chương trình đào tạo mới.");
  }

  function handleCreateLearner(event: FormEvent) {
    event.preventDefault();
    const res = createLearner(state, {
      organizationId: selectedOrg.id,
      subjectRef: learnerCode,
      displayName: learnerName,
      cohort: learnerCohort,
    });
    if (res.error) {
      onNotify("danger", res.error);
      return;
    }
    onStateChange(res.state);
    setLearnerCode("");
    setLearnerName("");
    setLearnerCohort("");
    onNotify("success", `Đã thêm học viên ${res.learner?.displayName}.`);
  }

  return (
    <div className="catalog-grid-2">
      <div className="panel-card">
        <div className="panel-head">
          <div>
            <span className="eyebrow">CHƯƠNG TRÌNH ĐÀO TẠO (UC-02)</span>
            <h2>Danh mục Khóa học ({orgCourses.length})</h2>
          </div>
        </div>

        <form className="compact-form" onSubmit={handleCreateCourse}>
          <div className="form-grid-2">
            <label className="form-field">
              <span>Mã khóa học</span>
              <input
                value={courseCode}
                onChange={(event) => setCourseCode(event.target.value)}
                placeholder="Nhập mã khóa học..."
                required
              />
            </label>
            <label className="form-field">
              <span>Phiên bản chương trình</span>
              <input
                value={courseVersion}
                onChange={(event) => setCourseVersion(event.target.value)}
                placeholder="Nhập phiên bản (VD: v1.0)..."
                required
              />
            </label>
          </div>
          <label className="form-field">
            <span>Tên chương trình đào tạo</span>
            <input
              value={courseTitle}
              onChange={(event) => setCourseTitle(event.target.value)}
              placeholder="Nhập tên chương trình đào tạo..."
              required
            />
          </label>
          <div className="form-grid-2">
            <label className="form-field">
              <span>Thời lượng (giờ)</span>
              <input
                type="number"
                min={1}
                value={courseHours}
                onChange={(event) => setCourseHours(event.target.value)}
                placeholder="Nhập số giờ đào tạo..."
                required
              />
            </label>
            <label className="form-field">
              <span>Quy tắc xét hoàn thành</span>
              <input
                value={courseGradingRule}
                onChange={(event) => setCourseGradingRule(event.target.value)}
                placeholder="Nhập điều kiện xét đạt..."
                required
              />
            </label>
          </div>
          <button type="submit" className="btn-primary">
            + Thêm Khóa học
          </button>
        </form>

        <table className="data-table">
          <thead>
            <tr>
              <th>Mã khóa</th>
              <th>Tên chương trình đào tạo</th>
              <th>Thời lượng</th>
            </tr>
          </thead>
          <tbody>
            {orgCourses.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  <div className="empty-state-cell">
                    <strong>Chưa có khóa học nào.</strong>
                  </div>
                </td>
              </tr>
            ) : (
              orgCourses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <code>{course.code}</code>
                    <div className="cell-sub">{course.version}</div>
                  </td>
                  <td>
                    <strong>{course.name}</strong>
                    <div className="cell-sub">{course.gradingRule}</div>
                  </td>
                  <td>{course.durationHours} giờ</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="panel-card">
        <div className="panel-head">
          <div>
            <span className="eyebrow">HỒ SƠ NGƯỜI HỌC (UC-02)</span>
            <h2>Danh sách Học viên ({orgLearners.length})</h2>
          </div>
        </div>

        <form className="compact-form" onSubmit={handleCreateLearner}>
          <div className="form-grid-2">
            <label className="form-field">
              <span>Mã định danh học viên</span>
              <input
                value={learnerCode}
                onChange={(event) => setLearnerCode(event.target.value)}
                placeholder="Nhập mã học viên..."
                required
              />
            </label>
            <label className="form-field">
              <span>Khóa / Lớp</span>
              <input
                value={learnerCohort}
                onChange={(event) => setLearnerCohort(event.target.value)}
                placeholder="Nhập khóa/lớp..."
                required
              />
            </label>
          </div>
          <label className="form-field">
            <span>Họ và tên học viên</span>
            <input
              value={learnerName}
              onChange={(event) => setLearnerName(event.target.value)}
              placeholder="Nhập họ và tên học viên..."
              required
            />
          </label>
          <button type="submit" className="btn-primary">
            + Thêm Học viên
          </button>
        </form>

        <table className="data-table">
          <thead>
            <tr>
              <th>Mã học viên</th>
              <th>Họ và tên</th>
              <th>Khóa / Lớp</th>
            </tr>
          </thead>
          <tbody>
            {orgLearners.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  <div className="empty-state-cell">
                    <strong>Chưa có hồ sơ học viên nào.</strong>
                  </div>
                </td>
              </tr>
            ) : (
              orgLearners.map((learner) => (
                <tr key={learner.id}>
                  <td>
                    <code>{learner.subjectRef}</code>
                  </td>
                  <td>
                    <strong>{learner.displayName}</strong>
                  </td>
                  <td>{learner.cohort}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
