export interface WindState {
  direction: string; // e.g. "300", "VRB"
  speed: number;
  gust?: number;
}

export interface CloudLayer {
  amount: 'FEW' | 'SCT' | 'BKN' | 'OVC' | 'NSC' | 'NIL' | '///';
  height: number | null; // height in hundreds of feet (e.g., 20 is 2000ft)
}

export interface WeatherCondition {
  raw: string;
  type: 'METAR' | 'SPECI' | 'TAF_BASE' | 'BECMG' | 'TEMPO' | 'FM';
  station: string;
  timeStr: string; // e.g., "090600Z"
  day: number;
  hour: number;
  minute: number;
  wind: WindState;
  visibility: number; // in meters (e.g., 9999)
  isCavok: boolean;
  isNsc: boolean;
  weather: string; // e.g. "NIL", "-RA", "TSRA"
  clouds: CloudLayer[];
}

export interface ChangeGroup {
  type: 'BECMG' | 'TEMPO' | 'FM';
  startDay: number;
  startHour: number;
  endDay: number;
  endHour: number;
  conditions: Partial<WeatherCondition>;
}

export interface TafReport {
  raw: string;
  station: string;
  issueTimeStr: string; // e.g., "090500Z"
  validStartDay: number;
  validStartHour: number;
  validEndDay: number;
  validEndHour: number;
  base: WeatherCondition;
  changeGroups: ChangeGroup[];
}

export interface ElementEvaluation {
  element: 'DD' | 'FF' | 'VV' | 'WW' | 'CC' | 'HH';
  score: number; // 1.0 = Green, 0.5 = Yellow, 0.0 = Red
  rating: '🟢' | '🟡' | '🔴';
  tafVal: string;
  metarVal: string;
}

export interface HourEvaluation {
  timeStr: string; // e.g. "0600"
  score: number; // average of element scores
  elements: {
    DD: ElementEvaluation;
    FF: ElementEvaluation;
    VV: ElementEvaluation;
    WW: ElementEvaluation;
    CC: ElementEvaluation;
    HH: ElementEvaluation;
  };
}

export interface TafEvaluationResult {
  taf: TafReport;
  evaluations: HourEvaluation[]; // usually 12 hourly/half-hourly observations
  overallAccuracy: number; // e.g. 82%
  elementAccuracy: {
    DD: number;
    FF: number;
    VV: number;
    WW: number;
    CC: number;
    HH: number;
  };
  passed: boolean; // Based on rule: passed if no RED (or score > 84% at day level)
}

export interface EvaluationCriteria {
  windDirection: {
    green: string;
    yellow: string;
    red: string;
  };
  windSpeed: {
    green: string;
    yellow: string;
    red: string;
  };
  visibility: {
    green: string;
    yellow: string;
    red: string;
  };
  weather: {
    green: string;
    red: string;
  };
  cloudAmount: {
    green: string;
    yellow: string;
    red: string;
  };
  cloudHeight: {
    green: string;
    yellow: string;
    red: string;
  };
}
