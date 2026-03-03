import { IntlProvider } from 'react-intl';
import { ReactRenderer } from '@atlaskit/renderer';
import type { ADFDocument } from './AtlaskitKBEditor';

const defaultDoc: ADFDocument = {
  type: 'doc',
  version: 1,
  content: [],
};

interface AtlaskitKBRendererProps {
  document: ADFDocument | null | undefined;
}

export function AtlaskitKBRenderer({ document: doc }: AtlaskitKBRendererProps) {
  const document = doc && Object.keys(doc).length > 0 ? doc : defaultDoc;

  return (
    <IntlProvider locale="en" messages={{}}>
      <div className="atlaskit-kb-renderer" style={{ fontSize: 14, lineHeight: 1.6 }}>
        <ReactRenderer document={document} />
      </div>
    </IntlProvider>
  );
}

export default AtlaskitKBRenderer;
