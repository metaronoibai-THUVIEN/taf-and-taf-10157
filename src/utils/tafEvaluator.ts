import {
  WindState,
  CloudLayer,
  WeatherCondition,
  ChangeGroup,
  TafReport,
  TafEvaluationResult,
  HourEvaluation,
  ElementEvaluation
} from '../types';

// Helper to calculate angular difference between two wind directions
export function getWindDirDiff(dir1: string, dir2: string): number {
  if (dir1 === 'VRB' || dir2 === 'VRB') return 0;
  const d1 = parseInt(dir1, 10);
  const d2 = parseInt(dir2, 10);
  if (isNaN(d1) || isNaN(d2)) return 0;
  let diff = Math.abs(d1 - d2);
  if (diff > 180) {
    diff = 360 - diff;
  }
  return diff;
}

// Helper to normalize weather descriptors (light/heavy rain, shower etc. are both rain)
export function isRainWeather(w: string): boolean {
  const norm = w.toUpperCase();
  return norm.includes('RA') || norm.includes('SHRA') || norm.includes('TSRA') || norm.includes('DZ');
}

export function isThunderstorm(w: string): boolean {
  const norm = w.toUpperCase();
  return norm.includes('TS') || norm.includes('VCTS') || norm.includes('CB');
}

export function isFogOrMist(w: string): boolean {
  const norm = w.toUpperCase();
  return norm.includes('BR') || norm.includes('FG');
}

// Parse wind component
export function parseWind(part: string): WindState | null {
  const windRegex = /(\d{3}|VRB)(\d{2})(?:G(\d{2}))?KT/;
  const match = part.match(windRegex);
  if (match) {
    return {
      direction: match[1],
      speed: parseInt(match[2], 10),
      gust: match[3] ? parseInt(match[3], 10) : undefined
    };
  }
  return null;
}

// Parse cloud layer
export function parseCloud(part: string): CloudLayer | null {
  if (part === 'NSC') {
    return { amount: 'NSC', height: null };
  }
  if (part === 'CAVOK') {
    return { amount: 'NSC', height: null };
  }
  const cloudRegex = /(FEW|SCT|BKN|OVC|NSC|VV)(\d{3}|\/\/\/)/;
  const match = part.match(cloudRegex);
  if (match) {
    return {
      amount: match[1] as any,
      height: match[2] === '///' ? null : parseInt(match[2], 10) * 100
    };
  }
  return null;
}

// Clean and tokenize reports
export function tokenizeReport(report: string): string[] {
  return report
    .replace(/=/g, '')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

// Parse METAR or SPECI
export function parseMetarOrSpeci(raw: string): WeatherCondition | null {
  const tokens = tokenizeReport(raw);
  if (tokens.length < 3) return null;

  let type: 'METAR' | 'SPECI' = 'METAR';
  let stationIndex = 1;
  let timeIndex = 2;

  if (tokens[0] === 'METAR' || tokens[0] === 'SPECI') {
    type = tokens[0] as any;
    // Check COR / AMD / COR COR
    let offset = 1;
    if (tokens[offset] === 'COR' || tokens[offset] === 'AMD') {
      offset++;
    }
    stationIndex = offset;
    timeIndex = offset + 1;
  } else {
    // If prefix is omitted, detect by station pattern (4 letters) and time group (6 digits + Z)
    if (tokens[0].length === 4 && /^\d{6}Z$/.test(tokens[1])) {
      type = 'METAR';
      stationIndex = 0;
      timeIndex = 1;
    } else {
      return null;
    }
  }

  const station = tokens[stationIndex];
  const timeStr = tokens[timeIndex];
  if (!timeStr || !/^\d{6}Z$/.test(timeStr)) return null;

  const day = parseInt(timeStr.slice(0, 2), 10);
  const hour = parseInt(timeStr.slice(2, 4), 10);
  const minute = parseInt(timeStr.slice(4, 6), 10);

  // Default values
  let wind: WindState = { direction: '000', speed: 0 };
  let visibility = 9999;
  let isCavok = false;
  let isNsc = false;
  let weather = 'NIL';
  const clouds: CloudLayer[] = [];

  // Parse remaining tokens
  for (let i = timeIndex + 1; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === 'CAVOK') {
      isCavok = true;
      visibility = 9999;
      isNsc = true;
      continue;
    }

    if (token === 'NSC') {
      isNsc = true;
      continue;
    }

    // Wind
    const windParsed = parseWind(token);
    if (windParsed) {
      wind = windParsed;
      continue;
    }

    // Visibility (4 digits like 9999 or 3500)
    if (/^\d{4}$/.test(token)) {
      visibility = parseInt(token, 10);
      continue;
    }

    // Clouds
    const cloudParsed = parseCloud(token);
    if (cloudParsed) {
      clouds.push(cloudParsed);
      continue;
    }

    // Weather phenomena (e.g. -RA, +SHRA, TSRA, BR, FG)
    const weatherRegex = /^[+-]?(RA|DZ|SH|TS|BR|FG|HZ|DZ|VA|DU|SA|PO|SQ|FC|SS|DS|RA|GR|GS|PL)+$/;
    if (weatherRegex.test(token)) {
      weather = token;
      continue;
    }
  }

  return {
    raw,
    type,
    station,
    timeStr,
    day,
    hour,
    minute,
    wind,
    visibility,
    isCavok,
    isNsc: isNsc || isCavok || clouds.length === 0,
    weather,
    clouds: clouds.length > 0 ? clouds : (isCavok || isNsc ? [{ amount: 'NSC', height: null }] : [])
  };
}

