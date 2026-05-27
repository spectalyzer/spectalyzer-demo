import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from './../config.json';

export const dataEntryApi = createApi({
  reducerPath: "dataEntryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: config.BACKEND_URL + config.API_PATH.DATA_ENTRY,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token"); // Retrieve the token from localStorage
      if (token) {
        headers.set("Authorization", `Bearer ${token}`); // Set the Authorization header
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    createDataEntry: builder.mutation({
      query: (data) => ({
        url: "/createEntry",
        method: "POST",
        body: data.formData, // Use only the form data here
      }),
    }),
    // Define other endpoints if needed
  }),
});

// Export hooks for usage in functional components
export const { useCreateDataEntryMutation } = dataEntryApi;
