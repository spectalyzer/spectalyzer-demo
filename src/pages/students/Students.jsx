import React, { useState, useEffect } from 'react';
import { useGetStudentsQuery } from '../../services/studentsApi';
import { Link } from 'react-router-dom';
import { hasAnyRole, getUserRole } from '../../services/tokenService';
import './Students.css';

const CLASS_SECTIONS = ["Autisom -1", "Autisom -2", "Autisom -3", "ECDP -1"];

const Students = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [schoolPage, setSchoolPage] = useState(1);
  const limit = 10;
  const isSuperAdmin = getUserRole() === 'superadmin';

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isFetching, isError } = useGetStudentsQuery(
    isSuperAdmin
      ? { search: debouncedSearch, page: 1, limit: 100, schoolPage, schoolLimit: 1 }
      : { search: debouncedSearch, page, limit }
  );

  const students = data?.data?.students || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const schoolPagination = data?.data?.schoolPagination || null;
  const currentSchool = schoolPagination?.schools?.[0] || null;
  const userRole = getUserRole();
  const showClassSections = hasAnyRole(['admin', 'superadmin']);
  const roleScopedTitle = userRole === 'doctor'
    ? 'My Students (Doctor)'
    : userRole === 'teacher'
      ? 'My Students (Teacher)'
      : userRole === 'therapist'
        ? 'My Students (Therapist)'
        : 'Students';

  const groupedByClass = CLASS_SECTIONS.reduce((acc, className) => {
    acc[className] = [];
    return acc;
  }, {});

  if (showClassSections) {
    students.forEach((student) => {
      const classKey = CLASS_SECTIONS.includes(student.class) ? student.class : 'Unassigned';
      if (!groupedByClass[classKey]) {
        groupedByClass[classKey] = [];
      }
      groupedByClass[classKey].push(student);
    });
  }

  const getInitials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  if (!hasAnyRole(['therapist','doctor','teacher','admin','superadmin'])) {
    return <div className="students-page"><p>Access denied.</p></div>;
  }

  return (
    <div className="students-page">
      <h2>{roleScopedTitle}</h2>
      <div className="students-controls">
        <input
          placeholder="Search by name, email or ID"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
            setSchoolPage(1);
          }}
        />
      </div>

      {isSuperAdmin && schoolPagination ? (
        <div className="students-school-pagination">
          <button
            disabled={schoolPagination.page <= 1}
            onClick={() => setSchoolPage((p) => Math.max(1, p - 1))}
          >
            Prev School
          </button>
          <span>
            School Page {schoolPagination.page} / {schoolPagination.totalPages}
            {currentSchool ? (
              <>
                {' '}|{' '}
                <span className="students-school-highlight">{currentSchool.name}</span>
                {' '}
                <span className="students-school-count">({currentSchool.studentsCount} students)</span>
              </>
            ) : null}
          </span>
          <button
            disabled={schoolPagination.page >= schoolPagination.totalPages}
            onClick={() => setSchoolPage((p) => Math.min(schoolPagination.totalPages, p + 1))}
          >
            Next School
          </button>
        </div>
      ) : null}

      <div className="students-grid-wrapper">
        {isFetching ? (
          <p>Loading...</p>
        ) : isError ? (
          <p>Error loading students</p>
        ) : students.length === 0 ? (
          <p>No assigned students found</p>
        ) : (
          showClassSections ? (
            <div className="students-class-sections">
              {Object.entries(groupedByClass).filter(([className]) => className !== 'Unassigned').map(([className, classStudents]) => (
                <section key={className} className="students-class-section">
                  <div className="students-class-header">
                    <h3>{className}</h3>
                    <span>{classStudents.length} Student{classStudents.length === 1 ? '' : 's'}</span>
                  </div>
                  {classStudents.length === 0 ? (
                    <p className="students-empty-class">No students in this class on current page.</p>
                  ) : (
                    <div className="students-grid">
                      {classStudents.map((s) => (
                        <div key={s._id} className="student-card">
                          <div className="student-card__avatar">
                            <span>{getInitials(s.name || "Student")}</span>
                          </div>
                          <div className="student-card__info">
                            <h3>{s.name}</h3>
                            <p className="student-card__meta">ID: {String(s._id).slice(-6)}</p>
                            <p className="student-card__meta">
                              Last activity: {s.lastActivity ? new Date(s.lastActivity).toLocaleString() : "N/A"}
                            </p>
                          </div>
                          <Link
                            to={`/studentoverview/dashboard?userId=${s._id}&studentName=${encodeURIComponent(s.name || "Student")}`}
                            className="student-card__button"
                          >
                            View Reports
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
              {groupedByClass.Unassigned ? (
                <section className="students-class-section">
                  <div className="students-class-header">
                    <h3>Unassigned</h3>
                    <span>{groupedByClass.Unassigned.length} Student{groupedByClass.Unassigned.length === 1 ? '' : 's'}</span>
                  </div>
                  {groupedByClass.Unassigned.length === 0 ? (
                    <p className="students-empty-class">No unassigned students on current page.</p>
                  ) : (
                    <div className="students-grid">
                      {groupedByClass.Unassigned.map((s) => (
                        <div key={s._id} className="student-card">
                          <div className="student-card__avatar">
                            <span>{getInitials(s.name || "Student")}</span>
                          </div>
                          <div className="student-card__info">
                            <h3>{s.name}</h3>
                            <p className="student-card__meta">ID: {String(s._id).slice(-6)}</p>
                            <p className="student-card__meta">
                              Last activity: {s.lastActivity ? new Date(s.lastActivity).toLocaleString() : "N/A"}
                            </p>
                          </div>
                          <Link
                            to={`/studentoverview/dashboard?userId=${s._id}&studentName=${encodeURIComponent(s.name || "Student")}`}
                            className="student-card__button"
                          >
                            View Reports
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ) : null}
            </div>
          ) : (
            <div className="students-grid">
              {students.map((s) => (
                <div key={s._id} className="student-card">
                  <div className="student-card__avatar">
                    <span>{getInitials(s.name || "Student")}</span>
                  </div>
                  <div className="student-card__info">
                    <h3>{s.name}</h3>
                    <p className="student-card__meta">ID: {String(s._id).slice(-6)}</p>
                    <p className="student-card__meta">
                      Last activity: {s.lastActivity ? new Date(s.lastActivity).toLocaleString() : "N/A"}
                    </p>
                  </div>
                  <Link
                    to={`/studentoverview/dashboard?userId=${s._id}&studentName=${encodeURIComponent(s.name || "Student")}`}
                    className="student-card__button"
                  >
                    View Reports
                  </Link>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {!isSuperAdmin ? (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
          <span>Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      ) : null}
    </div>
  );
};

export default Students;