// Parse TAF
export function parseTaf(raw: string): TafReport | null {
  const cleanRaw = raw.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = cleanRaw.replace(/=/g, '').split(' ');
  if (tokens.length < 4) return null;

  let tafIndex = tokens.indexOf('TAF');
  if (tafIndex === -1) {
    // If "TAF" is omitted, assume starts with station or "AMD"
    if (tokens[0] === 'AMD') {
      tafIndex = 0;
    } else {
      tafIndex = 0;
    }
  }

  let offset = tafIndex;
  if (tokens[offset] === 'TAF') offset++;
  if (tokens[offset] === 'AMD') offset++;

  const station = tokens[offset];
  const issueTimeStr = tokens[offset + 1];
  const validityStr = tokens[offset + 2];

  if (!station || !issueTimeStr || !validityStr || !/^\d{6}Z$/.test(issueTimeStr) || !/^\d{4}\/\d{4}$/.test(validityStr)) {
    return null;
  }

  const validStartDay = parseInt(validityStr.slice(0, 2), 10);
  const validStartHour = parseInt(validityStr.slice(2, 4), 10);
  const validEndDay = parseInt(validityStr.slice(5, 7), 10);
  const validEndHour = parseInt(validityStr.slice(7, 9), 10);

  // Divide the TAF into Base block and Change Groups (BECMG, TEMPO, FM, PROB)
  // Let's scan tokens from offset+3 to find change group triggers
  const baseTokens: string[] = [];
  const changeGroupBlocks: { type: 'BECMG' | 'TEMPO' | 'FM'; validStr: string; tokens: string[] }[] = [];

  let currentBlock: { type: 'BECMG' | 'TEMPO' | 'FM'; validStr: string; tokens: string[] } | null = null;

  for (let i = offset + 3; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === 'BECMG' || token === 'TEMPO' || token.startsWith('FM') || token.startsWith('PROB')) {
      if (token === 'BECMG' || token === 'TEMPO') {
        const validStr = tokens[i + 1] || '';
        currentBlock = { type: token as any, validStr, tokens: [] };
        changeGroupBlocks.push(currentBlock);
        i++; // skip validity token
      } else if (token.startsWith('PROB')) {
        // PROB30 TEMPO 0908/0911
        const nextToken = tokens[i + 1];
        if (nextToken === 'TEMPO' || nextToken === 'BECMG') {
          const validStr = tokens[i + 2] || '';
          currentBlock = { type: nextToken as any, validStr, tokens: [] };
          changeGroupBlocks.push(currentBlock);
          i += 2; // skip TEMPO/BECMG and validity
        } else {
          // Just PROB
          if (currentBlock) currentBlock.tokens.push(token);
          else baseTokens.push(token);
        }
      } else if (token.startsWith('FM')) {
        // FM091500
        currentBlock = { type: 'FM', validStr: token.slice(2), tokens: [] };
        changeGroupBlocks.push(currentBlock);
      }
    } else {
      if (currentBlock) {
        currentBlock.tokens.push(token);
      } else {
        baseTokens.push(token);
      }
    }
  }

  // Parse Base condition
  const baseCondition = parseBaseCondition(station, issueTimeStr, baseTokens);

  // Parse Change Groups
  const changeGroups: ChangeGroup[] = changeGroupBlocks.map(block => {
    let startDay = validStartDay;
    let startHour = validStartHour;
    let endDay = validEndDay;
    let endHour = validEndHour;

    if (block.type === 'FM') {
      // FM091500 -> day 09, hour 15, minute 00
      startDay = parseInt(block.validStr.slice(0, 2), 10);
      startHour = parseInt(block.validStr.slice(2, 4), 10);
      endDay = validEndDay;
      endHour = validEndHour;
    } else if (/^\d{4}\/\d{4}$/.test(block.validStr)) {
      startDay = parseInt(block.validStr.slice(0, 2), 10);
      startHour = parseInt(block.validStr.slice(2, 4), 10);
      endDay = parseInt(block.validStr.slice(5, 7), 10);
      endHour = parseInt(block.validStr.slice(7, 9), 10);
    }

    // Partial parse condition within block
    const conditions = parsePartialCondition(block.tokens);

    return {
      type: block.type,
      startDay,
      startHour,
      endDay,
      endHour,
      conditions
    };
  });

  return {
    raw,
    station,
    issueTimeStr,
    validStartDay,
    validStartHour,
    validEndDay,
    validEndHour,
    base: baseCondition,
    changeGroups
  };
}

