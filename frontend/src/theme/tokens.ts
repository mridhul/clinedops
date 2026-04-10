/**
 * Design token helpers for custom styling outside Ant Design components.
 *
 * All variables in this file correspond to CSS custom properties defined in
 * `frontend/src/theme/global.css`.
 */

export const cdCssVars = {
  surface: '--cd-surface',
  surfaceContainerLow: '--cd-surface-container-low',
  surfaceContainerLowest: '--cd-surface-container-lowest',
  surfaceBright: '--cd-surface-bright',
  surfaceContainerHighest: '--cd-surface-container-highest',
  surfaceTransparent: '--cd-surface-transparent',

  primary: '--cd-primary',
  primaryDim: '--cd-primary-dim',
  secondary: '--cd-secondary',

  tertiary: '--cd-tertiary',
  tertiaryContainer: '--cd-tertiary-container',
  onTertiaryContainer: '--cd-on-tertiary-container',

  error: '--cd-error',
  onError: '--cd-on-error',

  onSurfaceVariant: '--cd-on-surface-variant',
  onSurface: '--cd-on-surface',

  outlineVariantBase: '--cd-outline-variant-base',
  outlineVariant20: '--cd-outline-variant-20',

  ghostBorderPrimary: '--cd-ghost-border-primary',

  shadowStandard: '--cd-shadow-standard',
  shadowFloating: '--cd-shadow-floating',

  glassSurface: '--cd-glass-surface',
  glassBlur: '--cd-glass-blur',

  primaryGradient: '--cd-primary-gradient',

  fontDisplayFamily: '--cd-font-display-family',
  fontBodyFamily: '--cd-font-body-family',

  fontSizeBodyMd: '--cd-font-size-body-md',
  fontSizeLabelSm: '--cd-font-size-label-sm',
  fontWeightLabelSm: '--cd-font-weight-label-sm',

  roundedMd: '--cd-rounded-md',
  roundedFull: '--cd-rounded-full',

  spacing3: '--cd-spacing-3',
  spacing4: '--cd-spacing-4',
  spacing10: '--cd-spacing-10',
  spacing12: '--cd-spacing-12',

  // Asymmetric hero layout split
  heroLeftPercent: '--cd-hero-left-percent',
  heroRightPercent: '--cd-hero-right-percent',
} as const

export const cd = {
  surface: `var(${cdCssVars.surface})`,
  surfaceContainerLow: `var(${cdCssVars.surfaceContainerLow})`,
  surfaceContainerLowest: `var(${cdCssVars.surfaceContainerLowest})`,
  surfaceBright: `var(${cdCssVars.surfaceBright})`,
  surfaceContainerHighest: `var(${cdCssVars.surfaceContainerHighest})`,
  surfaceTransparent: `var(${cdCssVars.surfaceTransparent})`,

  primary: `var(${cdCssVars.primary})`,
  primaryDim: `var(${cdCssVars.primaryDim})`,
  secondary: `var(${cdCssVars.secondary})`,

  tertiary: `var(${cdCssVars.tertiary})`,
  tertiaryContainer: `var(${cdCssVars.tertiaryContainer})`,
  onTertiaryContainer: `var(${cdCssVars.onTertiaryContainer})`,

  error: `var(${cdCssVars.error})`,
  onError: `var(${cdCssVars.onError})`,

  onSurfaceVariant: `var(${cdCssVars.onSurfaceVariant})`,
  onSurface: `var(${cdCssVars.onSurface})`,

  outlineVariantBase: `var(${cdCssVars.outlineVariantBase})`,
  outlineVariant20: `var(${cdCssVars.outlineVariant20})`,

  shadowStandard: `var(${cdCssVars.shadowStandard})`,
  shadowFloating: `var(${cdCssVars.shadowFloating})`,

  glassSurface: `var(${cdCssVars.glassSurface})`,
  glassBlur: `var(${cdCssVars.glassBlur})`,

  primaryGradient: `var(${cdCssVars.primaryGradient})`,

  fontDisplayFamily: `var(${cdCssVars.fontDisplayFamily})`,
  fontBodyFamily: `var(${cdCssVars.fontBodyFamily})`,

  fontSizeBodyMd: `var(${cdCssVars.fontSizeBodyMd})`,
  fontSizeLabelSm: `var(${cdCssVars.fontSizeLabelSm})`,
  fontWeightLabelSm: `var(${cdCssVars.fontWeightLabelSm})`,

  roundedMd: `var(${cdCssVars.roundedMd})`,
  roundedFull: `var(${cdCssVars.roundedFull})`,

  spacing3: `var(${cdCssVars.spacing3})`,
  spacing4: `var(${cdCssVars.spacing4})`,
  spacing10: `var(${cdCssVars.spacing10})`,
  spacing12: `var(${cdCssVars.spacing12})`,

  heroLeftPercent: `var(${cdCssVars.heroLeftPercent})`,
  heroRightPercent: `var(${cdCssVars.heroRightPercent})`,
} as const

/**
 * For non-antd styling that needs the primary CTA gradient.
 * Prefer `cd.primaryGradient` for CSS-in-JS usage.
 */
export const primaryCTA = cd.primaryGradient

