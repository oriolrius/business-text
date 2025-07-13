import { PanelModel } from '@grafana/data';
import semver from 'semver';

import { PanelOptions, RenderMode } from './types';

/**
 * Outdated Panel Options
 */
interface OutdatedPanelOptions {
  /**
   * Every row
   *
   * Removed in 4.3.0
   */
  everyRow?: boolean;
}

/**
 * Normalize Helpers Option
 */
const normalizeHelpersOption = (code: string): string => {
  const search =
    /^(?!.*context\.)(?:.*)(handlebars|panelData|dataFrame\.|data\.|getLocale\(|timeZone|timeRange|eventBus|locationService|replaceVariables\()/gm;

  return code
    .split(' ')
    .map((part) => {
      return part.replace(search, (value, ...args) => {
        const searchTerm = args[0] || value;

        return value.replace(searchTerm, (valueToReplace) => {
          switch (valueToReplace) {
            case 'data.': {
              return 'context.data.';
            }
            case 'handlebars': {
              return 'context.handlebars';
            }
            case 'dataFrame.': {
              return 'context.dataFrame.';
            }
            case 'panelData': {
              return 'context.panelData';
            }
            case 'getLocale(': {
              return 'context.grafana.getLocale(';
            }
            case 'timeZone': {
              return 'context.grafana.timeZone';
            }
            case 'timeRange': {
              return 'context.grafana.timeRange';
            }
            case 'eventBus': {
              return 'context.grafana.eventBus';
            }
            case 'locationService': {
              return 'context.grafana.locationService';
            }
            case 'replaceVariables(': {
              return 'context.grafana.replaceVariables(';
            }
            default: {
              return value;
            }
          }
        });
      });
    })
    .join(' ');
};

/**
 * Get Migrated Options
 * @param panel
 */
export const getMigratedOptions = (panel: PanelModel<OutdatedPanelOptions & PanelOptions>): PanelOptions => {
  const { everyRow, ...actualOptions } = panel.options;
  /**
   * Normalize non context code parameters before 5.0.0
   */
  if (panel.pluginVersion && semver.lt(panel.pluginVersion, '5.0.0')) {
    actualOptions.helpers = normalizeHelpersOption(actualOptions.helpers);
  }

  /**
   * Normalize \\n characters to \n for versions lt 5.6.0
   */
  if (panel.pluginVersion && semver.lt(panel.pluginVersion, '5.6.0')) {
    if (actualOptions.helpers) {
      actualOptions.helpers = actualOptions.helpers.replaceAll('\\n', '\n');
    }
    if (actualOptions.afterRender) {
      actualOptions.afterRender = actualOptions.afterRender.replaceAll('\\n', '\n');
    }
    if (actualOptions.defaultContent) {
      actualOptions.defaultContent = actualOptions.defaultContent.replaceAll('\\n', '\n');
    }
    if (actualOptions.content) {
      actualOptions.content = actualOptions.content.replaceAll('\\n', '\n');
    }
    if (actualOptions.styles) {
      actualOptions.styles = actualOptions.styles.replaceAll('\\n', '\n');
    }
  }

  /**
   * Add default data source options if missing
   */
  if (!actualOptions.dataSource) {
    actualOptions.dataSource = {
      enableDataSourceQueries: false,
      defaultDataSourceUid: undefined,
      queryTimeout: 30000,
      enableCaching: false,
      showQueryErrors: true,
    };
  }

  /**
   * Normalize every row
   */
  if (everyRow !== undefined) {
    return {
      ...actualOptions,
      renderMode: everyRow ? RenderMode.EVERY_ROW : RenderMode.ALL_ROWS,
    };
  }

  return {
    ...actualOptions,
  };
};