function parseBaseCondition(station: string, issueTimeStr: string, tokens: string[]): WeatherCondition {
  const day = parseInt(issueTimeStr.slice(0, 2), 10);
  const hour = parseInt(issueTimeStr.slice(2, 4), 10);
  const minute = parseInt(issueTimeStr.slice(4, 6), 10);

  let wind: WindState = { direction: '000', speed: 0 };
  let visibility = 9999;
  let isCavok = false;
  let isNsc = false;
  let weather = 'NIL';
  const clouds: CloudLayer[] = [];

  for (const token of tokens) {
    if (token === 'CAVOK') {
      isCavok = true;
      visibility = 9999;
      isNsc = true;
      continue;
    }
    if (token === 'NSC') {
      isNsc = true;
      continue;
    }
    const windParsed = parseWind(token);
    if (windParsed) {
      wind = windParsed;
      continue;
    }
    if (/^\d{4}$/.test(token)) {
      visibility = parseInt(token, 10);
      continue;
    }
    const cloudParsed = parseCloud(token);
    if (cloudParsed) {
      clouds.push(cloudParsed);
      continue;
    }
    const weatherRegex = /^[+-]?(RA|DZ|SH|TS|BR|FG|HZ|DZ|VA|DU|SA|PO|SQ|FC|SS|DS|RA|GR|GS|PL)+$/;
    if (weatherRegex.test(token)) {
      weather = token;
      continue;
    }
  }

  return {
    raw: tokens.join(' '),
    type: 'TAF_BASE',
    station,
    timeStr: issueTimeStr,
    day,
    hour,
    minute,
    wind,
    visibility,
    isCavok,
    isNsc: isNsc || isCavok || clouds.length === 0,
    weather,
    clouds: clouds.length > 0 ? clouds : (isCavok || isNsc ? [{ amount: 'NSC', height: null }] : [])
  };
}

function parsePartialCondition(tokens: string[]): Partial<WeatherCondition> {
  const cond: Partial<WeatherCondition> = {};
  const clouds: CloudLayer[] = [];

  for (const token of tokens) {
    if (token === 'CAVOK') {
      cond.isCavok = true;
      cond.visibility = 9999;
      cond.isNsc = true;
      continue;
    }
    if (token === 'NSC') {
      cond.isNsc = true;
      continue;
    }
    const windParsed = parseWind(token);
    if (windParsed) {
      cond.wind = windParsed;
      continue;
    }
    if (/^\d{4}$/.test(token)) {
      cond.visibility = parseInt(token, 10);
      continue;
    }
    const cloudParsed = parseCloud(token);
    if (cloudParsed) {
      clouds.push(cloudParsed);
      continue;
    }
    const weatherRegex = /^[+-]?(RA|DZ|SH|TS|BR|FG|HZ|DZ|VA|DU|SA|PO|SQ|FC|SS|DS|RA|GR|GS|PL)+$/;
    if (weatherRegex.test(token)) {
      cond.weather = token;
      continue;
    }
  }

  if (clouds.length > 0) {
    cond.clouds = clouds;
  }
  return cond;
}

