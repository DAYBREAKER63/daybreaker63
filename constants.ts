
export const NIGHT_SCORING = {
  PHONE: {
    'Before 10:15': 15,
    '10:15-11': 5,
    '11-12': -10,
    'After 12': -20
  },
  SCREEN: {
    'None': 15,
    '<30 min': 5,
    '30-60 min': -5,
    '60+ min': -15
  },
  CONTENT: {
    'Clean': 0,
    'Reels': -15,
    'Sexual': -25,
    'Mixed': -10
  },
  SLEEP: {
    'Before 11': 10,
    '11-12': 0,
    'After 12': -20
  },
  RESISTED_URGE: 10,
};

export const BASE_SCORE = 50; // Starting point

export const getControlIndexStatus = (score: number): string => {
  if (score >= 85) return 'GROUNDED';
  if (score >= 70) return 'STABLE';
  if (score >= 50) return 'UNSTABLE';
  return 'CRITICAL';
};
