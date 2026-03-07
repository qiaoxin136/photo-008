export interface WaterFeatureProperties {
  id: string;
  survey_date: string;
  time: string;
  description: string;
  track: string;
  type: string;
  diameter: number;
  length: number;
}

export interface WaterFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number, number];
  };
  properties: WaterFeatureProperties;
}

export interface WaterGeoJSON {
  type: 'FeatureCollection';
  features: WaterFeature[];
}
