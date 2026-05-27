import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from './../config.json';

export const finalScoreService = createApi({
  reducerPath: "finalScoreService",
  baseQuery: fetchBaseQuery({
    baseUrl: config.BACKEND_URL + config.API_PATH.FINAL_SCORE,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getFinalScore: builder.query({
      query: ({ token, selectedDate, startDate, endDate, userId, rangeDays }) => {
        const params = new URLSearchParams();
        if (selectedDate) params.set("selectedDate", selectedDate);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        if (userId) params.set("userId", userId);
        // Always send rangeDays, default to 30 if not provided
        const finalRangeDays = rangeDays || 30;
        params.set("rangeDays", finalRangeDays);
        const queryString = params.toString() ? `?${params.toString()}` : "";
        return {
          url: `/getFinalScore${queryString}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
      },
    }),
  }),
});

export const { useGetFinalScoreQuery } = finalScoreService;
