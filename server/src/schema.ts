import { z } from 'zod';

// Risk level enum
export const riskLevelSchema = z.enum(['rendah', 'sedang', 'tinggi']);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

// Disaster type enum
export const disasterTypeSchema = z.enum(['banjir', 'longsor']);
export type DisasterType = z.infer<typeof disasterTypeSchema>;

// Weather data schema
export const weatherDataSchema = z.object({
  id: z.number(),
  district_id: z.number(),
  date: z.coerce.date(),
  rainfall: z.number(), // mm per day
  humidity: z.number(), // percentage
  temperature: z.number(), // celsius
  wind_speed: z.number(), // km/h
  created_at: z.coerce.date()
});
export type WeatherData = z.infer<typeof weatherDataSchema>;

// District schema
export const districtSchema = z.object({
  id: z.number(),
  name: z.string(),
  province: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number(), // meters above sea level
  slope_angle: z.number(), // degrees
  soil_type: z.string(),
  created_at: z.coerce.date()
});
export type District = z.infer<typeof districtSchema>;

// Historical disaster schema
export const historicalDisasterSchema = z.object({
  id: z.number(),
  district_id: z.number(),
  disaster_type: disasterTypeSchema,
  date: z.coerce.date(),
  severity_score: z.number().min(1).max(10), // 1-10 scale
  casualties: z.number().int().nonnegative(),
  economic_loss: z.number().nonnegative(), // in rupiah
  description: z.string().nullable(),
  created_at: z.coerce.date()
});
export type HistoricalDisaster = z.infer<typeof historicalDisasterSchema>;

// Risk prediction schema
export const riskPredictionSchema = z.object({
  id: z.number(),
  district_id: z.number(),
  disaster_type: disasterTypeSchema,
  prediction_date: z.coerce.date(),
  target_date: z.coerce.date(), // date being predicted for
  risk_level: riskLevelSchema,
  hazard_score: z.number().min(0).max(100), // 0-100 scale
  main_factors: z.array(z.string()), // JSON array of main contributing factors
  public_recommendation: z.string(),
  government_recommendation: z.string(),
  data_completeness: z.number().min(0).max(100), // percentage of data availability
  assumptions: z.string().nullable(), // assumptions made due to incomplete data
  created_at: z.coerce.date()
});
export type RiskPrediction = z.infer<typeof riskPredictionSchema>;

// Input schema for creating weather data
export const createWeatherDataInputSchema = z.object({
  district_id: z.number().int().positive(),
  date: z.coerce.date(),
  rainfall: z.number().nonnegative(),
  humidity: z.number().min(0).max(100),
  temperature: z.number().min(-50).max(60), // reasonable temperature range
  wind_speed: z.number().nonnegative()
});
export type CreateWeatherDataInput = z.infer<typeof createWeatherDataInputSchema>;

// Input schema for creating districts
export const createDistrictInputSchema = z.object({
  name: z.string().min(1),
  province: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  elevation: z.number(),
  slope_angle: z.number().min(0).max(90),
  soil_type: z.string().min(1)
});
export type CreateDistrictInput = z.infer<typeof createDistrictInputSchema>;

// Input schema for creating historical disasters
export const createHistoricalDisasterInputSchema = z.object({
  district_id: z.number().int().positive(),
  disaster_type: disasterTypeSchema,
  date: z.coerce.date(),
  severity_score: z.number().min(1).max(10),
  casualties: z.number().int().nonnegative(),
  economic_loss: z.number().nonnegative(),
  description: z.string().nullable()
});
export type CreateHistoricalDisasterInput = z.infer<typeof createHistoricalDisasterInputSchema>;

// Input schema for generating risk predictions
export const generateRiskPredictionInputSchema = z.object({
  district_id: z.number().int().positive().optional(), // if not provided, generate for all districts
  disaster_type: disasterTypeSchema.optional(), // if not provided, generate for all types
  days_ahead: z.number().int().min(1).max(7).default(7) // number of days to predict
});
export type GenerateRiskPredictionInput = z.infer<typeof generateRiskPredictionInputSchema>;

// Query schema for getting risk predictions
export const getRiskPredictionsInputSchema = z.object({
  district_id: z.number().int().positive().optional(),
  disaster_type: disasterTypeSchema.optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  risk_level: riskLevelSchema.optional()
});
export type GetRiskPredictionsInput = z.infer<typeof getRiskPredictionsInputSchema>;

// Response schema for risk prediction report
export const riskPredictionReportSchema = z.object({
  generated_at: z.coerce.date(),
  report_period_start: z.coerce.date(),
  report_period_end: z.coerce.date(),
  predictions: z.array(riskPredictionSchema),
  summary: z.object({
    total_districts: z.number().int(),
    high_risk_count: z.number().int(),
    medium_risk_count: z.number().int(),
    low_risk_count: z.number().int(),
    average_data_completeness: z.number().min(0).max(100)
  }),
  markdown_report: z.string() // formatted markdown output
});
export type RiskPredictionReport = z.infer<typeof riskPredictionReportSchema>;