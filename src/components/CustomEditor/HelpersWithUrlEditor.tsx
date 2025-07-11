import { StandardEditorProps } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Button, InlineField, InlineFieldRow } from '@grafana/ui';
import React, { useCallback, useState } from 'react';

import { EditorType } from '../../constants';
import { PanelOptions } from '../../types';
import { CustomEditor } from './CustomEditor';

/**
 * Enhanced Helpers Editor with URL fetch functionality
 */
export const HelpersWithUrlEditor: React.FC<StandardEditorProps> = (props) => {
  const { onChange, context } = props;
  const [isLoading, setIsLoading] = useState(false);
  
  // Get the current helpersRemoteUrl from panel options
  const options = context.options as PanelOptions;
  const remoteUrl = options.helpersRemoteUrl || '';

  /**
   * Fetch content from remote URL
   */
  const handleRefresh = useCallback(async () => {
    if (!remoteUrl.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      // Use the same endpoint as in partials.ts
      const response = await getBackendSrv().post('/api/plugins/volkovlabs-text-panel/resources/fetch-content', {
        url: remoteUrl,
      });

      let content: string;
      
      // Handle different response formats (same logic as in partials.ts)
      if (typeof response === 'string') {
        content = response;
      } else if (response && typeof response === 'object') {
        const dataObj = response as Record<string, unknown>;
        if (dataObj.content) {
          content = dataObj.content as string;
        } else if (dataObj.data) {
          content = dataObj.data as string;
        } else if (dataObj.text) {
          content = dataObj.text as string;
        } else if (dataObj.html) {
          content = dataObj.html as string;
        } else {
          content = JSON.stringify(response, null, 2);
        }
      } else {
        content = String(response);
      }
      
      // Update the helpers content with fetched content
      onChange(content);
    } catch (error) {
      // Use a more appropriate error handling mechanism
      // console.error('Failed to fetch content from URL:', error);
      // You might want to show a notification here
    } finally {
      setIsLoading(false);
    }
  }, [remoteUrl, onChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {remoteUrl && (
        <InlineFieldRow>
          <InlineField label="Fetch from Remote URL">
            <Button
              variant="secondary"
              onClick={handleRefresh}
              disabled={!remoteUrl.trim() || isLoading}
              icon={isLoading ? undefined : 'sync'}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </InlineField>
        </InlineFieldRow>
      )}
      
      <div style={{ flex: 1 }}>
        <CustomEditor
          {...props}
          type={EditorType.HELPERS}
        />
      </div>
    </div>
  );
};
