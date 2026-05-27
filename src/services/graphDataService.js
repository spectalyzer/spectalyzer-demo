import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from './../config.json';

const buildQueryString = (args) => {
  if (!args) return "";
  const params = new URLSearchParams();
  if (typeof args === "string") {
    params.set("userId", args);
  } else {
    if (args.userId) params.set("userId", args.userId);
    if (args.selectedDate) params.set("selectedDate", args.selectedDate);
    // support range in days (e.g. 30 => last 30 days)
    if (args.rangeDays) params.set("rangeDays", args.rangeDays);
    if (args.days) params.set("rangeDays", args.days);
    // support explicit start/end dates if provided
    if (args.startDate) params.set("startDate", args.startDate);
    if (args.endDate) params.set("endDate", args.endDate);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
};

export const graphDataService = createApi({
  reducerPath: "graphDataService",
  baseQuery: fetchBaseQuery({
    baseUrl: config.BACKEND_URL + config.API_PATH.GRAPH_DATA,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),

  endpoints: (builder) => ({
    getschoolingPieChartData: builder.query({
      query: (args) => ({
        url: `/getschoolingPieChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getFoodBarChartData: builder.query({
      query: (args) => ({
        url: `/getFoodBarChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),

    createEntry: builder.mutation({
      query: (data) => ({
        url: "/createEntry",
        method: "POST",
        body: data,
      }),
    }),
    getSleepingLineChartData: builder.query({
      query: (args) => ({
        url: `/getSleepingLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getscreenTimeBarChartData: builder.query({
      query: (args) => ({
        url: `/getscreenTimeBarChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getmakingNoiseBarChartData: builder.query({
      query: (args) => ({
        url: `/getmakingNoiseBarChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getwalkingLineChartData: builder.query({
      query: (args) => ({
        url: `/getwalkingLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getwakingUpBarChartData: builder.query({
      query: (args) => ({
        url: `/getwakingUpBarChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getfirstGoOutLineChartData: builder.query({
      query: (args) => ({
        url: `/getfirstGoOutLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getcooperateAtHomeLineChartData: builder.query({
      query: (args) => ({
        url: `/getcooperateAtHomeLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getcooperateAtSchoolLineChartData: builder.query({
      query: (args) => ({
        url: `/getcooperateAtSchoolLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getitemThrowLineChartData: builder.query({
      query: (args) => ({
        url: `/getitemThrowLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getfoodWaterThrowLineChartData: builder.query({
      query: (args) => ({
        url: `/getfoodWaterThrowLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getoutgoingTendencyLineChartData: builder.query({
      query: (args) => ({
        url: `/getoutgoingTendencyLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getoutgoingCountLineChartData: builder.query({
      query: (args) => ({
        url: `/getoutgoingCountLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getrequiredSleepTimeLineChartData: builder.query({
      query: (args) => ({
        url: `/getrequiredSleepTimeLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getpushingTendencyLineChartData: builder.query({
      query: (args) => ({
        url: `/getpushingTendencyLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    gethitWithHandLineChartData: builder.query({
      query: (args) => ({
        url: `/gethitWithHandLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    gethitWithHeadLineChartData: builder.query({
      query: (args) => ({
        url: `/gethitWithHeadLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getglassCrashLineChartData: builder.query({
      query: (args) => ({
        url: `/getglassCrashLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    gettoiletLineChartData: builder.query({
      query: (args) => ({
        url: `/gettoiletLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getmasturbationLineChartData: builder.query({
      query: (args) => ({
        url: `/getmasturbationLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getshowingAngerLineChartData: builder.query({
      query: (args) => ({
        url: `/getshowingAngerLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getcuttingNailsLineChartData: builder.query({
      query: (args) => ({
        url: `/getcuttingNailsLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    gethairDressingLineChartData: builder.query({
      query: (args) => ({
        url: `/gethairDressingLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getsicknessDoughnutChartData: builder.query({
      query: (args) => ({
        url: `/getsicknessDoughnutChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    gettherapyTypeDoughnutChartData: builder.query({
      query: (args) => ({
        url: `/gettherapyTypeDoughnutChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getTherapyCalendar: builder.query({
      query: (args) => ({
        url: `/getTherapyCalendar${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getbedwettingDoughnutChartData: builder.query({
      query: (args) => ({
        url: `/getbedwettingDoughnutChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getgoingToSleepBarChartData: builder.query({
      query: (args) => ({
        url: `/getgoingToSleepBarChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getclassActivityLineChartData: builder.query({
      query: (args) => ({
        url: `/getclassActivityLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getoutdoorActivityLineChartData: builder.query({
      query: (args) => ({
        url: `/getoutdoorActivityLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getjunkFoodLineChartData: builder.query({
      query: (args) => ({
        url: `/getjunkFoodLineChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getShowingAngerAverageCard: builder.query({
      query: (args) => ({
        url: `/getShowingAngerAverageCard${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    gethitWithHandAverageCard: builder.query({
      query: (args) => ({
        url: `/gethitWithHandAverageCard${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getoutgoingTendencyAverageCard: builder.query({
      query: (args) => ({
        url: `/getoutgoingTendencyAverageCard${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getbedwettingAverageCard: builder.query({
      query: (args) => ({
        url: `/getbedwettingAverageCard${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getcooperateAtSchoolAverageCard: builder.query({
      query: (args) => ({
        url: `/getcooperateAtSchoolAverageCard${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getschoolingCountCard: builder.query({
      query: (args) => ({
        url: `/getschoolingCountCard${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    gettherapyAtSchoolCountCard: builder.query({
      query: (args) => ({
        url: `/gettherapyAtSchoolCountCard${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
    getAllCustomVariablesChartData: builder.query({
      query: (args) => ({
        url: `/getAllCustomVariablesChartData${buildQueryString(args)}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useGetschoolingPieChartDataQuery,
  useGetFoodBarChartDataQuery,
  useGetSleepingLineChartDataQuery,
  useGetscreenTimeBarChartDataQuery,
  useGetmakingNoiseBarChartDataQuery,
  useGetwalkingLineChartDataQuery,
  useGetwakingUpBarChartDataQuery,
  useGetfirstGoOutLineChartDataQuery,
  useGetcooperateAtHomeLineChartDataQuery,
  useGetcooperateAtSchoolLineChartDataQuery,
  useGetitemThrowLineChartDataQuery,
  useGetfoodWaterThrowLineChartDataQuery,
  useGetoutgoingTendencyLineChartDataQuery,
  useGetoutgoingCountLineChartDataQuery,
  useGetrequiredSleepTimeLineChartDataQuery,
  useGetpushingTendencyLineChartDataQuery,
  useGethitWithHandLineChartDataQuery,
  useGethitWithHeadLineChartDataQuery,
  useGetglassCrashLineChartDataQuery,
  useGettoiletLineChartDataQuery,
  useGetmasturbationLineChartDataQuery,
  useGetshowingAngerLineChartDataQuery,
  useGetcuttingNailsLineChartDataQuery,
  useGethairDressingLineChartDataQuery,
  useGetsicknessDoughnutChartDataQuery,
  useGettherapyTypeDoughnutChartDataQuery,
  useGetbedwettingDoughnutChartDataQuery,
  useGetTherapyCalendarQuery,
  useGetgoingToSleepBarChartDataQuery,
  useGetclassActivityLineChartDataQuery,
  useGetoutdoorActivityLineChartDataQuery,
  useGetjunkFoodLineChartDataQuery,
  useGetShowingAngerAverageCardQuery,
  useGethitWithHandAverageCardQuery,
  useGetoutgoingTendencyAverageCardQuery,
  useGetbedwettingAverageCardQuery,
  useGetcooperateAtSchoolAverageCardQuery,
  useGetschoolingCountCardQuery,
  useGettherapyAtSchoolCountCardQuery,
  useGetAllCustomVariablesChartDataQuery,
  useCreateEntryMutation,
} = graphDataService;
