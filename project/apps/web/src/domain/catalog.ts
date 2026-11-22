import { normalizeText } from "./crypto";
import { appendAuditEvent } from "./helpers";
import type { AppState, Course, Learner } from "./types";

// UC-02: Courses & Learners
export const createCourse = (
  state: AppState,
  input: {
    organizationId: string;
    code: string;
    name: string;
    version: string;
    durationHours: number;
    gradingRule: string;
  },
): { state: AppState; course?: Course; error?: string } => {
  const code = normalizeText(input.code).toUpperCase();
  const name = normalizeText(input.name);
  const version = normalizeText(input.version);
  const gradingRule = normalizeText(input.gradingRule);

  if (!input.organizationId) {
    return { state, error: "Vui lòng chọn tổ chức đào tạo trước khi tạo khóa học." };
  }
  if (!code || !name || !version || !gradingRule || !Number.isFinite(input.durationHours) || input.durationHours <= 0) {
    return {
      state,
      error: "Vui lòng nhập đầy đủ mã khóa học, tên khóa học, phiên bản, quy tắc xét đạt và thời lượng hợp lệ.",
    };
  }
  if (
    state.courses.some(
      (course) =>
        course.organizationId === input.organizationId &&
        course.code.toUpperCase() === code &&
        course.version.toLowerCase() === version.toLowerCase(),
    )
  ) {
    return { state, error: `Khóa học ${code} (${version}) đã tồn tại trong đơn vị.` };
  }

  const newCourse: Course = {
    id: `crs_${state.courses.length + 1}_${Date.now().toString(36).slice(-4)}`,
    organizationId: input.organizationId,
    code,
    name,
    version,
    durationHours: input.durationHours,
    gradingRule,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  };

  return {
    course: newCourse,
    state: {
      ...state,
      courses: [...state.courses, newCourse],
      events: appendAuditEvent(state, {
        action: "COURSE_CREATED",
        actorRole: state.activeRole,
        actorName: state.activeRole,
        organizationId: input.organizationId,
        aggregateType: "COURSE",
        aggregateId: newCourse.id,
        detail: `Tạo khóa học ${code} — ${name} (${version})`,
      }),
    },
  };
};

export const createLearner = (
  state: AppState,
  input: {
    organizationId: string;
    subjectRef: string;
    displayName: string;
    cohort: string;
  },
): { state: AppState; learner?: Learner; error?: string } => {
  const subjectRef = normalizeText(input.subjectRef).toUpperCase();
  const displayName = normalizeText(input.displayName);
  const cohort = normalizeText(input.cohort);

  if (!input.organizationId) {
    return { state, error: "Vui lòng chọn tổ chức đào tạo trước khi thêm học viên." };
  }
  if (!subjectRef || !displayName || !cohort) {
    return { state, error: "Vui lòng nhập đầy đủ mã học viên, họ tên và khóa/lớp." };
  }
  if (
    state.learners.some(
      (learner) =>
        learner.organizationId === input.organizationId &&
        learner.subjectRef.toUpperCase() === subjectRef,
    )
  ) {
    return { state, error: `Mã học viên ${subjectRef} đã tồn tại trong đơn vị.` };
  }

  const newLearner: Learner = {
    id: `lrn_${state.learners.length + 1}_${Date.now().toString(36).slice(-4)}`,
    organizationId: input.organizationId,
    subjectRef,
    displayName,
    cohort,
    createdAt: new Date().toISOString(),
  };

  return {
    learner: newLearner,
    state: {
      ...state,
      learners: [...state.learners, newLearner],
      events: appendAuditEvent(state, {
        action: "LEARNER_CREATED",
        actorRole: state.activeRole,
        actorName: state.activeRole,
        organizationId: input.organizationId,
        aggregateType: "LEARNER",
        aggregateId: newLearner.id,
        detail: `Thêm hồ sơ học viên ${displayName} (${subjectRef})`,
      }),
    },
  };
};
