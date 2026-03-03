import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router';
import Button from '@atlaskit/button';
import Spinner from '@atlaskit/spinner';
import PageLayout from '../components/PageLayout';
import ConfluenceArticleLayout, { ChangesSavedBadge } from '../components/kb/ConfluenceArticleLayout';
import { kbGet, kbCreate, kbUpdate, type KBArticle } from '../api/client';
import { slugify } from '../utils/slugify';
import { useToast } from '../context/ToastContext';
import { Icons } from '../components/ui/Icons';
import type { KBEditorRef } from '../components/kb/KBEditor';

const KBEditor = lazy(() => import('../components/kb/KBEditor').then((m) => ({ default: m.default })));

const SPACE = 'main';
const SPACE_NAME = 'Knowledge base space';

export default function KBArticleEdit() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
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
      toast.warning('Title is required');
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
        toast.success('Article created');
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
        toast.success('Saved');
        setSaved(true);
        setArticle((prev) => prev ? { ...prev, title: title.trim(), slug: slug.trim() || slugify(title), summary: summary.trim() } : null);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !isNew) {
    return (
      <PageLayout>
        <div className="flex justify-center py-12">
          <Spinner size="large" />
        </div>
      </PageLayout>
    );
  }

  if (!isNew && !article) {
    return (
      <PageLayout>
        <div className="p-6">
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
          <input
            placeholder="Page title"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTitleChange(e.target.value)}
            className="w-full text-[28px] font-semibold p-0 border-0 bg-transparent outline-none"
          />
        }
        descriptionArea={
          <textarea
            placeholder="Describe when someone would need this information. For example 'when connecting to wi-fi for the first time'."
            value={summary}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSummary(e.target.value)}
            className="w-full text-sm text-[#6b778c] p-0 border-0 bg-transparent resize-none outline-none min-h-[52px]"
            rows={2}
          />
        }
        footerLeft={saved ? <ChangesSavedBadge /> : null}
        footerRight={
          <div className="flex items-center gap-2">
            <Button appearance="primary" isDisabled={saving} onClick={handleSave}>
              <span className="flex items-center gap-1">{saving ? 'Saving…' : <><Icons.Save /> Publish</>}</span>
            </Button>
            <Button appearance="subtle" onClick={() => navigate(isNew ? '/kb' : `/kb/${id}`)}>
              <span className="flex items-center gap-1"><Icons.Close /> Close</span>
            </Button>
          </div>
        }
      >
        <div className="border border-[#dfe1e6] rounded bg-white min-h-[320px]">
          <Suspense
            fallback={
              <div className="p-6 text-[#6b778c] text-[13px]">Loading editor…</div>
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
