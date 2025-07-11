import { InterpolateFunction } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';

import { PartialItem, PartialItemConfig } from '../types';

/**
 * Fetch content using the plugin's backend endpoint (server-side)
 */
export const fetchHtmlViaBackend = async (url: string, partialName: string): Promise<PartialItem> => {
  try {
    // Use the plugin's backend to fetch the content server-side
    // This avoids CORS issues and doesn't require browser fetch
    const response = await getBackendSrv().post('/api/plugins/volkovlabs-text-panel/resources/fetch-content', {
      url: url,
    });

    // Handle the response properly - the content should be directly in the response
    if (response) {
      let content: string;
      
      // Handle different response formats
      if (typeof response === 'string') {
        content = response;
      } else if (response && typeof response === 'object') {
        // If it's an object, try to extract content from common fields
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
          // The response itself might be the content
          content = JSON.stringify(response, null, 2);
        }
      } else {
        content = String(response);
      }
      
      return {
        name: partialName,
        content,
      };
    } else {
      throw new Error(`No content received from backend for ${url}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch via plugin backend from ${url}: ${errorMessage}`);
  }
};

/**
 * Fetch partials using local content when available, otherwise backend method
 */
export const fetchAllPartials = async (items: PartialItemConfig[], replaceVariables: InterpolateFunction) => {
  return await Promise.all(items.map(async (item) => {
    // If local copy is enabled and content is available, use it directly
    if (item.isLocalCopy && item.localContent) {
      return {
        name: item.name,
        content: item.localContent,
      };
    }
    
    const url = replaceVariables(item.url);
    
    // Use the plugin backend method (server-side, no CORS issues)
    return await fetchHtmlViaBackend(url, item.name);
  }));
};