// Convert day/hour/minute to numeric absolute hour for comparing
function getAbsTime(day: number, hour: number, minute: number = 0): number {
  return day * 24 + hour + minute / 60;
}

// Resolve TAF conditions at a specific observation time `T` (day, hour, minute)
export function resolveTafStateAt(
  taf: TafReport,
  obsDay: number,
  obsHour: number,
  obsMin: number,
  allObsList: WeatherCondition[] = []
): { primary: WeatherCondition; alternative?: WeatherCondition } {
  const tObs = getAbsTime(obsDay, obsHour, obsMin);

  // Start with base conditions
  let state = { ...taf.base };

  // Apply sequential FM, BECMG changes that have fully resolved before or at tObs
  // Sort change groups by start time
  const sortedGroups = [...taf.changeGroups].sort((a, b) => {
    return getAbsTime(a.startDay, a.startHour) - getAbsTime(b.startDay, b.startHour);
  });

  // Track if we are in an active transition period of BECMG
  let activeTransitionBECMG: ChangeGroup | null = null;

  for (const group of sortedGroups) {
    const tStart = getAbsTime(group.startDay, group.startHour);
    const tEnd = getAbsTime(group.endDay, group.endHour);

    if (group.type === 'FM') {
      if (tObs >= tStart) {
        state = { ...state, ...group.conditions } as WeatherCondition;
      }
    } else if (group.type === 'BECMG') {
      if (tObs >= tEnd) {
        state = { ...state, ...group.conditions } as WeatherCondition;
      } else if (tObs >= tStart && tObs < tEnd) {
        activeTransitionBECMG = group;
      }
    }
  }

  const primaryState = { ...state };

  // If we are currently in a BECMG transition, we can compare against pre-BECMG and post-BECMG states.
  if (activeTransitionBECMG) {
    const alternativeState = { ...state, ...activeTransitionBECMG.conditions } as WeatherCondition;
    return { primary: primaryState, alternative: alternativeState };
  }

  // Check if any TEMPO group covers this observation time
  const activeTEMPO = sortedGroups.find(group => {
    if (group.type !== 'TEMPO') return false;
    const tStart = getAbsTime(group.startDay, group.startHour);
    const tEnd = getAbsTime(group.endDay, group.endHour);
    return tObs >= tStart && tObs <= tEnd;
  });

  if (activeTEMPO) {
    // Check if the TEMPO predicted conditions actually occurred anywhere during the TEMPO window.
    // "Điều kiện trong TEMPO được đánh giá là ĐÚNG nếu xuất hiện ít nhất 1 lần trong khoảng thời gian dự báo. Nếu không xuất hiện lần nào -> 🔴"
    // Let's look at all observations within [tStart, tEnd]
    const tStartVal = getAbsTime(activeTEMPO.startDay, activeTEMPO.startHour);
    const tEndVal = getAbsTime(activeTEMPO.endDay, activeTEMPO.endHour);

    const obsInTempoWindow = allObsList.filter(obs => {
      const tob = getAbsTime(obs.day, obs.hour, obs.minute);
      return tob >= tStartVal && tob <= tEndVal;
    });

    // Did the TEMPO condition occur?
    let occurred = false;
    if (obsInTempoWindow.length > 0) {
      occurred = obsInTempoWindow.some(obs => {
        // Check wind speed
        if (activeTEMPO.conditions.wind && Math.abs(obs.wind.speed - activeTEMPO.conditions.wind.speed) <= 5) {
          return true;
        }
        // Check weather
        if (activeTEMPO.conditions.weather && obs.weather !== 'NIL' && isRainWeather(obs.weather) === isRainWeather(activeTEMPO.conditions.weather)) {
          return true;
        }
        // Check visibility
        if (activeTEMPO.conditions.visibility !== undefined && Math.abs(obs.visibility - activeTEMPO.conditions.visibility) <= 500) {
          return true;
        }
        // Check cloud
        if (activeTEMPO.conditions.clouds && activeTEMPO.conditions.clouds.length > 0) {
          const mainObsCloud = obs.clouds[0];
          const mainTempoCloud = activeTEMPO.conditions.clouds[0];
          if (mainObsCloud && mainTempoCloud && mainObsCloud.amount === mainTempoCloud.amount) {
            return true;
          }
        }
        return false;
      });
    }

    if (occurred) {
      // If it occurred, then TEMPO is "alternative" forecast state that the observer can match
      const alternativeState = { ...state, ...activeTEMPO.conditions } as WeatherCondition;
      return { primary: primaryState, alternative: alternativeState };
    } else {
      // If TEMPO was forecast but never occurred, then TEMPO forecast failed. We can flag this or force the alternative
      // to evaluate to 🔴. Let's make the alternative available as failed (or we don't return it so we evaluate against base).
    }
  }

  return { primary: primaryState };
}

