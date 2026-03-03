import { IntlProvider } from 'react-intl';
import { Editor } from '@atlaskit/editor-core';

export type ADFDocument = Record<string, unknown>;

const defaultDoc: ADFDocument = {
  type: 'doc',
  version: 1,
  content: [],
};

export interface EditorActionsLike {
  getValue: () => Promise<ADFDocument | undefined>;
}

interface AtlaskitKBEditorProps {
  initialContent?: ADFDocument | null;
  onEditorReady?: (actions: EditorActionsLike) => void;
  onSave?: () => void;
}

export function AtlaskitKBEditor({
  initialContent,
  onEditorReady,
  onSave,
}: AtlaskitKBEditorProps) {
  const doc = initialContent && Object.keys(initialContent).length > 0 ? initialContent : defaultDoc;

  return (
    <IntlProvider locale="en" messages={{}}>
      <div className="atlaskit-kb-editor" style={{ minHeight: 320 }}>
        <Editor
          appearance="full-page"
          defaultValue={doc}
          onSave={onSave}
          onEditorReady={onEditorReady}
        />
      </div>
    </IntlProvider>
  );
}

export default AtlaskitKBEditor;
