
export interface ModelAccuracyMetrics {
  forecastAccuracy: number;
  improvement: number;

  mae: number;
  maeTraditional: number;

  mape: number;
  mapeTraditional: number;

  aiAccuracy: number;
  traditionalAccuracy: number;
}

export interface ModelGraphPoint {
  day: string;
  actual: number;
  aiForecast: number;
  traditionalForecast: number;
}

export const modelAccuracyDummy: ModelAccuracyMetrics = {
  forecastAccuracy: 92.3,
  improvement: 17.6,

  mae: 8.4,
  maeTraditional: 15.7,

  mape: 6.2,
  mapeTraditional: 12.8,

  aiAccuracy: 92.3,
  traditionalAccuracy: 78.5,
};

export const modelGraphDummy: ModelGraphPoint[] = [
  { day: "Mon", actual: 420, aiForecast: 445, traditionalForecast: 470 },
  { day: "Tue", actual: 460, aiForecast: 480, traditionalForecast: 510 },
  { day: "Wed", actual: 430, aiForecast: 465, traditionalForecast: 495 },
  { day: "Thu", actual: 410, aiForecast: 455, traditionalForecast: 485 },
  { day: "Fri", actual: 440, aiForecast: 490, traditionalForecast: 525 },
];
