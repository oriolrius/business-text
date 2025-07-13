import { AlertErrorPayload, AlertPayload, AppEvents, StandardEditorProps } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { Button, Checkbox, Icon, InlineField, InlineFieldRow, Input, useStyles2 } from '@grafana/ui';
import { AutosizeCodeEditor, Collapse } from '@volkovlabs/components';
import React, { useCallback, useEffect, useState } from 'react';
import {
  DragDropContext,
  Draggable,
  DraggingStyle,
  Droppable,
  DropResult,
  NotDraggingStyle,
} from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';

import { TEST_IDS } from '../../constants';
import { PanelOptions, PartialItemConfig } from '../../types';
import { fetchHtmlViaBackend, reorder } from '../../utils';
import { getStyles } from './ContentPartialsEditor.styles';

/**
 * Properties
 */
type Props = StandardEditorProps<PartialItemConfig[], PanelOptions>;

/**
 * Get Item Style
 */
const getItemStyle = (isDragging: boolean, draggableStyle: DraggingStyle | NotDraggingStyle | undefined) => ({
  /**
   * styles we need to apply on draggables
   */
  ...draggableStyle,
});

/**
 * Content Partials Editor
 */
export const ContentPartialsEditor: React.FC<Props> = ({ value, onChange }) => {
  /**
   * Styles and Theme
   */
  const styles = useStyles2(getStyles);

  /**
   * States
   */
  const [items, setItems] = useState<PartialItemConfig[]>(value || []);
  const [newItemUrl, setNewItemUrl] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemIsLocalCopy, setNewItemIsLocalCopy] = useState(false);
  const [collapseState, setCollapseState] = useState<Record<string, boolean>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [editorContent, setEditorContent] = useState<Record<string, string>>({});

  /**
   * Change Items
   */
  const onChangeItems = useCallback(
    (items: PartialItemConfig[]) => {
      setItems(items);
      onChange(items);
    },
    [onChange]
  );

  /**
   * Drag End
   */
  const onDragEnd = useCallback(
    (result: DropResult) => {
      /**
       * Dropped outside the list
       */
      if (!result.destination) {
        return;
      }

      onChangeItems(reorder(items, result.source.index, result.destination.index));
    },
    [items, onChangeItems]
  );

  /**
   * Toggle collapse state for item
   */
  const onToggleItem = useCallback((name: string) => {
    setCollapseState((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  }, []);

  /**
   * Change item
   */
  const onChangeItem = useCallback(
    (updatedItem: PartialItemConfig) => {
      onChangeItems(items.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
    },
    [items, onChangeItems]
  );

  /**
   * Remove item
   */
  const onRemoveItem = useCallback(
    (id: string) => {
      onChangeItems(items.filter((item) => item.id !== id));
    },
    [items, onChangeItems]
  );

  /**
   * Show success notification
   */
  const showSuccessNotification = useCallback((message: string) => {
    const appEvents = getAppEvents();
    appEvents.publish({
      type: AppEvents.alertSuccess.name,
      payload: [message] as AlertPayload,
    });
  }, []);

  /**
   * Show error notification
   */
  const showErrorNotification = useCallback((message: string) => {
    const appEvents = getAppEvents();
    appEvents.publish({
      type: AppEvents.alertError.name, 
      payload: [message] as AlertErrorPayload,
    });
  }, []);

  /**
   * Fetch and store content locally
   */
  const fetchContentLocally = useCallback(
    async (itemId: string, preserveEditorContent = false) => {
      // Always get the most current item from state
      const item = items.find(i => i.id === itemId);
      if (!item) {
        showErrorNotification('Item not found');
        return;
      }

      if (!item.url) {
        showErrorNotification('URL is required to fetch content');
        return;
      }

      setLoadingStates((prev) => ({ ...prev, [item.id]: true }));

      try {
        const result: { name: string; content: string } = await fetchHtmlViaBackend(item.url, item.name);
        
        // Check if we should preserve the current editor content
        const currentEditorContent = editorContent[item.id];
        const hasUnsavedChanges = currentEditorContent && currentEditorContent !== item.localContent;
        
        const updatedItem: PartialItemConfig = {
          ...item,
          isLocalCopy: true,
          localContent: (preserveEditorContent && hasUnsavedChanges) ? currentEditorContent : result.content,
        };

        onChangeItem(updatedItem);
        
        // Update the editor content state only if not preserving or no unsaved changes
        if (!preserveEditorContent || !hasUnsavedChanges) {
          setEditorContent(prev => ({ ...prev, [item.id]: result.content }));
        }
        
        showSuccessNotification(`Content downloaded successfully for "${item.name}" (via proxy)`);
      } catch (error) {
        // Capturem més detalls de l'error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : '';
        
        // Creem un contingut detallat amb informació de l'error
        const errorDetails = `<!-- ERROR DOWNLOADING CONTENT -->
<!-- URL: ${item.url} -->
<!-- Method: Grafana Proxy -->
<!-- Error: ${errorMessage} -->
<!-- Time: ${new Date().toISOString()} -->
<!-- Stack trace: 
${errorStack}
-->

<div style="color: red; padding: 20px; border: 1px solid red; background: #ffe6e6;">
  <h3>❌ Error downloading content</h3>
  <p><strong>URL:</strong> ${item.url}</p>
  <p><strong>Method:</strong> Grafana Proxy</p>
  <p><strong>Error:</strong> ${errorMessage}</p>
  <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
  
  <details>
    <summary>Technical Details</summary>
    <pre>${errorStack || 'No stack trace available'}</pre>
  </details>
  
  <p><em>💡 <strong>Proxy method failed.</strong> Check that the datasource "External Content Proxy" is configured correctly in Grafana and points to the correct base URL.</em></p>
  
  <p><em>You can try the "Refresh" button to retry the download.</em></p>
</div>`;

        // Guardem l'error com a contingut local perquè l'usuari pugui veure els detalls
        const updatedItem: PartialItemConfig = {
          ...item,
          isLocalCopy: true,
          localContent: errorDetails,
        };

        onChangeItem(updatedItem);
        setEditorContent(prev => ({ ...prev, [item.id]: errorDetails }));
        showErrorNotification(`Failed to download content for "${item.name}": ${errorMessage}`);
      } finally {
        setLoadingStates((prev) => ({ ...prev, [item.id]: false }));
      }
    },
    [items, editorContent, onChangeItem, showSuccessNotification, showErrorNotification]
  );

  /**
   * Add new item
   */
  const addNewItem = useCallback(() => {
    const newItem: PartialItemConfig = { 
      id: uuidv4(), 
      url: newItemUrl, 
      name: newItemName,
      isLocalCopy: newItemIsLocalCopy,
    };
    
    setNewItemUrl('');
    setNewItemName('');
    setNewItemIsLocalCopy(false);
    onChangeItems(items.concat([newItem]));
    onToggleItem(newItemName);
    
    // If local copy is enabled, fetch content immediately
    if (newItemIsLocalCopy) {
      // Use setTimeout to ensure the item is added to state first
      setTimeout(() => {
        fetchContentLocally(newItem.id);
      }, 100);
    }
  }, [items, newItemName, newItemUrl, newItemIsLocalCopy, onChangeItems, onToggleItem, fetchContentLocally]);

  /**
   * Toggle local copy mode
   */
  const onToggleLocalCopy = useCallback(
    (item: PartialItemConfig, isChecked: boolean) => {
      if (isChecked) {
        // Switch to local copy mode and fetch content
        fetchContentLocally(item.id);
      } else {
        // Switch back to remote mode
        const updatedItem: PartialItemConfig = {
          ...item,
          isLocalCopy: false,
          localContent: undefined,
        };
        onChangeItem(updatedItem);
      }
    },
    [fetchContentLocally, onChangeItem]
  );

  /**
   * Initialize editor content state when items change
   */
  useEffect(() => {
    const newEditorContent: Record<string, string> = {};
    items.forEach(item => {
      if (item.isLocalCopy && item.localContent && !editorContent[item.id]) {
        newEditorContent[item.id] = item.localContent;
      }
    });
    
    if (Object.keys(newEditorContent).length > 0) {
      setEditorContent(prev => ({ ...prev, ...newEditorContent }));
    }
  }, [items, editorContent]);

  /**
   * Auto-fetch missing local content on mount and when items change
   */
  useEffect(() => {
    const itemsNeedingContent = items.filter(
      item => item.isLocalCopy && !item.localContent && item.url && !loadingStates[item.id]
    );
    
    if (itemsNeedingContent.length > 0) {
      // Fetch content for items that need it
      itemsNeedingContent.forEach(item => {
        if (!loadingStates[item.id]) {
          fetchContentLocally(item.id);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, JSON.stringify(items.map(i => ({id: i.id, isLocalCopy: i.isLocalCopy, hasContent: !!i.localContent, url: i.url})))]);

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="groups-editor">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {items.map(({ url, id, name }, index) => (
                <Draggable key={id} draggableId={id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                      className={styles.group}
                    >
                      <Collapse
                        title={<div className={styles.groupHeader}>{`[${name}] ${url}`}</div>}
                        headerTestId={TEST_IDS.partialsEditor.itemLabel(url)}
                        contentTestId={TEST_IDS.partialsEditor.itemContent(url)}
                        actions={
                          <>
                            <Button
                              icon="trash-alt"
                              variant="secondary"
                              fill="text"
                              size="sm"
                              className={styles.removeButton}
                              onClick={() => {
                                onRemoveItem(id);
                              }}
                              data-testid={TEST_IDS.partialsEditor.buttonRemove}
                            />
                            <div className={styles.dragHandle} {...provided.dragHandleProps}>
                              <Icon name="draggabledots" className={styles.dragIcon} />
                            </div>
                          </>
                        }
                        isOpen={collapseState[id]}
                        onToggle={() => onToggleItem(id)}
                      >
                        <div>
                          <InlineFieldRow>
                            <InlineField grow label="URL">
                              <Input
                                value={url}
                                onChange={(event) => {
                                  const currentItem = items.find(item => item.id === id);
                                  onChangeItem({
                                    id,
                                    url: event.currentTarget.value,
                                    name,
                                    isLocalCopy: currentItem?.isLocalCopy,
                                    localContent: currentItem?.localContent,
                                  });
                                }}
                                data-testid={TEST_IDS.partialsEditor.fieldUrl}
                              />
                            </InlineField>
                            <InlineField grow label="Name">
                              <Input
                                value={name}
                                onChange={(event) => {
                                  const currentItem = items.find(item => item.id === id);
                                  onChangeItem({
                                    id,
                                    name: event.currentTarget.value,
                                    url,
                                    isLocalCopy: currentItem?.isLocalCopy,
                                    localContent: currentItem?.localContent,
                                  });
                                }}
                                data-testid={TEST_IDS.partialsEditor.fieldName}
                              />
                            </InlineField>
                          </InlineFieldRow>
                          
                          <InlineFieldRow>
                            <InlineField>
                              <Checkbox
                                checked={!!items.find(item => item.id === id)?.isLocalCopy}
                                onChange={(event) => {
                                  const currentItem = items.find(item => item.id === id);
                                  if (currentItem) {
                                    onToggleLocalCopy(currentItem, event.currentTarget.checked);
                                  }
                                }}
                                data-testid={TEST_IDS.partialsEditor.checkboxLocalCopy}
                              />
                            </InlineField>
                            <InlineField grow>
                              <span style={{ marginLeft: '8px', lineHeight: '32px' }}>Local Copy</span>
                            </InlineField>
                            {items.find(item => item.id === id)?.isLocalCopy && (
                              <InlineField>
                                <Button
                                  icon="sync"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    const currentItem = items.find(item => item.id === id);
                                    if (currentItem) {
                                      fetchContentLocally(currentItem.id, true);
                                    }
                                  }}
                                  disabled={loadingStates[id]}
                                  data-testid={TEST_IDS.partialsEditor.buttonRefresh}
                                >
                                  {loadingStates[id] ? 'Downloading...' : 'Refresh'}
                                </Button>
                              </InlineField>
                            )}
                          </InlineFieldRow>
                        </div>
                      </Collapse>
                      
                      {items.find(item => item.id === id)?.isLocalCopy && (
                        <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                          <InlineFieldRow>
                            <InlineField label="Local Content" grow>
                              <AutosizeCodeEditor
                                value={editorContent[id] ?? items.find(item => item.id === id)?.localContent ?? ''}
                                onChange={(value) => {
                                  const currentItem = items.find(item => item.id === id);
                                  if (currentItem) {
                                    // Update both editor content state and item state
                                    setEditorContent(prev => ({ ...prev, [id]: value }));
                                    const updatedItem: PartialItemConfig = {
                                      ...currentItem,
                                      localContent: value,
                                    };
                                    onChangeItem(updatedItem);
                                  }
                                }}
                                language="html"
                                showLineNumbers={true}
                                height="200px"
                                data-testid={TEST_IDS.partialsEditor.fieldContent}
                              />
                            </InlineField>
                          </InlineFieldRow>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <InlineFieldRow className={styles.newGroup} data-testid={TEST_IDS.partialsEditor.newItem}>
        <InlineField label="New Partial" grow>
          <Input
            placeholder="URL"
            value={newItemUrl}
            onChange={(event) => setNewItemUrl(event.currentTarget.value)}
            data-testid={TEST_IDS.partialsEditor.newItemURL}
          />
        </InlineField>
        <InlineField label="Name" grow>
          <Input
            placeholder="name"
            value={newItemName}
            onChange={(event) => setNewItemName(event.currentTarget.value)}
            data-testid={TEST_IDS.partialsEditor.newItemName}
          />
        </InlineField>

        <Button
          icon="plus"
          title="Add Partial"
          disabled={!newItemName || !newItemUrl}
          onClick={addNewItem}
          data-testid={TEST_IDS.partialsEditor.buttonAddNew}
        >
          Add
        </Button>
      </InlineFieldRow>
      
      <InlineFieldRow>
        <InlineField>
          <Checkbox
            checked={newItemIsLocalCopy}
            onChange={(event) => setNewItemIsLocalCopy(event.currentTarget.checked)}
            data-testid={TEST_IDS.partialsEditor.checkboxLocalCopy}
          />
        </InlineField>
        <InlineField grow>
          <span style={{ marginLeft: '8px', lineHeight: '32px' }}>Local Copy</span>
        </InlineField>
      </InlineFieldRow>
    </>
  );
};
