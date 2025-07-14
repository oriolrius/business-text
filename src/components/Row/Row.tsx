import {
  AlertErrorPayload,
  AlertPayload,
  AppEvents,
  EventBus,
  getLocale,
  InterpolateFunction,
  TimeRange,
} from '@grafana/data';
import { getAppEvents, locationService } from '@grafana/runtime';
import { TimeZone } from '@grafana/schema';
import { useTheme2 } from '@grafana/ui';
import { useDashboardRefresh } from '@volkovlabs/components';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { TEST_IDS } from '../../constants';
import { PanelOptions, RowItem } from '../../types';
import {
  afterRenderCodeParameters,
  createDataSourceContext,
  createExecutionCode,
  createNotificationContext,
} from '../../utils';
import { fetchHtmlViaBackend } from '../../utils/partials';

/**
 * Properties
 */
export interface Props {
  /**
   * Event Bus
   *
   * @type {EventBus}
   */
  eventBus: EventBus;

  /**
   * Replace Variables
   *
   * @type {InterpolateFunction}
   */
  replaceVariables: InterpolateFunction;

  /**
   * Item
   *
   * @type {RowItem}
   */
  item: RowItem;

  /**
   * Class Name
   *
   * @type {string}
   */
  className: string;

  /**
   * After Render Function
   *
   * @type {string}
   */
  afterRender: string;

  /**
   * Time range of the current dashboard
   *
   * @type {TimeRange}
   */
  timeRange: TimeRange;

  /**
   * Time zone of the current dashboard
   *
   * @type {TimeZone}
   */
  timeZone: TimeZone;

  /**
   * Panel Options
   *
   * @type {PanelOptions}
   */
  options: PanelOptions;

  /**
   * Options change callback
   *
   * @type {Function}
   */
  onOptionsChange?: (options: PanelOptions) => void;
}

/**
 * Row
 */
export const Row: React.FC<Props> = ({
  className,
  item,
  afterRender,
  replaceVariables,
  eventBus,
  timeRange,
  timeZone,
  options,
  onOptionsChange,
}) => {
  /**
   * Row Ref
   */
  const ref = useRef<HTMLDivElement>(null);

  /**
   * Theme and Styles
   */
  const theme = useTheme2();

  /**
   * Events
   */
  const appEvents = getAppEvents();

  const notifySuccess = useCallback(
    (payload: AlertPayload) => appEvents.publish({ type: AppEvents.alertSuccess.name, payload }),
    [appEvents]
  );

  const notifyError = useCallback(
    (payload: AlertErrorPayload) => appEvents.publish({ type: AppEvents.alertError.name, payload }),
    [appEvents]
  );

  /**
   * Refresh dashboard
   */
  const refreshDashboard = useDashboardRefresh();

  /**
   * Function This
   */
  const functionThis = useRef({});

  /**
   * Remote content state
   */
  const [remoteAfterRender, setRemoteAfterRender] = useState<string | null>(null);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);

  /**
   * Fetch remote afterRender content when needed
   */
  useEffect(() => {
    const shouldFetchRemote = !afterRender && options.afterRenderRemoteUrl;
    
    if (shouldFetchRemote && !isLoadingRemote) {
      setIsLoadingRemote(true);
      
      fetchHtmlViaBackend(replaceVariables(options.afterRenderRemoteUrl), 'afterRender')
        .then((result) => {
          setRemoteAfterRender(result.content);
          setIsLoadingRemote(false);
          
          // Update the afterRender field with the fetched content
          if (onOptionsChange) {
            onOptionsChange({
              ...options,
              afterRender: result.content,
            });
          }
        })
        .catch((error) => {
          notifyError([`Failed to fetch remote afterRender from ${options.afterRenderRemoteUrl}: ${error.message}`]);
          setIsLoadingRemote(false);
        });
    } else if (afterRender) {
      // Clear remote content when local content is available
      setRemoteAfterRender(null);
    }
  }, [afterRender, options.afterRenderRemoteUrl, replaceVariables, notifyError, isLoadingRemote, onOptionsChange, options]);

  /**
   * Run After Render Function
   */
  useEffect(() => {
    let unsubscribe: unknown = null;
    
    // Use remote content if afterRender is empty but remote content is available
    const effectiveAfterRender = afterRender || remoteAfterRender;
    
    if (ref.current && effectiveAfterRender) {
      /**
       * Create notification context
       */
      const notificationContext = createNotificationContext(notifySuccess, notifyError);

      /**
       * Create data source context
       */
      const dataSourceContext = createDataSourceContext(
        item.panelData,
        timeRange,
        notificationContext,
        options.dataSource
      );

      const func = createExecutionCode('context', effectiveAfterRender);

      const result = func.call(
        functionThis.current,
        afterRenderCodeParameters.create({
          element: ref.current,
          data: item.data,
          panelData: item.panelData,
          dataFrame: item.dataFrame,
          dataSource: dataSourceContext,
          notify: notificationContext,
          grafana: {
            theme,
            notifySuccess,
            notifyError,
            timeRange,
            timeZone,
            getLocale,
            replaceVariables,
            eventBus,
            locationService,
            refresh: () => refreshDashboard(),
          },
        })
      );

      // Handle async functions that return promises
      if (result && typeof result.then === 'function') {
        result.then((asyncUnsubscribe: (() => void) | void) => {
          if (typeof asyncUnsubscribe === 'function') {
            unsubscribe = asyncUnsubscribe;
          }
        }).catch(() => {
          // Error is handled by error boundary
        });
      } else {
        unsubscribe = result;
      }
    }

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [
    afterRender,
    remoteAfterRender,
    eventBus,
    item.data,
    item.dataFrame,
    item.panelData,
    notifyError,
    notifySuccess,
    refreshDashboard,
    replaceVariables,
    theme,
    timeRange,
    timeZone,
    options.dataSource,
  ]);

  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: item.html }}
      data-testid={TEST_IDS.text.content}
    />
  );
};
