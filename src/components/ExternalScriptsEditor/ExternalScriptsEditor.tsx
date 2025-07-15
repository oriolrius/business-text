import { StandardEditorProps } from '@grafana/data';
import { Alert, TextArea, useStyles2 } from '@grafana/ui';
import React, { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { PanelOptions, Resource } from '../../types';
import { getStyles } from './ExternalScriptsEditor.styles';

/**
 * Properties
 */
type Props = StandardEditorProps<Resource[], PanelOptions>;

/**
 * External Scripts Editor
 */
export const ExternalScriptsEditor: React.FC<Props> = ({ value = [], onChange, context }) => {
  /**
   * Styles
   */
  const styles = useStyles2(getStyles);

  /**
   * Current value as text
   */
  const currentUrlsText = value?.map(resource => resource.url).join('\n') || '';

  /**
   * Local state for text area value
   */
  const [localText, setLocalText] = React.useState(currentUrlsText);

  /**
   * Update local text when value prop changes
   */
  React.useEffect(() => {
    setLocalText(currentUrlsText);
  }, [currentUrlsText]);

  /**
   * Handle text change (only updates local state)
   */
  const onTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalText(event.currentTarget.value);
  }, []);

  /**
   * Handle blur - save changes when user loses focus
   */
  const onBlur = useCallback(() => {
    const urls = localText
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
    
    const resources: Resource[] = urls.map(url => ({
      id: uuidv4(),
      url,
    }));
    
    onChange(resources);
  }, [localText, onChange]);

  /**
   * Replace variables in URLs for preview
   */
  const { replaceVariables } = context;
  const processedUrls = value?.map(resource => replaceVariables(resource.url)).join('\n') || '';

  return (
    <div className={styles.container}>
      <Alert 
        title="External JavaScript Libraries" 
        severity="info"
        className={styles.alert}
      >
        <div className={styles.description}>
          <p>
            Enter one URL per line. These JavaScript files will be loaded in the order specified, 
            before the &quot;After Content Ready&quot; script executes.
          </p>
          <p>
            <strong>Important:</strong>
          </p>
          <ul>
            <li>Files are fetched through the backend proxy (avoids CORS issues)</li>
            <li>Scripts are executed sequentially in the order listed</li>
            <li>Code runs in the same context as your &quot;After Content Ready&quot; script</li>
            <li>Use this for loading external libraries (e.g., Chart.js, D3.js, custom utilities)</li>
            <li>Dashboard variables are supported (e.g., ${`{myVariable}`})</li>
            <li>Scripts share the same context object and variables</li>
          </ul>
        </div>
      </Alert>
      
      <TextArea
        value={localText}
        onChange={onTextChange}
        onBlur={onBlur}
        placeholder="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js&#10;https://example.com/my-library.js"
        rows={8}
        className={styles.textarea}
      />
      
      {value && value.length > 0 && processedUrls !== currentUrlsText && (
        <div className={styles.preview}>
          <strong>URLs after variable replacement:</strong>
          <pre>{processedUrls}</pre>
        </div>
      )}
    </div>
  );
};
