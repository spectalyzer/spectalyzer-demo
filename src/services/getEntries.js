import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from './../config.json';

export const getEntries = createApi({
  reducerPath: "getEntries",
  baseQuery: fetchBaseQuery({
    baseUrl: config.BACKEND_URL + config.API_PATH.GET_ENTRY,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getUserEntries: builder.query({
      query: ({ token, userId } = {}) => {
        const authToken = token || localStorage.getItem("token");
        const queryString = userId ? `?userId=${encodeURIComponent(userId)}` : "";
        const request = {
          url: `/getUserEntries${queryString}`,
          method: "GET",
        };

        if (authToken) {
          request.headers = {
            Authorization: `Bearer ${authToken}`,
          };
        }

        return request;
      },
    }),
  }),
});

// Export your hooks for usage in functional components
export const { useGetUserEntriesQuery } = getEntries;
