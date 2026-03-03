import { useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { useEditor, EditorContent, type Content } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import './KBEditor.css';

export interface KBEditorRef {
  getJSON: () => Record<string, unknown> | null;
  setContent: (content: Record<string, unknown> | null) => void;
}

interface KBEditorProps {
  initialContent?: Record<string, unknown> | null;
  editable?: boolean;
  placeholder?: string;
  onUpdate?: (json: Record<string, unknown>) => void;
}

const KBEditor = forwardRef<KBEditorRef, KBEditorProps>(function KBEditor(
  { initialContent, editable = true, placeholder = 'Start writing...', onUpdate },
  ref
) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: (initialContent as Content) ?? undefined,
    editable,
    editorProps: {
      attributes: {
        class: 'kb-editor-content',
      },
      handleDOMEvents: {
        focus: () => (document.querySelector('.kb-editor-wrap')?.classList.add('focused') ?? undefined),
        blur: () => (document.querySelector('.kb-editor-wrap')?.classList.remove('focused') ?? undefined),
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getJSON());
    },
  });

  const initRef = useRef(false);
  useEffect(() => {
    if (!editor || initRef.current) return;
    initRef.current = true;
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    if (initialContent != null && Object.keys(initialContent).length > 0) {
      editor.commands.setContent(initialContent as Content);
    } else if (editable) {
      editor.commands.setContent({ type: 'doc', content: [] });
    }
  }, [editor, editable]);

  useImperativeHandle(ref, () => ({
    getJSON: () => editor?.getJSON() ?? null,
    setContent: (content: Record<string, unknown> | null) => {
      if (content && Object.keys(content).length > 0) editor?.commands.setContent(content as Content);
      else editor?.commands.setContent({ type: 'doc', content: [] });
    },
  }), [editor]);

  if (!editor) {
    return <div className="kb-editor-wrap kb-editor-loading">Loading editor...</div>;
  }

  return (
    <div className={`kb-editor-wrap ${editable ? 'editable' : 'readonly'}`}>
      <EditorContent editor={editor} />
      {editable && !editor.getText() && (
        <div className="kb-editor-placeholder">{placeholder}</div>
      )}
    </div>
  );
});

export default KBEditor;
