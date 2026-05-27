import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from './../config.json';

export const userAuthApi = createApi({
  reducerPath: "userAuthApi",
  baseQuery: fetchBaseQuery({
    baseUrl: config.BACKEND_URL + config.API_PATH.USER_AUTH,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Assignment', 'Unassigned', 'LoggedUser', 'MyVarRequests', 'VarRequests', 'Notifications', 'StudentProfile'],
  endpoints: (builder) => ({
    // 1) Register
    registerUser: builder.mutation({
      query: (user) => ({
        url: "register",
        method: "POST",
        body: user,
        headers: { "content-type": "application/json" },
      }),
    }),

    // 2) Login
    loginUser: builder.mutation({
      query: (user) => ({
        url: "login",
        method: "POST",
        body: user,
        headers: { "content-type": "application/json" },
      }),
    }),

    // 3) Get Logged User
    getLoggedUser: builder.query({
      query: (token) => ({
        url: "loggeduser",
        method: "GET",
        headers: { authorization: `Bearer ${token}` },
      }),
      providesTags: ['LoggedUser'],
    }),

    // 4) Admin Dashboard
    getAdminDashboard: builder.query({
      query: (token) => ({
        url: "admin-dashboard",
        method: "GET",
        headers: { authorization: `Bearer ${token}` },
      }),
    }),

    // 5) Change Password
    changePassword: builder.mutation({
      query: ({ token, password, password_confirmation }) => ({
        url: "changepassword",
        method: "POST",
        body: { password, password_confirmation },
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
      }),
    }),

    // 6) Update Profile (name, phone, address, gender, dob, etc.)
    updateProfile: builder.mutation({
      query: (body) => ({
        url: "updateprofile",
        method: "PUT",
        body,
        headers: { "content-type": "application/json" },
      }),
      invalidatesTags: ['LoggedUser'],
    }),

    // 6a) Upload Profile Picture
    uploadProfilePicture: builder.mutation({
      query: (formData) => ({
        url: "upload-profile-picture",
        method: "POST",
        body: formData,
        // Don't set content-type for FormData, let browser set it with boundary
      }),
      invalidatesTags: ['LoggedUser'],
    }),

    // 6b) Upload Medical Record
    uploadMedicalRecord: builder.mutation({
      query: (formData) => ({
        url: "upload-medical-record",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ['LoggedUser'],
    }),

    // 7) Get my assigned students (teacher/therapist/doctor)
    getMyStudents: builder.query({
      query: () => ({ url: "my-students", method: "GET" }),
      providesTags: ['Assignment'],
    }),

    // 8) Get all staff for admin assignment panel
    getAllStaff: builder.query({
      query: () => ({ url: "all-staff", method: "GET" }),
    }),

    // 9) Get all students list for admin assignment panel
    getAllStudentsList: builder.query({
      query: () => ({ url: "all-students-list", method: "GET" }),
      providesTags: ['Assignment'],
    }),

    // 10) Assign student to staff (admin only)
    assignStudent: builder.mutation({
      query: (body) => ({
        url: "assign-student",
        method: "POST",
        body,
        headers: { "content-type": "application/json" },
      }),
      invalidatesTags: ['Assignment'],
    }),

    // 11) Self-assign: staff adds a student to themselves
    selfAssign: builder.mutation({
      query: (body) => ({
        url: "self-assign",
        method: "POST",
        body,
        headers: { "content-type": "application/json" },
      }),
      invalidatesTags: ['Assignment', 'Unassigned'],
    }),

    // 12) Get students NOT yet assigned to this staff member
    getUnassignedStudents: builder.query({
      query: () => ({ url: "unassigned-students", method: "GET" }),
      providesTags: ['Unassigned'],
    }),

    // 13) Get all schools
    getSchools: builder.query({
      query: () => ({ url: "schools", method: "GET" }),
    }),
    // 14) Get specific student profile
    getStudentProfile: builder.query({
      query: (id) => ({ url: `student-profile/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: 'StudentProfile', id }],
    }),
    // 15) Delete medical record
    deleteMedicalRecord: builder.mutation({
      query: (recordId) => ({
        url: `delete-medical-record?id=${encodeURIComponent(recordId)}`,
        method: "DELETE",
      }),
      invalidatesTags: ['LoggedUser'],
    }),
    // 16) Update Tracked Variables
    updateTrackedVariables: builder.mutation({
      query: ({ id, trackedVariables }) => ({
        url: `update-tracked-variables/${id}`,
        method: "PUT",
        body: { trackedVariables },
        headers: { "content-type": "application/json" },
      }),
      invalidatesTags: ['Assignment', 'LoggedUser'],
    }),
    // 17) Student: request to add/delete a variable
    requestVariableChange: builder.mutation({
      query: (body) => ({
        url: "variable-request",
        method: "POST",
        body,
        headers: { "content-type": "application/json" },
      }),
      invalidatesTags: ['MyVarRequests'],
    }),

    // 18) Student: get own variable requests
    getMyVariableRequests: builder.query({
      query: () => ({ url: "my-variable-requests", method: "GET" }),
      providesTags: ['MyVarRequests'],
    }),

    // 19) Teacher/Therapist: get pending variable requests
    getPendingVariableRequests: builder.query({
      query: () => ({ url: "variable-requests", method: "GET" }),
      providesTags: ['VarRequests'],
    }),

    // 20) Teacher/Therapist: approve or reject a variable request
    reviewVariableRequest: builder.mutation({
      query: ({ id, decision, reviewNote }) => ({
        url: `variable-request/${id}/review`,
        method: "PUT",
        body: { decision, reviewNote },
        headers: { "content-type": "application/json" },
      }),
      invalidatesTags: ['VarRequests', 'LoggedUser', 'StudentProfile'],
    }),

    // 21) Get notifications
    getNotifications: builder.query({
      query: () => ({ url: "notifications", method: "GET" }),
      providesTags: ['Notifications'],
    }),

    // 22) Mark all notifications read
    markNotificationsRead: builder.mutation({
      query: () => ({ url: "notifications/mark-read", method: "PUT" }),
      invalidatesTags: ['Notifications'],
    }),

    // 23) Delete a specific notification
    deleteNotification: builder.mutation({
      query: (id) => ({ url: `notifications/${id}`, method: "DELETE" }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const {
  useRegisterUserMutation,
  useLoginUserMutation,
  useGetLoggedUserQuery,
  useGetAdminDashboardQuery,
  useChangePasswordMutation,
  useUpdateProfileMutation,
  useUploadProfilePictureMutation,
  useUploadMedicalRecordMutation,
  useGetMyStudentsQuery,
  useGetAllStaffQuery,
  useGetAllStudentsListQuery,
  useAssignStudentMutation,
  useSelfAssignMutation,
  useGetUnassignedStudentsQuery,
  useGetSchoolsQuery,
  useGetStudentProfileQuery,
  useDeleteMedicalRecordMutation,
  useUpdateTrackedVariablesMutation,
  useRequestVariableChangeMutation,
  useGetMyVariableRequestsQuery,
  useGetPendingVariableRequestsQuery,
  useReviewVariableRequestMutation,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
  useDeleteNotificationMutation,
} = userAuthApi;
