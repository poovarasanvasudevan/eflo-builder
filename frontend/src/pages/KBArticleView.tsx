import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import Button from '@atlaskit/button';
import Spinner from '@atlaskit/spinner';
import PageLayout from '../components/PageLayout';
import ConfluenceArticleLayout from '../components/kb/ConfluenceArticleLayout';
import KBEditor from '../components/kb/KBEditor';
import { kbGet, kbDelete, type KBArticle } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Icons } from '../components/ui/Icons';

const SPACE_NAME = 'Knowledge base space';

export default function KBArticleView() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<KBArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!id) return;
    kbGet(Number(id))
      .then((r) => setArticle(r.data))
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    setMenuOpen(false);
    if (!article || !confirm(`Delete "${article.title}"?`)) return;
    kbDelete(article.id)
      .then(() => {
        toast.success('Article deleted');
        window.location.href = '/kb';
      })
      .catch(() => toast.error('Failed to delete'));
  };

  if (loading || !id) {
    return (
      <PageLayout>
        <div className="flex justify-center py-12">
          <Spinner size="large" />
        </div>
      </PageLayout>
    );
  }

  if (!article) {
    return (
      <PageLayout>
        <div className="p-6 text-center">
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
          { title: article.title },
        ]}
        headerActions={
          <div className="flex items-center gap-2">
            <Link to={`/kb/${article.id}/edit`}>
              <Button appearance="primary">
                <span className="flex items-center gap-1"><Icons.Edit /> Edit</span>
              </Button>
            </Link>
            <div className="relative">
              <Button appearance="subtle" onClick={() => setMenuOpen((o) => !o)}>
                <Icons.More />
              </Button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" role="presentation" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 rounded bg-white border border-[#dfe1e6] shadow-lg py-1 min-w-[120px]">
                    <button type="button" className="block w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-black/5" onClick={handleDelete}>
                      <span className="flex items-center gap-2"><Icons.Delete /> Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        }
        titleArea={<h1 className="m-0 text-[28px] font-semibold">{article.title}</h1>}
        descriptionArea={article.summary ? <p className="m-0 text-[#6b778c] text-sm">{article.summary}</p> : null}
      >
        <div className="min-h-[120px]">
          <KBEditor
            initialContent={article.content as Record<string, unknown> ?? undefined}
            editable={false}
          />
        </div>
      </ConfluenceArticleLayout>
    </PageLayout>
  );
}
