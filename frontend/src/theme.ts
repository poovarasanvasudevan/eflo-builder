// Centralized theme constants — change PRIMARY here to update everywhere
export const PRIMARY = '#375745';

import { theme } from 'antd';

export const splunkTheme = {
    algorithm: theme.compactAlgorithm,
    token: {
        fontSize: 12,
        // === Typography ===
        fontFamily: "'Splunk Platform Sans', 'Proxima Nova', 'Helvetica Neue', Arial, sans-serif",

        lineHeight: 1.4,

        // === Brand Colors ===
        colorPrimary: '#5cc05c',         // Splunk green
        colorLink: '#5cc05c',
        colorLinkHover: '#7dd87d',

        // === Backgrounds ===
        colorBgBase: '#1a1c21',          // dark navy base
        colorBgContainer: '#1f2227',     // panel/card surface
        colorBgElevated: '#2b2d33',      // dropdowns, modals
        colorBgLayout: '#14161a',        // page background
        colorBgSpotlight: '#2b2d33',

        // === Borders ===
        colorBorder: '#3c3f47',
        colorBorderSecondary: '#2e3138',
        borderRadius: 0,                 // Splunk uses sharp corners
        borderRadiusLG: 0,
        borderRadiusSM: 0,
        borderRadiusXS: 0,

        // === Text ===
        colorText: '#c3cbd8',            // primary text - muted white
        colorTextSecondary: '#8b95a5',   // secondary labels
        colorTextTertiary: '#5e6673',
        colorTextQuaternary: '#3c4351',
        colorTextHeading: '#e2e8f0',

        // === Semantic ===
        colorSuccess: '#53a051',         // Splunk success green
        colorWarning: '#f8be34',         // Splunk amber
        colorError: '#dc4e41',           // Splunk red
        colorInfo: '#5379af',            // Splunk blue

        // === Inputs & Controls ===
        controlHeight: 26,               // Splunk uses compact controls
        controlHeightLG: 32,
        controlHeightSM: 24,

        // === Spacing ===
        marginXS: 4,
        marginSM: 8,
        margin: 12,
        marginMD: 16,
        marginLG: 20,

        paddingXS: 4,
        paddingSM: 8,
        padding: 12,
        paddingMD: 16,
        paddingLG: 20,

        // === Shadows ===
        boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
        boxShadowSecondary: '0 2px 8px rgba(0,0,0,0.6)',

        // === Motion ===
        motionDurationFast: '0.1s',
        motionDurationMid: '0.15s',
        motionDurationSlow: '0.2s',
    },
    components: {
        Button: {
            colorPrimary: '#5cc05c',
            colorPrimaryHover: '#7dd87d',
            colorPrimaryActive: '#4aa34a',
            defaultBg: '#2b2d33',
            defaultBorderColor: '#3c3f47',
            defaultColor: '#c3cbd8',
            paddingInline: 12,
            fontWeight: 600,
        },
        Input: {
            colorBgContainer: '#14161a',
            colorBorder: '#3c3f47',
            activeBorderColor: '#5cc05c',
            hoverBorderColor: '#5e6673',
            colorText: '#c3cbd8',
            colorPlaceholderText: '#5e6673',
        },
        Select: {
            colorBgContainer: '#14161a',
            colorBorder: '#3c3f47',
            colorText: '#c3cbd8',
            optionSelectedBg: '#2b3a2b',
            optionActiveBg: '#252729',
        },
        Table: {
            colorBgContainer: '#1a1c21',
            headerBg: '#14161a',
            headerColor: '#8b95a5',
            rowHoverBg: '#252729',
            borderColor: '#2e3138',
            colorText: '#c3cbd8',
        },
        Card: {
            colorBgContainer: '#1f2227',
            colorBorderSecondary: '#2e3138',
            colorTextHeading: '#e2e8f0',
            paddingLG: 16,
        },
        Menu: {
            darkItemBg: '#14161a',
            darkSubMenuItemBg: '#1a1c21',
            darkItemSelectedBg: '#2b3a2b',
            darkItemColor: '#c3cbd8',
            darkItemHoverColor: '#ffffff',
            darkItemSelectedColor: '#5cc05c',
        },
        Tabs: {
            colorBorderSecondary: '#3c3f47',
            itemColor: '#8b95a5',
            itemHoverColor: '#c3cbd8',
            itemSelectedColor: '#5cc05c',
            inkBarColor: '#5cc05c',
        },
        Modal: {
            colorBgElevated: '#2b2d33',
            colorBorder: '#3c3f47',
            titleColor: '#e2e8f0',
        },
        Tooltip: {
            colorBgSpotlight: '#3c3f47',
            colorTextLightSolid: '#c3cbd8',
        },
        Badge: {
            colorError: '#dc4e41',
        },
        Tag: {
            colorBgContainer: '#2b2d33',
            colorBorder: '#3c3f47',
            colorText: '#c3cbd8',
        },
        Collapse: {
            colorBgContainer: '#1f2227',
            headerBg: '#14161a',
            colorBorder: '#2e3138',
        },
    },
};

