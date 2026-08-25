/**
 * Primitive color palette — raw values only.
 * 의미(semantic)는 theme 레이어에서 부여한다. 컴포넌트에서 이 값을 직접 쓰지 말 것.
 */
export const palette = {
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  gray: {
    25: '#fcfcfd',
    50: '#f9fafb',
    100: '#f2f4f7',
    200: '#e4e7ec',
    300: '#d0d5dd',
    400: '#98a2b3',
    500: '#667085',
    600: '#475467',
    700: '#344054',
    800: '#1d2939',
    900: '#101828',
    950: '#0c111d',
  },

  blue: {
    25: '#f5faff',
    50: '#eff8ff',
    100: '#d1e9ff',
    200: '#b2ddff',
    300: '#84caff',
    400: '#53b1fd',
    500: '#2e90fa',
    600: '#1570ef',
    700: '#175cd3',
    800: '#1849a9',
    900: '#194185',
  },

  green: {
    25: '#f6fef9',
    50: '#ecfdf3',
    100: '#d1fadf',
    200: '#a6f4c5',
    300: '#6ce9a6',
    400: '#32d583',
    500: '#12b76a',
    600: '#039855',
    700: '#027a48',
    800: '#05603a',
    900: '#054f31',
  },

  amber: {
    25: '#fffcf5',
    50: '#fffaeb',
    100: '#fef0c7',
    200: '#fedf89',
    300: '#fec84b',
    400: '#fdb022',
    500: '#f79009',
    600: '#dc6803',
    700: '#b54708',
    800: '#93370d',
    900: '#7a2e0e',
  },

  red: {
    25: '#fffbfa',
    50: '#fef3f2',
    100: '#fee4e2',
    200: '#fecdca',
    300: '#fda29b',
    400: '#f97066',
    500: '#f04438',
    600: '#d92d20',
    700: '#b42318',
    800: '#912018',
    900: '#7a271a',
  },

  violet: {
    25: '#fbfaff',
    50: '#f4f3ff',
    100: '#ebe9fe',
    200: '#d9d6fe',
    300: '#bdb4fe',
    400: '#9b8afb',
    500: '#7a5af8',
    600: '#6938ef',
    700: '#5925dc',
    800: '#4a1fb8',
    900: '#3e1c96',
  },
} as const

export type Palette = typeof palette
