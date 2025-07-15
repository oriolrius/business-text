import { Field, FieldConfigProperty, FieldType, PanelPlugin } from '@grafana/data';

import {
  AfterRenderWithUrlEditor,
  ContentPartialsEditor,
  ExternalScriptsEditor,
  HelpersWithUrlEditor,
  ResourcesEditor,
  StylesWithUrlEditor,
  TextEditor,
  TextPanel,
} from './components';
import {
  CODE_LANGUAGE_OPTIONS,
  DEFAULT_OPTIONS,
  EDITORS_OPTIONS,
  FORMAT_OPTIONS,
  RENDER_MODE_OPTIONS,
  WRAP_OPTIONS,
} from './constants';
import { getMigratedOptions } from './migration';
import { EditorType, PanelOptions } from './types';

/**
 * Panel Plugin
 */
export const plugin = new PanelPlugin<PanelOptions>(TextPanel)
  .setNoPadding()
  .setMigrationHandler(getMigratedOptions)
  .useFieldConfig({
    disableStandardOptions: [
      FieldConfigProperty.Color,
      FieldConfigProperty.Min,
      FieldConfigProperty.Max,
      FieldConfigProperty.DisplayName,
      FieldConfigProperty.NoValue,
      FieldConfigProperty.Links,
      FieldConfigProperty.Mappings,
      'unitScale' as never,
      'fieldMinMax' as never,
    ],
  })
  .setPanelOptions((builder) => {
    builder
      .addSelect({
        path: 'renderMode',
        name: 'Render template',
        settings: {
          options: RENDER_MODE_OPTIONS,
        },
        defaultValue: DEFAULT_OPTIONS.renderMode,
      })
      .addMultiSelect({
        path: 'editors',
        name: 'Select Editors to display. Editors with updated values always displayed.',
        settings: {
          options: EDITORS_OPTIONS as never,
        },
        defaultValue: DEFAULT_OPTIONS.editors,
      })
      .addFieldNamePicker({
        path: 'status',
        name: 'Field with status value. To be used to get statusColor based on thresholds.',
        settings: {
          filter: (f: Field) => f.type === FieldType.number,
          noFieldsMessage: 'No number fields found',
        },
      });

    /**
     * Editor
     */
    builder
      .addRadio({
        path: 'editor.language',
        name: 'Primary Content Language',
        description: 'Used for formatting and suggestions.',
        settings: {
          options: CODE_LANGUAGE_OPTIONS,
        },
        defaultValue: DEFAULT_OPTIONS.editor.language,
        category: ['Editor'],
      })
      .addRadio({
        path: 'editor.format',
        name: 'Formatting',
        settings: {
          options: FORMAT_OPTIONS,
        },
        defaultValue: DEFAULT_OPTIONS.editor.format,
        category: ['Editor'],
      });

    /**
     * Content
     */
    builder
      .addRadio({
        path: 'wrap',
        name: 'Wrap automatically in paragraphs',
        description: 'If disabled, result will NOT be wrapped into <p> tags.',
        defaultValue: DEFAULT_OPTIONS.wrap,
        settings: {
          options: WRAP_OPTIONS,
        },
        category: ['Content'],
      })
      .addCustomEditor({
        id: 'contentPartials',
        path: 'contentPartials',
        name: 'Content Partials',
        description: 'Partial call syntax: {{> name }}',
        defaultValue: DEFAULT_OPTIONS.contentPartials,
        editor: ContentPartialsEditor,
        category: ['Content'],
      })
      .addCustomEditor({
        id: 'content',
        path: 'content',
        name: 'Content',
        defaultValue: DEFAULT_OPTIONS.content,
        editor: TextEditor,
        category: ['Content'],
      })
      .addCustomEditor({
        id: 'defaultContent',
        path: 'defaultContent',
        name: 'Default Content',
        description: 'Displayed when query result is empty.',
        defaultValue: DEFAULT_OPTIONS.defaultContent,
        editor: TextEditor,
        category: ['Content'],
        showIf: (config) =>
          config.editors.includes(EditorType.DEFAULT) || config.defaultContent !== DEFAULT_OPTIONS.defaultContent,
      });

    /**
     * JavaScript
     */
    builder
      .addTextInput({
        path: 'helpersRemoteUrl',
        name: 'Remote URL',
        description: 'URL to fetch JavaScript helpers code from.',
        defaultValue: DEFAULT_OPTIONS.helpersRemoteUrl,
        category: ['JavaScript'],
        showIf: (config) => config.editors.includes(EditorType.HELPERS) || config.helpers !== DEFAULT_OPTIONS.helpers,
      })
      .addCustomEditor({
        id: 'helpers',
        path: 'helpers',
        name: 'Before Content Rendering',
        description: 'Allows to execute code before content rendering. E.g. add Handlebars Helpers.',
        defaultValue: DEFAULT_OPTIONS.helpers,
        editor: HelpersWithUrlEditor,
        category: ['JavaScript'],
        showIf: (config) => config.editors.includes(EditorType.HELPERS) || config.helpers !== DEFAULT_OPTIONS.helpers,
      })
      .addCustomEditor({
        id: 'externalScripts',
        path: 'externalScripts',
        name: 'External JavaScript Libraries',
        description: 'JavaScript files to load before "After Content Ready" script.',
        defaultValue: DEFAULT_OPTIONS.externalScripts,
        editor: ExternalScriptsEditor,
        category: ['JavaScript'],
      })
      .addTextInput({
        path: 'afterRenderRemoteUrl',
        name: 'Remote URL',
        description: 'URL to fetch JavaScript after render code from.',
        defaultValue: DEFAULT_OPTIONS.afterRenderRemoteUrl,
        category: ['JavaScript'],
        showIf: (config) => config.editors.includes(EditorType.AFTER_RENDER) || config.afterRender !== DEFAULT_OPTIONS.afterRender,
      })
      .addCustomEditor({
        id: 'afterRender',
        path: 'afterRender',
        name: 'After Content Ready',
        description:
          'Allows to execute code after content is ready. E.g. use element for drawing chart or event listeners.',
        defaultValue: DEFAULT_OPTIONS.afterRender,
        editor: AfterRenderWithUrlEditor,
        category: ['JavaScript'],
        showIf: (config) =>
          config.editors.includes(EditorType.AFTER_RENDER) || config.afterRender !== DEFAULT_OPTIONS.afterRender,
      });

    /**
     * Styles
     */
    builder
      .addCustomEditor({
        id: 'externalStyles',
        path: 'externalStyles',
        name: 'CSS Styles',
        defaultValue: DEFAULT_OPTIONS.externalStyles,
        editor: ResourcesEditor,
        category: ['CSS Styles'],
      })
      .addTextInput({
        path: 'stylesRemoteUrl',
        name: 'Remote URL',
        description: 'URL to fetch CSS styles code from.',
        defaultValue: DEFAULT_OPTIONS.stylesRemoteUrl,
        category: ['CSS Styles'],
        showIf: (config) => config.editors.includes(EditorType.STYLES) || config.styles !== DEFAULT_OPTIONS.styles,
      })
      .addCustomEditor({
        id: 'styles',
        path: 'styles',
        name: 'Styles editor',
        description: 'Allows to add styles. Use & {} for parent style.',
        defaultValue: DEFAULT_OPTIONS.styles,
        editor: StylesWithUrlEditor,
        category: ['CSS Styles'],
        showIf: (config) => config.editors.includes(EditorType.STYLES) || config.styles !== DEFAULT_OPTIONS.styles,
      });

    /**
     * Data Source Integration
     */
    builder
      .addBooleanSwitch({
        path: 'dataSource.enableDataSourceQueries',
        name: 'Enable Data Source Queries',
        description: 'Allow JavaScript code to execute queries against Grafana data sources.',
        defaultValue: DEFAULT_OPTIONS.dataSource.enableDataSourceQueries,
        category: ['Data Source'],
      })
      .addNumberInput({
        path: 'dataSource.queryTimeout',
        name: 'Query Timeout (ms)',
        description: 'Maximum time to wait for data source queries to complete.',
        defaultValue: DEFAULT_OPTIONS.dataSource.queryTimeout,
        category: ['Data Source'],
        showIf: (config) => config.dataSource?.enableDataSourceQueries,
        settings: {
          min: 1000,
          max: 300000,
          step: 1000,
        },
      })
      .addBooleanSwitch({
        path: 'dataSource.showQueryErrors',
        name: 'Show Query Errors',
        description: 'Display data source query errors as notifications.',
        defaultValue: DEFAULT_OPTIONS.dataSource.showQueryErrors,
        category: ['Data Source'],
        showIf: (config) => config.dataSource?.enableDataSourceQueries,
      });

    return builder;
  });