// Evaluate a single meteorological element
export function evaluateElement(
  element: 'DD' | 'FF' | 'VV' | 'WW' | 'CC' | 'HH',
  tafState: WeatherCondition,
  metarState: WeatherCondition
): ElementEvaluation {
  let score = 1.0;
  let tafVal = '';
  let metarVal = '';

  switch (element) {
    case 'DD': {
      tafVal = tafState.wind.direction;
      metarVal = metarState.wind.direction;

      const tafSpeed = tafState.wind.speed;
      const metarSpeed = metarState.wind.speed;

      // Special rule: if both speeds <= 7 kt, automatic Green
      if (tafSpeed <= 7 && metarSpeed <= 7) {
        score = 1.0;
      } else if (tafVal === 'VRB' && tafSpeed <= 6) {
        score = 1.0;
      } else {
        const diff = getWindDirDiff(tafVal, metarVal);
        if (diff <= 20) {
          score = 1.0;
        } else if (diff >= 60) {
          if (tafSpeed >= 10 || metarSpeed >= 10) {
            score = 0.0;
          } else {
            score = 0.5;
          }
        } else {
          score = 0.5;
        }
      }
      break;
    }

    case 'FF': {
      tafVal = String(tafState.wind.speed).padStart(2, '0');
      metarVal = String(metarState.wind.speed).padStart(2, '0');

      const tafSpeed = tafState.wind.speed;
      const metarSpeed = metarState.wind.speed;
      const maxSpeed = Math.max(tafSpeed, metarSpeed);
      const diff = Math.abs(tafSpeed - metarSpeed);

      if (maxSpeed <= 25) {
        if (diff <= 5) {
          score = 1.0;
        } else if (diff <= 9) {
          score = 0.5;
        } else {
          score = 0.0;
        }
      } else {
        // For > 25 kt, limit is ±20%
        const limit = 0.20 * maxSpeed;
        if (diff <= limit) {
          score = 1.0;
        } else if (diff <= 0.35 * maxSpeed) {
          score = 0.5;
        } else {
          score = 0.0;
        }
      }
      break;
    }

    case 'VV': {
      tafVal = tafState.isCavok ? 'CAVOK' : String(tafState.visibility);
      metarVal = metarState.isCavok ? 'CAVOK' : String(metarState.visibility);

      const tafVis = tafState.visibility;
      const metarVis = metarState.visibility;

      // Milestones: 150, 350, 600, 800, 1500, 3000, 5000, 10000 (CAVOK matches 10000)
      const milestones = [150, 350, 600, 800, 1500, 3000, 5000, 10000];
      const crossedMilestones = milestones.filter(M => {
        return (tafVis < M && metarVis >= M) || (tafVis >= M && metarVis < M);
      });

      if (crossedMilestones.length >= 1) {
        score = 0.0;
      } else {
        const diff = Math.abs(tafVis - metarVis);
        if (tafVis <= 800 && metarVis <= 800) {
          if (diff <= 200) {
            score = 1.0;
          } else {
            score = 0.5;
          }
        } else {
          const maxVis = Math.max(tafVis, metarVis);
          if (diff / maxVis <= 0.30) {
            score = 1.0;
          } else {
            score = 0.5;
          }
        }
      }
      break;
    }

    case 'WW': {
      tafVal = tafState.isCavok ? 'NIL' : (tafState.weather === 'NIL' ? 'NIL' : tafState.weather);
      metarVal = metarState.isCavok ? 'NIL' : (metarState.weather === 'NIL' ? 'NIL' : metarState.weather);

      const isTafRain = isRainWeather(tafVal);
      const isMetarRain = isRainWeather(metarVal);
      const isTafTs = isThunderstorm(tafVal);
      const isMetarTs = isThunderstorm(metarVal);
      const isTafFog = isFogOrMist(tafVal);
      const isMetarFog = isFogOrMist(metarVal);

      // Check match
      if (tafVal === metarVal) {
        score = 1.0;
      } else if (isTafRain === isMetarRain && isTafTs === isMetarTs && isTafFog === isMetarFog) {
        // If categories match (e.g., both rain or both fog, ignoring intensity)
        score = 1.0;
      } else {
        // Discrepancy
        score = 0.0;
      }
      break;
    }

    case 'CC': {
      // Primary cloud layer amount
      const tafCloud = tafState.clouds[0] || { amount: 'NSC', height: null };
      const metarCloud = metarState.clouds[0] || { amount: 'NSC', height: null };

      // Normalise amounts
      let tAmt = tafState.isCavok ? 'NSC' : tafCloud.amount;
      let mAmt = metarState.isCavok ? 'NSC' : metarCloud.amount;

      tafVal = tAmt;
      metarVal = mAmt;

      // Grouping
      const getGroup = (amt: string) => {
        if (amt === 'BKN' || amt === 'OVC') return 'thick';
        return 'thin'; // FEW, SCT, NSC, NIL, CAVOK
      };

      if (tAmt === mAmt) {
        score = 1.0;
      } else if (tAmt === 'NSC' && mAmt === 'FEW') {
        // NSC is treated equivalent to FEW
        score = 1.0;
      } else if (tAmt === 'FEW' && mAmt === 'NSC') {
        score = 1.0;
      } else if (getGroup(tAmt) === getGroup(mAmt)) {
        score = 0.5; // FEW <-> SCT is 0.5
      } else {
        score = 0.0; // FEW/SCT <-> BKN/OVC is 0.0
      }
      break;
    }

    case 'HH': {
      const tafCloud = tafState.clouds[0] || { amount: 'NSC', height: null };
      const metarCloud = metarState.clouds[0] || { amount: 'NSC', height: null };

      const tafH = tafCloud.height;
      const metarH = metarCloud.height;

      const tAmt = tafState.isCavok ? 'NSC' : tafCloud.amount;
      const mAmt = metarState.isCavok ? 'NSC' : metarCloud.amount;

      tafVal = tafH !== null ? String(tafH / 100).padStart(3, '0') : '///';
      metarVal = metarH !== null ? String(metarH / 100).padStart(3, '0') : '///';

      // Exceptions:
      // "METAR ghi /// cho độ cao mây → coi như đạt HH"
      if (metarState.clouds.some(c => c.amount === '///' || c.height === null)) {
        score = 1.0;
        metarVal = '///';
      } else if (mAmt === 'NSC') {
        // If actually no clouds, and TAF predicted no clouds, score is 1.0
        if (tAmt === 'NSC') {
          score = 1.0;
          tafVal = '///';
          metarVal = '///';
        } else {
          // TAF predicted clouds but actually none (NSC/CAVOK) -> Mismatch
          score = 0.0;
          metarVal = '///';
        }
      } else if (tAmt === 'NSC') {
        // TAF predicted no clouds, but metar has clouds -> Mismatch
        score = 0.0;
        tafVal = '///';
      } else if (tafH !== null && metarH !== null) {
        // Both have cloud heights
        const milestones = [100, 200, 500, 1000, 1500];
        const crossedMilestones = milestones.filter(M => {
          return (tafH < M && metarH >= M) || (tafH >= M && metarH < M);
        });

        if (crossedMilestones.length >= 1) {
          score = 0.0;
        } else {
          const diff = Math.abs(tafH - metarH);
          if (tafH <= 1000 && metarH <= 1000) {
            if (diff <= 100) {
              score = 1.0;
            } else {
              score = 0.5;
            }
          } else {
            const maxH = Math.max(tafH, metarH);
            if (diff / maxH <= 0.30) {
              score = 1.0;
            } else {
              score = 0.5;
            }
          }
        }
      } else {
        score = 1.0; // Fallback
      }
      break;
    }
  }

  const rating = score === 1.0 ? '🟢' : (score === 0.5 ? '🟡' : '🔴');

  return {
    element,
    score,
    rating,
    tafVal,
    metarVal
  };
}

