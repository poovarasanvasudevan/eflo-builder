/** Stub: Atlaskit renderer was removed. Use KBEditor in readonly mode for rendering. */
import type { ADFDocument } from './AtlaskitKBEditor';

interface AtlaskitKBRendererProps {
  document: ADFDocument | null | undefined;
}

export function AtlaskitKBRenderer({ document: _doc }: AtlaskitKBRendererProps) {
  return (
    <div className="text-sm text-[#5e6c84]">
      Use KBEditor in readonly mode to render content.
    </div>
  );
}

export default AtlaskitKBRenderer;
