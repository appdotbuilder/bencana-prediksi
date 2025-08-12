import { serial, text, pgTable, timestamp, numeric, integer, pgEnum, real, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const riskLevelEnum = pgEnum('risk_level', ['rendah', 'sedang', 'tinggi']);
export const disasterTypeEnum = pgEnum('disaster_type', ['banjir', 'longsor']);

// Districts table
export const districtsTable = pgTable('districts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  province: text('province').notNull(),
  latitude: real('latitude').notNull(), // Use real for precise geographic coordinates
  longitude: real('longitude').notNull(),
  elevation: real('elevation').notNull(), // meters above sea level
  slope_angle: real('slope_angle').notNull(), // degrees
  soil_type: text('soil_type').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Weather data table
export const weatherDataTable = pgTable('weather_data', {
  id: serial('id').primaryKey(),
  district_id: integer('district_id').notNull().references(() => districtsTable.id),
  date: timestamp('date').notNull(),
  rainfall: real('rainfall').notNull(), // mm per day
  humidity: real('humidity').notNull(), // percentage
  temperature: real('temperature').notNull(), // celsius
  wind_speed: real('wind_speed').notNull(), // km/h
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Historical disasters table
export const historicalDisastersTable = pgTable('historical_disasters', {
  id: serial('id').primaryKey(),
  district_id: integer('district_id').notNull().references(() => districtsTable.id),
  disaster_type: disasterTypeEnum('disaster_type').notNull(),
  date: timestamp('date').notNull(),
  severity_score: integer('severity_score').notNull(), // 1-10 scale
  casualties: integer('casualties').notNull(),
  economic_loss: numeric('economic_loss', { precision: 15, scale: 2 }).notNull(), // in rupiah
  description: text('description'), // nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Risk predictions table
export const riskPredictionsTable = pgTable('risk_predictions', {
  id: serial('id').primaryKey(),
  district_id: integer('district_id').notNull().references(() => districtsTable.id),
  disaster_type: disasterTypeEnum('disaster_type').notNull(),
  prediction_date: timestamp('prediction_date').notNull(),
  target_date: timestamp('target_date').notNull(), // date being predicted for
  risk_level: riskLevelEnum('risk_level').notNull(),
  hazard_score: real('hazard_score').notNull(), // 0-100 scale
  main_factors: jsonb('main_factors').notNull(), // JSON array of main contributing factors
  public_recommendation: text('public_recommendation').notNull(),
  government_recommendation: text('government_recommendation').notNull(),
  data_completeness: real('data_completeness').notNull(), // percentage of data availability
  assumptions: text('assumptions'), // assumptions made due to incomplete data, nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const districtsRelations = relations(districtsTable, ({ many }) => ({
  weatherData: many(weatherDataTable),
  historicalDisasters: many(historicalDisastersTable),
  riskPredictions: many(riskPredictionsTable),
}));

export const weatherDataRelations = relations(weatherDataTable, ({ one }) => ({
  district: one(districtsTable, {
    fields: [weatherDataTable.district_id],
    references: [districtsTable.id],
  }),
}));

export const historicalDisastersRelations = relations(historicalDisastersTable, ({ one }) => ({
  district: one(districtsTable, {
    fields: [historicalDisastersTable.district_id],
    references: [districtsTable.id],
  }),
}));

export const riskPredictionsRelations = relations(riskPredictionsTable, ({ one }) => ({
  district: one(districtsTable, {
    fields: [riskPredictionsTable.district_id],
    references: [districtsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type District = typeof districtsTable.$inferSelect;
export type NewDistrict = typeof districtsTable.$inferInsert;

export type WeatherData = typeof weatherDataTable.$inferSelect;
export type NewWeatherData = typeof weatherDataTable.$inferInsert;

export type HistoricalDisaster = typeof historicalDisastersTable.$inferSelect;
export type NewHistoricalDisaster = typeof historicalDisastersTable.$inferInsert;

export type RiskPrediction = typeof riskPredictionsTable.$inferSelect;
export type NewRiskPrediction = typeof riskPredictionsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  districts: districtsTable,
  weatherData: weatherDataTable,
  historicalDisasters: historicalDisastersTable,
  riskPredictions: riskPredictionsTable
};