// Evaluate a TAF report against a list of METARs and SPECIs
export function evaluateTaf(taf: TafReport, observations: WeatherCondition[]): TafEvaluationResult {
  // We need 12 observation times spaced by 30 minutes starting from the start of the TAF validity
  // Validity start is day validityStr (e.g., 09) and hour validStartHour (e.g., 06)
  const evalHours: HourEvaluation[] = [];

  const startDay = taf.validStartDay;
  const startHour = taf.validStartHour;

  for (let step = 0; step < 12; step++) {
    // Each step is 30 minutes. Calculate the target day, hour, minute
    let totalMinutes = startHour * 60 + step * 30;
    let obsDay = startDay;
    let obsHour = Math.floor(totalMinutes / 60);
    let obsMin = totalMinutes % 60;

    if (obsHour >= 24) {
      obsDay += Math.floor(obsHour / 24);
      obsHour = obsHour % 24;
    }

    const timeStrStr = `${String(obsHour).padStart(2, '0')}${String(obsMin).padStart(2, '0')}`;

    // Find the closest METAR or SPECI at this time (allow ± 15 mins matching)
    const targetAbsTime = getAbsTime(obsDay, obsHour, obsMin);
    let matchedObs = observations.find(obs => {
      const obsAbsTime = getAbsTime(obs.day, obs.hour, obs.minute);
      return Math.abs(obsAbsTime - targetAbsTime) <= 0.25; // within 15 mins
    });

    // If no perfect match, find the closest one within 30 mins
    if (!matchedObs) {
      matchedObs = observations.filter(obs => {
        const obsAbsTime = getAbsTime(obs.day, obs.hour, obs.minute);
        return Math.abs(obsAbsTime - targetAbsTime) <= 0.55;
      }).sort((a, b) => {
        const diffA = Math.abs(getAbsTime(a.day, a.hour, a.minute) - targetAbsTime);
        const diffB = Math.abs(getAbsTime(b.day, b.hour, b.minute) - targetAbsTime);
        return diffA - diffB;
      })[0];
    }

    // Default empty METAR if not found
    const defaultMetar: WeatherCondition = matchedObs || {
      raw: '',
      type: 'METAR',
      station: taf.station,
      timeStr: `${String(obsDay).padStart(2, '0')}${timeStrStr}Z`,
      day: obsDay,
      hour: obsHour,
      minute: obsMin,
      wind: { direction: '///', speed: 0 },
      visibility: 9999,
      isCavok: false,
      isNsc: true,
      weather: 'NIL',
      clouds: [{ amount: 'NSC', height: null }]
    };

    // Resolve TAF state at this observation hour
    const { primary, alternative } = resolveTafStateAt(taf, obsDay, obsHour, obsMin, observations);

    // Evaluate both primary and alternative, pick the best one
    const evalElements = (tState: WeatherCondition, mState: WeatherCondition) => {
      return {
        DD: evaluateElement('DD', tState, mState),
        FF: evaluateElement('FF', tState, mState),
        VV: evaluateElement('VV', tState, mState),
        WW: evaluateElement('WW', tState, mState),
        CC: evaluateElement('CC', tState, mState),
        HH: evaluateElement('HH', tState, mState)
      };
    };

    const primaryEval = evalElements(primary, defaultMetar);
    const primaryScore = Object.values(primaryEval).reduce((sum, e) => sum + e.score, 0) / 6;

    let finalEval = primaryEval;
    let finalScore = primaryScore;

    if (alternative) {
      const altEval = evalElements(alternative, defaultMetar);
      const altScore = Object.values(altEval).reduce((sum, e) => sum + e.score, 0) / 6;
      if (altScore > primaryScore) {
        finalEval = altEval;
        finalScore = altScore;
      }
    }

    evalHours.push({
      timeStr: timeStrStr,
      score: finalScore,
      elements: finalEval
    });
  }

  // Calculate Element Accuracy
  const calcElementPct = (element: 'DD' | 'FF' | 'VV' | 'WW' | 'CC' | 'HH') => {
    const hits = evalHours.filter(h => h.elements[element].score >= 0.5).length;
    return Math.round((hits / 12) * 100);
  };

  const elementAccuracy = {
    DD: calcElementPct('DD'),
    FF: calcElementPct('FF'),
    VV: calcElementPct('VV'),
    WW: calcElementPct('WW'),
    CC: calcElementPct('CC'),
    HH: calcElementPct('HH')
  };

  const overallAccuracy = Math.round(
    Object.values(elementAccuracy).reduce((sum, v) => sum + v, 0) / 6
  );

  // Checks if there are any RED elements in the entire 12 hours
  const hasRed = evalHours.some(h => {
    return Object.values(h.elements).some(e => e.score === 0.0);
  });

  return {
    taf,
    evaluations: evalHours,
    overallAccuracy,
    elementAccuracy,
    passed: !hasRed
  };
}
