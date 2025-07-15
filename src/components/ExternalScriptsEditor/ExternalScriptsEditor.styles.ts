import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

/**
 * Styles
 */
export const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(2)};
    `,
    alert: css`
      margin-bottom: ${theme.spacing(1)};
    `,
    description: css`
      p {
        margin-bottom: ${theme.spacing(1)};
      }
      ul {
        margin-left: ${theme.spacing(2)};
        margin-bottom: 0;
      }
      li {
        margin-bottom: ${theme.spacing(0.5)};
      }
    `,
    textarea: css`
      font-family: ${theme.typography.fontFamilyMonospace};
      width: 100%;
    `,
    preview: css`
      background: ${theme.colors.background.secondary};
      border: 1px solid ${theme.colors.border.weak};
      border-radius: ${theme.shape.radius.default};
      padding: ${theme.spacing(1)};
      
      pre {
        margin: ${theme.spacing(0.5)} 0 0 0;
        font-family: ${theme.typography.fontFamilyMonospace};
        font-size: ${theme.typography.fontSize}px;
        white-space: pre-wrap;
        word-break: break-word;
      }
    `,
  };
};
