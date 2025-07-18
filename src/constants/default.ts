import { PanelOptions, RenderMode } from '../types';
import { CodeLanguage, Format } from './editor';

/**
 * Default Options
 */
export const DEFAULT_OPTIONS: PanelOptions = {
  afterRender: '',
  content: '```json\n{{{json @root}}}\n```',
  defaultContent: "The query didn't return any results.",
  editor: { format: Format.AUTO, language: CodeLanguage.MARKDOWN },
  editors: [],
  renderMode: RenderMode.EVERY_ROW,
  externalStyles: [],
  externalScripts: [],
  contentPartials: [],
  helpers: '',
  helpersRemoteUrl: '',
  afterRenderRemoteUrl: '',
  stylesRemoteUrl: '',
  status: '',
  styles: '',
  wrap: true,
  dataSource: {
    enableDataSourceQueries: false,
    defaultDataSourceUid: undefined,
    queryTimeout: 30000,
    enableCaching: false,
    showQueryErrors: true,
  },
};
