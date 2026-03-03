/** Stub: Atlaskit editor-core was removed due to dependency conflicts. Use KBEditor (TipTap) instead. */
export type ADFDocument = Record<string, unknown>;

export interface EditorActionsLike {
  getValue: () => Promise<ADFDocument | undefined>;
}

interface AtlaskitKBEditorProps {
  initialContent?: ADFDocument | null;
  onEditorReady?: (actions: EditorActionsLike) => void;
  onSave?: () => void;
}

export function AtlaskitKBEditor(_props: AtlaskitKBEditorProps) {
  return (
    <div className="p-4 text-sm text-[#5e6c84] border border-[#dfe1e6] rounded">
      Rich editor (TipTap) is used for this app. For Atlaskit Editor, add @atlaskit/editor-core and restore this component.
    </div>
  );
}

export default AtlaskitKBEditor;
