import { AppEvents, FieldType, toDataFrame } from '@grafana/data';
import { act, render, screen } from '@testing-library/react';
import React from 'react';

import { DEFAULT_OPTIONS, TEST_IDS } from '../../constants';
import { RenderMode } from '../../types';
import { Text } from './Text';
import { getAppEvents } from '@grafana/runtime';
import { useDashboardRefresh } from '@volkovlabs/components';
/**
 * Mock @grafana/runtime
 */
const appEvents = {
  publish: jest.fn(),
};

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getAppEvents: jest.fn().mockImplementation(() => appEvents),
}));

jest.mock('@volkovlabs/components', () => ({
  ...jest.requireActual('@volkovlabs/components'),
  useDashboardRefresh: jest.fn(),
}));

/**
 * Props
 */
type Props = React.ComponentProps<typeof Text>;

/**
 * Text
 */
describe('Text', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Default Content
   */
  it('Should render default content when there is no dataframe', async () => {
    const props: Props = {
      data: {} as any,
      options: {
        ...DEFAULT_OPTIONS,
        content: 'Test content',
        defaultContent: 'Test default content',
        renderMode: RenderMode.ALL_ROWS,
      },
      timeRange: {} as any,
      timeZone: '',
      replaceVariables: (str: string) => str,
      eventBus: {} as any,
    };

    await act(async () => render(<Text {...props} />));

    expect(screen.getByTestId(TEST_IDS.text.content)).toBeInTheDocument();
    expect(screen.getByTestId(TEST_IDS.text.content)).toHaveTextContent('Test default content');
  });

  describe('After Render Function', () => {
    /**
     * context.grafana.eventBus.publish
     */
    it('Should run after render function', async () => {
      const eventBus = {
        publish: jest.fn(() => {}),
      };
      const replaceVariables = jest.fn((str: string) => str);

      const props: Props = {
        data: {} as any,
        options: {
          ...DEFAULT_OPTIONS,
          defaultContent: '<div id="element"></div>',
          afterRender: `
          context.grafana.eventBus.publish('ready', context.element.querySelector('#element'));
          `,
          renderMode: RenderMode.EVERY_ROW,
        },
        timeRange: {} as any,
        timeZone: '',
        replaceVariables,
        eventBus: eventBus as any,
      };

      await act(async () => render(<Text {...props} />));

      expect(eventBus.publish).toHaveBeenCalledWith('ready', expect.any(HTMLDivElement));
    });

    /**
     * notifyError and notifySuccess
     */
    it('Should run notify Events after content Render', async () => {
      const eventBus = {
        publish: jest.fn(() => {}),
      };
      const replaceVariables = jest.fn((str: string) => str);

      const publish = jest.fn();

      const appEvents = {
        publish,
      };

      jest.mocked(getAppEvents).mockImplementation(() => appEvents as any); // we need only these options

      const props: Props = {
        data: {} as any,
        options: {
          ...DEFAULT_OPTIONS,
          defaultContent: '<div id="element"></div>',
          afterRender: `
          context.grafana.notifyError(['error']);
          context.grafana.notifySuccess(['success'])
          `,
          renderMode: RenderMode.EVERY_ROW,
        },
        timeRange: {} as any,
        timeZone: '',
        replaceVariables,
        eventBus: eventBus as any,
      };

      await act(async () => render(<Text {...props} />));
      expect(publish).toHaveBeenCalledTimes(2);
      expect(publish).toHaveBeenCalledWith({
        type: AppEvents.alertError.name,
        payload: ['error'],
      });
      expect(publish).toHaveBeenCalledWith({
        type: AppEvents.alertSuccess.name,
        payload: ['success'],
      });
    });

    /**
     * context.grafana.refresh
     */
    it('Should run refresh after content Render', async () => {
      const mockRefreshDashboard = jest.fn(() => {
        publish({
          payload: {
            refreshAll: true,
          },
          type: 'variables-changed',
        });
      });

      (useDashboardRefresh as jest.Mock).mockReturnValue(mockRefreshDashboard);

      const eventBus = {
        publish: jest.fn(() => {}),
      };

      const replaceVariables = jest.fn((str: string) => str);

      const publish = jest.fn();

      const appEvents = {
        publish,
      };

      jest.mocked(getAppEvents).mockImplementation(() => appEvents as any); // we need only these options

      const props: Props = {
        data: {} as any,
        options: {
          ...DEFAULT_OPTIONS,
          defaultContent: '<div id="element"></div>',
          afterRender: `
          context.grafana.refresh();
          `,
          renderMode: RenderMode.EVERY_ROW,
        },
        timeRange: {} as any,
        timeZone: '',
        replaceVariables,
        eventBus: eventBus as any,
      };

      await act(async () => render(<Text {...props} />));

      expect(mockRefreshDashboard).toHaveBeenCalledTimes(1);
      expect(publish).toHaveBeenCalledTimes(1);
      expect(publish).toHaveBeenCalledWith({
        payload: {
          refreshAll: true,
        },
        type: 'variables-changed',
      });
    });

    /**
     * context.grafana.eventBus.publish('destroy')
     */
    it('Should call unsubscribe function', async () => {
      const eventBus = {
        publish: jest.fn(() => {}),
      };
      const replaceVariables = jest.fn((str: string) => str);

      const props: Props = {
        data: {} as any,
        options: {
          ...DEFAULT_OPTIONS,
          defaultContent: '<div id="element"></div>',
          afterRender: `
          return () => context.grafana.eventBus.publish('destroy');
          `,
          renderMode: RenderMode.EVERY_ROW,
        },
        timeRange: {} as any,
        timeZone: '',
        replaceVariables,
        eventBus: eventBus as any,
      };

      const { rerender } = await act(async () => render(<Text {...props} />));

      /**
       * Re-render with updated props
       */
      await act(async () => rerender(<Text {...props} timeZone="123" />));

      expect(eventBus.publish).toHaveBeenCalledWith('destroy');
    });
  });

  describe('Before Render Function', () => {
    /**
     * notify Events
     */
    it('Should run notify Events', async () => {
      const eventBus = {
        publish: jest.fn(() => {}),
      };
      const replaceVariables = jest.fn((str: string) => str);

      const publish = jest.fn();
      const appEvents = {
        publish,
      };

      jest.mocked(getAppEvents).mockImplementation(() => appEvents as any); // we need only these options

      const props: Props = {
        data: {} as any,
        options: {
          ...DEFAULT_OPTIONS,
          defaultContent: '<div id="element"></div>',
          helpers: `
          context.grafana.notifyError(['error']);
          context.grafana.notifySuccess(['success'])
          `,
          renderMode: RenderMode.EVERY_ROW,
        },
        timeRange: {} as any,
        timeZone: '',
        replaceVariables,
        eventBus: eventBus as any,
      };

      await act(async () => render(<Text {...props} />));

      expect(publish).toHaveBeenCalledTimes(2);
      expect(publish).toHaveBeenCalledWith({
        type: AppEvents.alertError.name,
        payload: ['error'],
      });
      expect(publish).toHaveBeenCalledWith({
        type: AppEvents.alertSuccess.name,
        payload: ['success'],
      });
    });

    /**
     * context.grafana.refresh
     */
    it('Should run refresh event before render', async () => {
      const mockRefreshDashboard = jest.fn(() => {
        publish({
          payload: {
            refreshAll: true,
          },
          type: 'variables-changed',
        });
      });

      (useDashboardRefresh as jest.Mock).mockReturnValue(mockRefreshDashboard);

      const eventBus = {
        publish: jest.fn(() => {}),
      };

      const replaceVariables = jest.fn((str: string) => str);

      const publish = jest.fn();
      const appEvents = {
        publish,
      };

      jest.mocked(getAppEvents).mockImplementation(() => {
        return appEvents as any;
      }); // we need only these options

      const props: Props = {
        data: {} as any,
        options: {
          ...DEFAULT_OPTIONS,
          defaultContent: '<div id="element"></div>',
          helpers: `
          context.grafana.refresh();
          `,
          renderMode: RenderMode.EVERY_ROW,
        },
        timeRange: {} as any,
        timeZone: '',
        replaceVariables,
        eventBus: eventBus as any,
      };

      await act(async () => render(<Text {...props} />));
      expect(mockRefreshDashboard).toHaveBeenCalledTimes(1);
      expect(publish).toHaveBeenCalledTimes(1);
      expect(publish).toHaveBeenCalledWith({
        payload: {
          refreshAll: true,
        },
        type: 'variables-changed',
      });
    });
  });

  it('Should apply status field', async () => {
    const replaceVariables = jest.fn((str: string) => str);
    const dataFrame = toDataFrame({
      fields: [
        {
          name: 'value',
          type: FieldType.number,
          display: (value: number) => ({ color: value > 80 ? 'red' : 'green' }),
          values: [80, 90],
        },
      ],
    });

    const props: Props = {
      data: {} as any,
      frame: dataFrame,
      options: {
        ...DEFAULT_OPTIONS,
        status: 'value',
        content: '<div style="background-color: {{statusColor}};" data-testid="status">{{status}}</div>',
        defaultContent: 'Test default content',
        renderMode: RenderMode.EVERY_ROW,
      },
      timeRange: {} as any,
      timeZone: '',
      replaceVariables,
      eventBus: {} as any,
    };

    await act(async () => render(<Text {...props} />));

    const statuses = screen.getAllByTestId('status');
    expect(statuses[0]).toHaveStyle({ backgroundColor: 'green' });
    expect(statuses[1]).toHaveStyle({ backgroundColor: 'red' });
  });

  it('Should apply status in row', async () => {
    const replaceVariables = jest.fn((str: string) => str);
    const dataFrame = toDataFrame({
      fields: [
        {
          name: 'number',
          type: FieldType.number,
          display: (value: number) => ({ color: value > 80 ? 'red' : 'green' }),
          values: [90],
        },
        {
          name: 'test',
          type: FieldType.number,
          display: (value: number) => ({ color: value > 80 ? 'red' : 'green' }),
          values: [70],
        },
        {
          name: 'value',
          type: FieldType.number,
          display: (value: number) => ({ color: value > 80 ? 'red' : 'green' }),
          values: [60],
        },
      ],
    });

    const props: Props = {
      data: {} as any,
      frame: dataFrame,
      options: {
        ...DEFAULT_OPTIONS,
        status: 'number',
        content: '<div style="background-color: {{statusColor}};" data-testid="status">{{test}}{{number}}</div>',
        defaultContent: 'Test default content',
        renderMode: RenderMode.EVERY_ROW,
      },
      timeRange: {} as any,
      timeZone: '',
      replaceVariables,
      eventBus: {} as any,
    };

    await act(async () => render(<Text {...props} />));

    const statuses = screen.getAllByTestId('status');

    expect(statuses[0]).toHaveStyle({ backgroundColor: 'red' });
  });

  it('Should apply status from specific field', async () => {
    const replaceVariables = jest.fn((str: string) => str);
    const dataFrame = toDataFrame({
      fields: [
        {
          name: 'test',
          type: FieldType.number,
          display: (value: number) => ({ color: value > 80 ? 'red' : 'green' }),
          values: [70, 75],
        },
        {
          name: 'value',
          type: FieldType.number,
          display: (value: number) => ({ color: value > 80 ? 'red' : 'green' }),
          values: [60, 65],
        },
        {
          name: 'number',
          type: FieldType.number,
          display: (value: number) => ({ color: 'yellow' }),
          values: [90, 95],
        },
      ],
    });

    const props: Props = {
      data: {} as any,
      frame: dataFrame,
      options: {
        ...DEFAULT_OPTIONS,
        status: 'value',
        content:
          '<div style="background-color: {{fieldStatusColor "number" 0}}" data-testid="status-color">{{statusColor}}</div>',
        defaultContent: 'Test default content',
        renderMode: RenderMode.EVERY_ROW,
      },
      timeRange: {} as any,
      timeZone: '',
      replaceVariables,
      eventBus: {} as any,
    };

    await act(async () => render(<Text {...props} />));

    const statuses = screen.getAllByTestId('status-color');

    expect(statuses[0]).toHaveStyle({ backgroundColor: 'yellow' });
    expect(statuses[0]).toHaveTextContent('green');
  });

  it('Should apply status from specific field and value', async () => {
    const replaceVariables = jest.fn((str: string) => str);
    const dataFrame = toDataFrame({
      fields: [
        {
          name: 'test',
          type: FieldType.number,
          display: (value: number) => ({ color: value > 80 ? 'red' : 'green' }),
          values: [70, 75],
        },
        {
          name: 'value',
          type: FieldType.number,
          display: (value: number) => ({ color: value > 80 ? 'red' : 'green' }),
          values: [60, 65],
        },
        {
          name: 'number',
          type: FieldType.number,
          display: (value: number) => ({ color: value >= 95 ? 'yellow' : 'dark-yellow' }),
          values: [95, 90],
        },
      ],
    });

    const props: Props = {
      data: {} as any,
      frame: dataFrame,
      options: {
        ...DEFAULT_OPTIONS,
        status: 'value',
        content:
          '<div style="background-color: {{fieldStatusColor "number" 1 }}" data-testid="status-color">{{number}}</div>',
        defaultContent: 'Test default content',
        renderMode: RenderMode.EVERY_ROW,
      },
      timeRange: {} as any,
      timeZone: '',
      replaceVariables,
      eventBus: {} as any,
    };

    await act(async () => render(<Text {...props} />));

    const statuses = screen.getAllByTestId('status-color');

    expect(statuses[0]).toHaveStyle({ backgroundColor: 'dark-yellow' });
  });

  it('Should apply status from specific field for all rows', async () => {
    const replaceVariables = jest.fn((str: string) => str);
    const dataFrame = toDataFrame({
      fields: [
        {
          name: 'test',
          type: FieldType.number,
          display: (value: number) => ({ color: value > 80 ? 'red' : 'green' }),
          values: [70, 75],
        },
        {
          name: 'value',
          type: FieldType.number,
          display: (value: number) => ({ color: value > 80 ? 'red' : 'green' }),
          values: [60, 65],
        },
        {
          name: 'number',
          type: FieldType.number,
          display: (value: number) => ({ color: 'yellow' }),
          values: [90, 95],
        },
      ],
    });

    const props: Props = {
      data: {} as any,
      frame: dataFrame,
      options: {
        ...DEFAULT_OPTIONS,
        status: 'value',
        content: `<div >
                    {{#each data}}
                      <div style="background-color: {{fieldStatusColor "number" }}" data-testid="status-color">Specific field</div>
                      <div style="background-color: {{statusColor}}" data-testid="color">Status color</div>
                      {{time}}{{series}} 
                    {{/each}}
                  </div>`,
        defaultContent: 'Test default content',
        renderMode: RenderMode.ALL_ROWS,
      },
      timeRange: {} as any,
      timeZone: '',
      replaceVariables,
      eventBus: {} as any,
    };

    await act(async () => render(<Text {...props} />));

    const fieldStatuses = screen.getAllByTestId('status-color');
    const statuses = screen.getAllByTestId('color');

    expect(fieldStatuses[0]).toHaveStyle({ backgroundColor: 'yellow' });
    expect(statuses[0]).toHaveStyle({ backgroundColor: 'green' });
  });

  it('Should return empty color apply if field not specified for data frame', async () => {
    const replaceVariables = jest.fn((str: string) => str);
    const dataFrame = toDataFrame({
      fields: [
        {
          name: 'test',
          type: FieldType.number,
          display: (value: number) => ({ color: value > 80 ? 'red' : 'green' }),
          values: [70, 75],
        },
        {
          name: 'value',
          type: FieldType.number,
          display: (value: number) => ({ color: value > 80 ? 'red' : 'green' }),
          values: [60, 65],
        },
        {
          name: 'number',
          type: FieldType.number,
          display: (value: number) => ({ color: 'yellow' }),
          values: [90, 95],
        },
      ],
    });

    const props: Props = {
      data: {} as any,
      frame: dataFrame,
      options: {
        ...DEFAULT_OPTIONS,
        status: 'value',
        content:
          '<div style="background-color: {{fieldStatusColor "empty" }}" data-testid="status-color">{{number}}</div>',
        defaultContent: 'Test default content',
        renderMode: RenderMode.EVERY_ROW,
      },
      timeRange: {} as any,
      timeZone: '',
      replaceVariables,
      eventBus: {} as any,
    };

    await act(async () => render(<Text {...props} />));

    const statuses = screen.getAllByTestId('status-color');

    expect(statuses[0]).toHaveStyle({ backgroundColor: '' });
  });

  it('Should return empty color apply if field not specified for all data mode', async () => {
    const props: Props = {
      data: {
        series: [
          toDataFrame({
            fields: [
              {
                type: FieldType.string,
                name: 'text',
                display: (value: number) => ({ color: 'yellow' }),
                values: ['hello', 'hello2'],
              },
            ],
          }),
        ],
      } as any,
      frame: {
        fields: [],
        length: 2,
      },
      options: {
        ...DEFAULT_OPTIONS,
        content:
          '<div style="background-color: {{fieldStatusColor "text" }}" data-testid="status-color">Test content</div>',
        defaultContent: 'Test default content',
        renderMode: RenderMode.DATA,
      },
      timeRange: {} as any,
      timeZone: '',
      replaceVariables: (str: string) => str,
      eventBus: {} as any,
    };

    await act(async () => render(<Text {...props} />));
    const statuses = screen.getAllByTestId('status-color');

    expect(statuses[0]).toHaveStyle({ backgroundColor: '' });
    expect(screen.getAllByText('Test content')).toHaveLength(1);
  });

  it('Should apply formatted value', async () => {
    const replaceVariables = jest.fn((str: string) => str);
    const dataFrame = toDataFrame({
      fields: [
        {
          name: 'Text',
          type: FieldType.string,
          display: (value: number) => ({
            color: '#E02F44',
            numeric: NaN,
            percent: 0,
            prefix: undefined as string | undefined,
            suffix: undefined as string | undefined,
            text: 'Value 1',
          }),
          values: ['Value 1'],
        },
        {
          name: 'Value',
          type: FieldType.number,
          display: (value: number) => ({
            color: '#E02F44',
            numeric: 1048576,
            percent: 1,
            prefix: undefined as string | undefined,
            suffix: ' MB',
            text: '1.05',
          }),
          values: [1048576],
          config: {
            unit: 'mb',
          },
        },
      ],
    });

    const props: Props = {
      data: {} as any,
      frame: dataFrame,
      options: {
        ...DEFAULT_OPTIONS,
        status: 'number',
        content: '<div data-testid="status">{{Text}} {{Value}}</div>',
        defaultContent: 'Test default content',
        renderMode: RenderMode.EVERY_ROW,
      },
      timeRange: {} as any,
      timeZone: '',
      replaceVariables,
      eventBus: {} as any,
    };

    await act(async () => render(<Text {...props} />));
    expect(screen.getAllByTestId(TEST_IDS.text.content)[0]).toBeInTheDocument();
    expect(screen.getAllByTestId(TEST_IDS.text.content)[0]).toHaveTextContent('Value 1 1.05 MB');
  });

  it('Should apply value instead formatted value if display unavailable', async () => {
    const replaceVariables = jest.fn((str: string) => str);
    const dataFrame = toDataFrame({
      fields: [
        {
          name: 'Text',
          type: FieldType.string,
          values: ['Value 1'],
        },
        {
          name: 'Value',
          type: FieldType.number,
          values: [1048576],
        },
      ],
    });

    const props: Props = {
      data: {} as any,
      frame: dataFrame,
      options: {
        ...DEFAULT_OPTIONS,
        status: 'number',
        content: '<div data-testid="status">{{Text}} {{Value}}</div>',
        defaultContent: 'Test default content',
        renderMode: RenderMode.EVERY_ROW,
      },
      timeRange: {} as any,
      timeZone: '',
      replaceVariables,
      eventBus: {} as any,
    };

    await act(async () => render(<Text {...props} />));
    expect(screen.getAllByTestId(TEST_IDS.text.content)[0]).toBeInTheDocument();
    expect(screen.getAllByTestId(TEST_IDS.text.content)[0]).toHaveTextContent('Value 1 1048576');
  });

  /**
   * Render every row
   */
  it('Should render content twice when there is a dataframe and every row enabled', async () => {
    const nameData: string[] = ['Erik', 'Natasha'];
    const ageData: number[] = [42, 38];
    const props: Props = {
      data: {} as any,
      frame: toDataFrame({
        fields: [
          {
            name: 'name',
            type: FieldType.string,
            config: {},
            values: nameData,
          },
          {
            name: 'age',
            type: FieldType.number,
            config: {},
            values: ageData,
          },
        ],
      }),
      options: {
        ...DEFAULT_OPTIONS,
        content: 'Test content',
        defaultContent: 'Test default content',
        renderMode: RenderMode.EVERY_ROW,
      },
      timeRange: {} as any,
      timeZone: '',
      replaceVariables: (str: string) => str,
      eventBus: {} as any,
    };

    await act(async () => render(<Text {...props} />));

    expect(screen.getAllByTestId(TEST_IDS.text.content)[0]).toBeInTheDocument();
    expect(screen.getAllByTestId(TEST_IDS.text.content)[0]).toHaveTextContent('Test content');
    expect(screen.getAllByTestId(TEST_IDS.text.content)[1]).toBeInTheDocument();
    expect(screen.getAllByTestId(TEST_IDS.text.content)[1]).toHaveTextContent('Test content');
  });

  /**
   * Render all rows
   */
  it('Should render content once when there is a dataframe and all rows enabled', async () => {
    const props: Props = {
      data: {} as any,
      frame: {
        fields: [],
        length: 2,
      },
      options: {
        ...DEFAULT_OPTIONS,
        content: 'Test content',
        defaultContent: 'Test default content',
        renderMode: RenderMode.ALL_ROWS,
      },
      timeRange: {} as any,
      timeZone: '',
      replaceVariables: (str: string) => str,
      eventBus: {} as any,
    };

    await act(async () => render(<Text {...props} />));

    expect(screen.getAllByText('Test content')).toHaveLength(1);
  });

  /**
   * Render all data
   */
  it('Should render content once when there is a dataframe and all data enabled', async () => {
    const props: Props = {
      data: {
        series: [
          toDataFrame({
            fields: [
              {
                type: FieldType.string,
                name: 'text',
                values: ['hello', 'hello2'],
              },
            ],
          }),
        ],
      } as any,
      frame: {
        fields: [],
        length: 2,
      },
      options: {
        ...DEFAULT_OPTIONS,
        content: 'Test content',
        defaultContent: 'Test default content',
        renderMode: RenderMode.DATA,
      },
      timeRange: {} as any,
      timeZone: '',
      replaceVariables: (str: string) => str,
      eventBus: {} as any,
    };

    await act(async () => render(<Text {...props} />));

    expect(screen.getAllByText('Test content')).toHaveLength(1);
  });

  /**
   * Render properties
   */
  it('Should render properties of dataframe in template', async () => {
    const nameData: string[] = ['Erik', 'Natasha'];
    const ageData: number[] = [42, 38];

    const template = `| Name | Age |
  | ---- | --- |
  {{#each data}}
  | {{name}} | {{age}} |
  {{/each}}
  `;

    const props: Props = {
      data: {} as any,
      frame: toDataFrame({
        fields: [
          {
            name: 'name',
            type: FieldType.string,
            config: {},
            values: nameData,
          },
          {
            name: 'age',
            type: FieldType.number,
            config: {},
            values: ageData,
          },
        ],
        length: 2,
      }),
      options: {
        ...DEFAULT_OPTIONS,
        content: template,
        defaultContent: 'Test default content',
        renderMode: RenderMode.ALL_ROWS,
      },
      timeRange: {} as any,
      timeZone: '',
      replaceVariables: (str: string) => str,
      eventBus: {} as any,
    };

    await act(async () => render(<Text {...props} />));

    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Erik');
    expect(screen.getAllByRole('row')[2]).toHaveTextContent('Natasha');
  });

  /**
   * Render all data properties
   */
  it('Should render properties of all panel data in template', async () => {
    const nameData: string[] = ['Erik', 'Natasha'];
    const ageData: number[] = [42, 38];

    const template = `| Name | Age |
  | ---- | --- |
  {{#each data.[0]}}
  {{name}} - {{#with (lookup ../data.[1] @index)}}{{age}}{{/with}}
  {{/each}}
  `;

    const frames = [
      toDataFrame({
        fields: [
          {
            name: 'name',
            type: FieldType.string,
            config: {},
            values: nameData,
          },
        ],
        length: 2,
      }),
      toDataFrame({
        fields: [
          {
            name: 'age',
            type: FieldType.number,
            config: {},
            values: ageData,
          },
        ],
        length: 2,
      }),
    ];

    const props: Props = {
      data: {
        series: frames,
      } as any,
      frame: frames[0],
      options: {
        ...DEFAULT_OPTIONS,
        content: template,
        defaultContent: 'Test default content',
        renderMode: RenderMode.DATA,
      },
      timeRange: {} as any,
      timeZone: '',
      replaceVariables: (str: string) => str,
      eventBus: {} as any,
    };

    await act(async () => render(<Text {...props} />));

    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Erik');
    expect(screen.getAllByRole('row')[2]).toHaveTextContent('Natasha');
  });
});
