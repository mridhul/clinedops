import type { ThemeConfig } from 'antd/es/config-provider/context'

/**
 * Ant Design theme mapping for `designs/DESIGN.md`.
 *
 * Note: DESIGN specifies several visual rules (gradients/glass/ghost-border focus)
 * that are not fully supported by Ant's token system. Those are implemented via
 * `frontend/src/theme/global.css` using the `--cd-*` CSS variables.
 */
export const themeConfig = {
  token: {
    colorPrimary: 'var(--cd-primary)',
    colorPrimaryHover: 'var(--cd-primary-dim)',

    colorBgBase: 'var(--cd-surface)',
    colorBgContainer: '#ffffff', // Clean white background for cards/inputs
    colorBgElevated: 'var(--cd-surface-container-lowest)',

    colorTextSecondary: 'var(--cd-on-surface-variant)',
    colorError: 'var(--cd-error)',

    borderRadius: 8, // Softer, more modern borders
    controlHeight: 40, // Taller buttons and inputs for a premium feel

    colorBorder: '#dbe4ea', // Subtle borders
    lineWidth: 1,

    fontFamily: 'var(--cd-font-body-family)',
    fontFamilyCode:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: 14,
    fontSizeSM: 12,
  },
  components: {
    Button: {
      paddingInline: 20,
      fontWeight: 500,
      controlHeight: 42,
    },
    Input: {
      paddingInline: 14,
      paddingBlock: 8,
      activeShadow: '0 0 0 3px rgba(0, 93, 182, 0.1)',
      errorActiveShadow: '0 0 0 3px rgba(159, 64, 61, 0.1)',
      hoverBorderColor: '#bac7d5',
    },
    Select: {
      controlHeight: 40,
      controlPaddingHorizontal: 14,
    },
    DatePicker: {
      controlHeight: 40,
      paddingInline: 14,
    },
    Card: {
      headerFontSize: 16,
      headerFontSizeSM: 14,
    },
    Table: {
      headerBg: 'var(--cd-surface-container-low)',
      headerColor: 'var(--cd-on-surface-variant)',
      headerSplitColor: 'transparent',
      borderColor: 'var(--cd-surface-container-highest)',
      rowHoverBg: 'var(--cd-surface-container-low)',
      padding: 16,
    },
    Menu: {
      itemBorderRadius: 8,
      activeBarBorderWidth: 0,
      itemHeight: 44,
      iconSize: 18,
    }
  }
} as unknown as ThemeConfig

