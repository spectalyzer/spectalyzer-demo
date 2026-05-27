import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from './../config.json';

export const studentsApi = createApi({
  reducerPath: 'studentsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: config.BACKEND_URL + config.API_PATH.USER_AUTH, // /api/user
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getStudents: builder.query({
      query: ({ search = '', page = 1, limit = 20, schoolPage, schoolLimit } = {}) => ({
        url: `/students?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}${schoolPage ? `&schoolPage=${schoolPage}` : ''}${schoolLimit ? `&schoolLimit=${schoolLimit}` : ''}`,
        method: 'GET',
        cache: 'no-store',
      }),
    }),
  }),
});

export const { useGetStudentsQuery } = studentsApi;
