const fs = require('fs');
const path = require('path');

const servicePath = path.join(__dirname, '../src/services/graphDataService.js');
let content = fs.readFileSync(servicePath, 'utf8');

if (!content.includes('getAllCustomVariablesChartData')) {
  content = content.replace(
    'gettherapyAtSchoolCountCard: builder.query({',
    `getAllCustomVariablesChartData: builder.query({
      query: (args) => ({
        url: \`/getAllCustomVariablesChartData\${buildQueryString(args)}\`,
        method: "GET",
      }),
    }),
    gettherapyAtSchoolCountCard: builder.query({`
  );
  content = content.replace(
    'useGettherapyAtSchoolCountCardQuery,',
    `useGettherapyAtSchoolCountCardQuery,\n  useGetAllCustomVariablesChartDataQuery,`
  );
  fs.writeFileSync(servicePath, content);
  console.log('Added getAllCustomVariablesChartData to graphDataService.js');
} else {
  console.log('Already exists in graphDataService.js');
}
