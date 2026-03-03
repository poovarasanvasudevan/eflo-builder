import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import TextField from '@atlaskit/textfield';
import Button from '@atlaskit/button';
import Spinner from '@atlaskit/spinner';
import PageLayout from '../components/PageLayout';
import { kbListTree, kbSearch, kbDelete, type KBArticle } from '../api/client';
import { PRIMARY } from '../theme';
import { useToast } from '../context/ToastContext';
import { Icons } from '../components/ui/Icons';
import { SimpleTree, type SimpleTreeNode } from '../components/ui/SimpleTree';

const SPACE = 'main';

function buildTree(articles: KBArticle[]): SimpleTreeNode[] {
  const byParent = (parentId: number | null): SimpleTreeNode[] => {
    return articles
      .filter((a) => (a.parentId ?? null) === parentId)
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((a) => ({
        key: String(a.id),
        title: (
          <Link to={`/kb/${a.id}`} className="flex items-center gap-1.5 text-inherit no-underline hover:underline">
            <span style={{ color: PRIMARY }}><Icons.FileText /></span>
            <span>{a.title}</span>
          </Link>
        ),
        children: byParent(a.id),
        isLeaf: false,
      }));
  };
  return byParent(null);
}

export default function KBMain() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [searchResults, setSearchResults] = useState<KBArticle[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(q);
  const toast = useToast();

  useEffect(() => {
    kbListTree(SPACE)
      .then((r) => setArticles(r.data ?? []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSearchInput(q);
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    kbSearch(q, SPACE)
      .then((r) => setSearchResults(r.data ?? []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }, [q]);

  const treeData = useMemo(() => buildTree(articles), [articles]);

  const onSearch = (value: string) => {
    const v = value.trim();
    if (v) setSearchParams({ q: v });
    else setSearchParams({});
  };

  const handleDelete = (id: number, title: string) => {
    if (!confirm('Delete "' + title + '"?')) return;
    kbDelete(id)
      .then(() => {
        setArticles((prev) => prev.filter((a) => a.id !== id));
        toast.success('Article deleted');
      })
      .catch(() => toast.error('Failed to delete'));
  };

  const showSearch = q.length > 0;
  const list = showSearch ? (searchResults ?? []) : articles.filter((a) => !a.parentId);

  const ArticleRow = ({ a, showIcon }: { a: KBArticle; showIcon?: boolean }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    return (
      <li className="py-2 px-2.5 border-b border-[#f0f0f0] flex items-center justify-between group">
        <Link to={`/kb/${a.id}`} className={`font-medium flex items-center gap-2 ${showIcon ? '' : ''}`}>
          {showIcon && <span style={{ color: PRIMARY }}><Icons.FileText /></span>}
          {a.title}
        </Link>
        <div className="relative">
          <Button appearance="subtle" onClick={() => setMenuOpen((o) => !o)}>
            <Icons.More />
          </Button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" role="presentation" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 rounded bg-white border border-[#dfe1e6] shadow-lg py-1 min-w-[100px]">
                <button type="button" className="block w-full text-left px-3 py-1.5 text-sm hover:bg-black/5" onClick={() => { setMenuOpen(false); window.location.href = `/kb/${a.id}/edit`; }}>Edit</button>
                <button type="button" className="block w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={() => { setMenuOpen(false); handleDelete(a.id, a.title); }}>Delete</button>
              </div>
            </>
          )}
        </div>
      </li>
    );
  };

  return (
    <PageLayout title="Knowledge Base">
      <div className="flex flex-col h-full gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-[#8c8c8c] text-sm">🔍</span>
            <TextField
              placeholder="Search articles..."
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && onSearch(searchInput)}
            />
          </div>
          <Button appearance="primary" onClick={() => (window.location.href = '/kb/new')}>
            <span className="flex items-center gap-1"><Icons.Plus /> Create article</span>
          </Button>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          <div className="w-[260px] flex-shrink-0 border border-[#e8e8e8] rounded p-2 bg-[#fafafa] overflow-y-auto">
            <div className="text-[11px] font-bold text-[#6b778c] uppercase mb-1.5">Space: {SPACE}</div>
            {loading ? (
              <Spinner size="small" />
            ) : treeData.length === 0 ? (
              <div className="py-4 text-center text-sm text-[#706e6b]">No articles</div>
            ) : (
              <SimpleTree treeData={treeData} defaultExpandAll onSelect={(key) => (window.location.href = `/kb/${key}`)} />
            )}
          </div>

          <div className="flex-1 min-w-0 overflow-y-auto">
            {showSearch ? (
              <div>
                <h3 className="text-[13px] text-[#6b778c] mb-2">Search results for &quot;{q}&quot;</h3>
                {searchLoading ? (
                  <Spinner size="small" />
                ) : (searchResults ?? []).length === 0 ? (
                  <div className="py-8 text-center text-[#706e6b]">No results</div>
                ) : (
                  <ul className="list-none p-0 m-0">
                    {(searchResults ?? []).map((a) => (
                      <ArticleRow key={a.id} a={a} />
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-[13px] text-[#6b778c] mb-2">Recent / root articles</h3>
                {list.length === 0 ? (
                  <div className="py-8 text-center text-[#706e6b]">No articles yet. Create one to get started.</div>
                ) : (
                  <ul className="list-none p-0 m-0">
                    {list.map((a) => (
                      <ArticleRow key={a.id} a={a} showIcon />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
