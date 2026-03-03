import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router';
import { Button, Input, Spin, message, Dropdown } from 'antd';
import { SaveOutlined, CloseOutlined, MoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import PageLayout from '../components/PageLayout';
import ConfluenceArticleLayout, { ChangesSavedBadge } from '../components/kb/ConfluenceArticleLayout';
import { kbGet, kbCreate, kbUpdate, type KBArticle } from '../api/client';
import { slugify } from '../utils/slugify';
import type { KBEditorRef } from '../components/kb/KBEditor';

const KBEditor = lazy(() => import('../components/kb/KBEditor').then((m) => ({ default: m.default })));

const SPACE = 'main';
const SPACE_NAME = 'Knowledge base space';

export default function KBArticleEdit() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  // /kb/new has no :id param (literal path), so detect by pathname
  const isNew = location.pathname === '/kb/new' || id === 'new';
  const [article, setArticle] = useState<KBArticle | null>(isNew ? { id: 0, title: '', slug: '', summary: '', spaceKey: SPACE, createdAt: '', updatedAt: '' } : null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const editorRef = useRef<KBEditorRef>(null);

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    if (!id) return;
    kbGet(Number(id))
      .then((r) => {
        setArticle(r.data);
        setTitle(r.data.title);
        setSlug(r.data.slug);
        setSummary(r.data.summary ?? '');
      })
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (isNew) setSlug(slugify(v));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      message.warning('Title is required');
      return;
    }
    const content = editorRef.current?.getJSON() ?? undefined;
    setSaving(true);
    setSaved(false);
    try {
      if (isNew) {
        const res = await kbCreate({
          title: title.trim(),
          slug: slug.trim() || slugify(title),
          summary: summary.trim(),
          content: content ?? undefined,
          parentId: null,
          spaceKey: SPACE,
        });
        message.success('Article created');
        navigate(`/kb/${res.data.id}`);
      } else if (article?.id) {
        await kbUpdate(article.id, {
          title: title.trim(),
          slug: slug.trim() || slugify(title),
          summary: summary.trim(),
          content: content ?? undefined,
          parentId: article.parentId ?? null,
          spaceKey: SPACE,
        });
        message.success('Saved');
        setSaved(true);
        setArticle((prev) => prev ? { ...prev, title: title.trim(), slug: slug.trim() || slugify(title), summary: summary.trim() } : null);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      message.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !isNew) {
    return (
      <PageLayout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      </PageLayout>
    );
  }

  if (!isNew && !article) {
    return (
      <PageLayout>
        <div style={{ padding: 24 }}>
          <p>Article not found.</p>
          <Link to="/kb">Back to Knowledge Base</Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <ConfluenceArticleLayout
        breadcrumbs={[
          { title: SPACE_NAME, path: '/kb' },
          { title: 'Pages' },
          { title: isNew ? 'New page' : article?.title ?? 'Edit' },
        ]}
        statusTag="DRAFT"
        titleArea={
          <Input
            placeholder="Page title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            bordered={false}
            style={{ fontSize: 28, fontWeight: 600, padding: 0 }}
          />
        }
        descriptionArea={
          <Input.TextArea
            placeholder="Describe when someone would need this information. For example 'when connecting to wi-fi for the first time'."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            bordered={false}
            autoSize={{ minRows: 2, maxRows: 4 }}
            style={{ color: '#6b778c', fontSize: 14, padding: 0, resize: 'none' }}
          />
        }
        footerLeft={saved ? <ChangesSavedBadge /> : null}
        footerRight={
          <>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
              Publish
            </Button>
            <Button icon={<CloseOutlined />} onClick={() => navigate(isNew ? '/kb' : `/kb/${id}`)}>
              Close
            </Button>
            <Dropdown
              menu={{
                items: [
                  { key: 'close', label: 'Close without publishing' },
                ] as MenuProps['items'],
              }}
              trigger={['click']}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </>
        }
      >
        <div style={{ border: '1px solid #dfe1e6', borderRadius: 4, background: '#fff', minHeight: 320 }}>
          <Suspense
            fallback={
              <div style={{ padding: 24, color: '#6b778c', fontSize: 13 }}>
                Loading editor…
              </div>
            }
          >
            <KBEditor
              ref={editorRef}
              initialContent={article?.content as Record<string, unknown> ?? undefined}
              editable
              placeholder="Add the steps involved. You can add images to each step."
            />
          </Suspense>
        </div>
      </ConfluenceArticleLayout>
    </PageLayout>
  );
}
