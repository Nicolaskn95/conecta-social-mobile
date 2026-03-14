/**
 * Paleta alinhada ao conecta-social-web (src/core/color/colors.json).
 * Fonte única de cores para identidade visual e RNF-L03 (alto contraste).
 */
export const colors = {
  primary: '#387AA1',
  secondary: '#4AA1D3',
  tertiary: '#BCD4E1',
  text: '#090934',
  danger: '#A13838',
  danger_hover: '#E1BCBC',
  success: '#38A13C',
  success_light: '#BCE1C6',
  header_sidebar_color: '#D2E6EF',
  warning_light: '#E1D4BC',
  white: '#FFFFFF',
  border_input: '#E5E7EB',
  background: '#FFFFFF',
  mutedText: '#475569',
} as const

export type ColorKey = keyof typeof colors
