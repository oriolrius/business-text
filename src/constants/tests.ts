/**
 * Tests Identifiers
 */
export const TEST_IDS = {
  panel: {
    root: 'data-testid panel',
    fieldFrame: 'data-testid panel field-frame',
  },
  text: {
    content: 'data-testid text content',
    error: 'data-testid text error',
    errorContent: 'data-testid text error-content',
  },
  textEditor: {
    root: 'data-testid text-editor',
  },
  resourcesEditor: {
    buttonAddNew: 'data-testid resources-editor button-add-new',
    buttonRemove: 'data-testid resources-editor button-remove',
    itemLabel: (name: string) => `data-testid resources-editor item-label-${name}`,
    itemContent: (name: string) => `data-testid resources-editor item-content-${name}`,
    fieldUrl: 'data-testid resources-editor field-url',
    newItem: 'data-testid resources-editor new-item',
    newItemName: 'data-testid resources-editor new-item-name',
  },
  partialsEditor: {
    buttonAddNew: 'data-testid partials-editor button-add-new',
    buttonRemove: 'data-testid partials-editor button-remove',
    buttonRefresh: 'data-testid partials-editor button-refresh',
    buttonDownloadContent: 'data-testid partials-editor button-download-content',
    itemLabel: (name: string) => `data-testid partials-editor item-label-${name}`,
    itemContent: (name: string) => `data-testid partials-editor item-content-${name}`,
    fieldUrl: 'data-testid partials-editor field-url',
    fieldName: 'data-testid partials-editor field-name',
    fieldLocalContent: 'data-testid partials-editor field-local-content',
    fieldLocalCopy: 'data-testid partials-editor field-local-copy',
    fieldContent: 'data-testid partials-editor field-content',
    checkboxLocalCopy: 'data-testid partials-editor checkbox-local-copy',
    monacoEditor: 'data-testid partials-editor monaco-editor',
    newItem: 'data-testid partials-editor new-item',
    newItemURL: 'data-testid partials-editor new-item-url',
    newItemName: 'data-testid partials-editor new-item-name',
  },
};
