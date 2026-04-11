import type { ThemeConfig } from 'antd/es/config-provider/context'

/**
 * Ant Design theme mapping for `designs/DESIGN.md`.
 * Gradients, glass, and fine-grained controls: `frontend/src/theme/global.css` + `--cd-*`.
 */
export const themeConfig = {
  token: {
    colorPrimary: 'var(--cd-primary)',
    colorPrimaryHover: 'var(--cd-primary-dim)',

    colorBgBase: 'var(--cd-surface)',
    colorBgContainer: 'var(--cd-surface-container-lowest)',
    colorBgElevated: 'var(--cd-surface-container-lowest)',
    colorFillSecondary: 'var(--cd-surface-container-highest)',
    colorFillTertiary: 'var(--cd-surface-container-low)',

    colorText: 'var(--cd-on-surface)',
    colorTextSecondary: 'var(--cd-on-surface-variant)',
    colorError: 'var(--cd-error)',

    /* DESIGN.md rounded-md (6px) */
    borderRadius: 6,
    controlHeight: 40,

    colorBorder: 'var(--cd-surface-container-highest)',
    colorBorderSecondary: 'var(--cd-surface-container-highest)',
    lineWidth: 1,

    fontFamily: 'var(--cd-font-body-family)',
    fontFamilyCode:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
  },
  components: {
    Button: {
      paddingInline: 20,
      fontWeight: 500,
      controlHeight: 40,
      borderRadius: 6,
    },
    Input: {
      paddingInline: 14,
      paddingBlock: 8,
      colorBgContainer: 'var(--cd-surface-container-highest)',
      activeBorderColor: 'var(--cd-primary)',
      hoverBorderColor: 'transparent',
      activeShadow: '0 0 0 2px rgba(0, 93, 182, 0.2)',
      errorActiveShadow: '0 0 0 2px rgba(159, 64, 61, 0.28)',
    },
    InputNumber: {
      paddingInline: 14,
      controlHeight: 40,
      borderRadius: 6,
      colorBgContainer: 'var(--cd-surface-container-highest)',
      activeBorderColor: 'var(--cd-primary)',
      hoverBorderColor: 'transparent',
      activeShadow: '0 0 0 2px rgba(0, 93, 182, 0.2)',
      errorActiveShadow: '0 0 0 2px rgba(159, 64, 61, 0.28)',
    },
    Form: {
      labelRequiredMarkColor: 'var(--cd-primary)',
      verticalLabelPadding: '0 0 8px',
    },
    Select: {
      controlHeight: 40,
      controlPaddingHorizontal: 14,
      colorBgContainer: 'var(--cd-surface-container-highest)',
      optionSelectedBg: 'var(--cd-surface-container-low)',
    },
    DatePicker: {
      controlHeight: 40,
      paddingInline: 14,
      colorBgContainer: 'var(--cd-surface-container-highest)',
    },
    Card: {
      headerFontSize: 16,
      headerFontSizeSM: 14,
      borderRadiusLG: 8,
    },
    Table: {
      headerBg: 'var(--cd-surface-container-low)',
      headerColor: 'var(--cd-on-surface-variant)',
      headerSplitColor: 'transparent',
      borderColor: 'transparent',
      rowHoverBg: 'var(--cd-surface-container-low)',
      paddingContentVerticalLG: 12,
    },
    Menu: {
      itemBorderRadius: 6,
      activeBarBorderWidth: 0,
      itemHeight: 44,
      iconSize: 18,
    },
    Tabs: {
      horizontalMargin: '0 0 12px 0',
    },
    Modal: {
      borderRadiusLG: 12,
      boxShadow: '0px 20px 50px rgba(43, 52, 56, 0.08)',
    },
  },
} as unknown as ThemeConfig
