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
import React, { useCallback, useEffect, useRef } from 'react';

import { TEST_IDS } from '../../constants';
import { PanelOptions, RowItem } from '../../types';
import {
  afterRenderCodeParameters,
  createDataSourceContext,
  createExecutionCode,
  createNotificationContext,
} from '../../utils';

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
   * Run After Render Function
   */
  useEffect(() => {
    let unsubscribe: unknown = null;
    if (ref.current && afterRender) {
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

      const func = createExecutionCode('context', afterRender);

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
