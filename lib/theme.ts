import { useColorScheme } from 'react-native';

export const lightColors = {
  cream: '#F7F3EA',
  white: '#FFFFFF',
  ink: '#29262B',
  muted: '#8B858C',
  plum: '#4C2B52',
  plumLight: '#8A648F',
  olive: '#697548',
  oliveLight: '#C0C98C',
  orange: '#CE704F',
  orangeWash: '#FBE5DB',
  oliveWash: '#E9EBD9',
  plumWash: '#EDE4EF',
};

export const darkColors = {
  cream: '#1B181D',
  white: '#252029',
  ink: '#F1ECE7',
  muted: '#9E96A0',
  plum: '#C79ECF',
  plumLight: '#8A648F',
  olive: '#AEBB7E',
  oliveLight: '#C0C98C',
  orange: '#E28963',
  orangeWash: '#3D2A20',
  oliveWash: '#2C3020',
  plumWash: '#332638',
};

export type ThemeColors = typeof lightColors;

/**
 * Segue o tema do sistema operacional (claro/escuro) automaticamente —
 * sem interruptor manual no app, por decisão explícita: o padrão que a
 * maioria dos apps segue, e menos código pra manter.
 */
export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}
