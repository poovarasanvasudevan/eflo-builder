import { Link } from 'react-router';
import Lozenge from '@atlaskit/lozenge';
import { Icons } from '../ui/Icons';

interface ConfluenceArticleLayoutProps {
  /** Breadcrumb items: e.g. [{ title: 'KB', path: '/kb' }, { title: 'Pages' }, { title: 'Article title' }] */
  breadcrumbs: { title: React.ReactNode; path?: string }[];
  /** e.g. 'DRAFT' or null */
  statusTag?: string | null;
  /** Right side of breadcrumb bar: share/collaborators, etc. */
  headerActions?: React.ReactNode;
  /** Main title (editable in edit mode, static in view) */
  titleArea: React.ReactNode;
  /** Description/summary placeholder or content */
  descriptionArea: React.ReactNode;
  /** Body: Atlaskit editor or renderer */
  children: React.ReactNode;
  /** Footer left: e.g. "Changes saved" with checkmark */
  footerLeft?: React.ReactNode;
  /** Footer right: Publish, Close, more menu */
  footerRight?: React.ReactNode;
}

export default function ConfluenceArticleLayout({
  breadcrumbs,
  statusTag,
  headerActions,
  titleArea,
  descriptionArea,
  children,
  footerLeft,
  footerRight,
}: ConfluenceArticleLayoutProps) {
  return (
    <div className="confluence-article-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Contextual nav & status bar (below app header) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          padding: '8px 16px',
          borderBottom: '1px solid #dfe1e6',
          background: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {breadcrumbs.map((b, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6b778c' }}>
              {i > 0 && <span style={{ margin: '0 4px', color: '#dfe1e6' }}>/</span>}
              {b.path ? <Link to={b.path} style={{ color: '#0052cc' }}>{b.title}</Link> : b.title}
            </span>
          ))}
          {statusTag && (
            <span className="ml-2">
              <Lozenge appearance="default">{statusTag}</Lozenge>
            </span>
          )}
        </div>
        {headerActions}
      </div>

      {/* Title block */}
      <div style={{ padding: '24px 24px 8px', maxWidth: 900 }}>
        {titleArea}
      </div>

      {/* Description */}
      <div style={{ padding: '0 24px 16px', maxWidth: 900 }}>
        {descriptionArea}
      </div>

      {/* Editor/Renderer body */}
      <div style={{ flex: 1, padding: '0 24px 24px', maxWidth: 900, minHeight: 280 }}>
        {children}
      </div>

      {/* Footer */}
      {(footerLeft || footerRight) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            borderTop: '1px solid #dfe1e6',
            background: '#fafafa',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b778c' }}>
            {footerLeft}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {footerRight}
          </div>
        </div>
      )}
    </div>
  );
}

export function ChangesSavedBadge() {
  return (
    <span className="flex items-center gap-1 text-[#36b37e]">
      <Icons.CheckCircle />
      <span>Changes saved</span>
    </span>
  );
}
