import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createDistrictInputSchema, 
  createWeatherDataInputSchema,
  createHistoricalDisasterInputSchema,
  generateRiskPredictionInputSchema,
  getRiskPredictionsInputSchema
} from './schema';

// Import handlers
import { createDistrict } from './handlers/create_district';
import { getDistricts } from './handlers/get_districts';
import { createWeatherData } from './handlers/create_weather_data';
import { getWeatherData } from './handlers/get_weather_data';
import { createHistoricalDisaster } from './handlers/create_historical_disaster';
import { getHistoricalDisasters } from './handlers/get_historical_disasters';
import { generateRiskPredictions } from './handlers/generate_risk_predictions';
import { getRiskPredictions } from './handlers/get_risk_predictions';
import { generateRiskReport } from './handlers/generate_risk_report';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // District management
  createDistrict: publicProcedure
    .input(createDistrictInputSchema)
    .mutation(({ input }) => createDistrict(input)),
  
  getDistricts: publicProcedure
    .query(() => getDistricts()),

  // Weather data management
  createWeatherData: publicProcedure
    .input(createWeatherDataInputSchema)
    .mutation(({ input }) => createWeatherData(input)),
  
  getWeatherData: publicProcedure
    .input(getRiskPredictionsInputSchema.pick({ district_id: true, start_date: true, end_date: true }))
    .query(({ input }) => getWeatherData(input.district_id, input.start_date, input.end_date)),

  // Historical disaster management
  createHistoricalDisaster: publicProcedure
    .input(createHistoricalDisasterInputSchema)
    .mutation(({ input }) => createHistoricalDisaster(input)),
  
  getHistoricalDisasters: publicProcedure
    .input(getRiskPredictionsInputSchema.pick({ district_id: true, disaster_type: true }))
    .query(({ input }) => getHistoricalDisasters(input.district_id, input.disaster_type)),

  // Risk prediction and reporting
  generateRiskPredictions: publicProcedure
    .input(generateRiskPredictionInputSchema)
    .mutation(({ input }) => generateRiskPredictions(input)),
  
  getRiskPredictions: publicProcedure
    .input(getRiskPredictionsInputSchema)
    .query(({ input }) => getRiskPredictions(input)),

  generateRiskReport: publicProcedure
    .input(getRiskPredictionsInputSchema)
    .query(({ input }) => generateRiskReport(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();