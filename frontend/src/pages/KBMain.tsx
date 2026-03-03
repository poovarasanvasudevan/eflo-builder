import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Input, Tree, Spin, Empty, Button, Dropdown, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  SearchOutlined,
  PlusOutlined,
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import PageLayout from '../components/PageLayout';
import { kbListTree, kbSearch, kbDelete, type KBArticle } from '../api/client';
import { PRIMARY } from '../theme';
import { slugify } from '../utils/slugify';

const SPACE = 'main';

function buildTree(articles: KBArticle[]): DataNode[] {
  const byParent = (parentId: number | null): DataNode[] => {
    return articles
      .filter((a) => (a.parentId ?? null) === parentId)
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((a) => ({
        key: String(a.id),
        title: (
          <Link to={`/kb/${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileTextOutlined style={{ fontSize: 12, color: PRIMARY }} />
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
        message.success('Article deleted');
      })
      .catch(() => message.error('Failed to delete'));
  };

  const showSearch = q.length > 0;
  const list = showSearch ? (searchResults ?? []) : articles.filter((a) => !a.parentId);

  return (
    <PageLayout title="Knowledge Base">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Input
            size="small"
            placeholder="Search articles..."
            prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={() => onSearch(searchInput)}
            style={{ width: 260 }}
            allowClear
          />
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => (window.location.href = '/kb/new')}>
            Create article
          </Button>
        </div>

        <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
          <div
            style={{
              width: 260,
              flexShrink: 0,
              border: '1px solid #e8e8e8',
              borderRadius: 4,
              padding: 8,
              background: '#fafafa',
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b778c', marginBottom: 6, textTransform: 'uppercase' }}>
              Space: {SPACE}
            </div>
            {loading ? (
              <Spin size="small" />
            ) : treeData.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No articles" style={{ margin: '16px 0' }} />
            ) : (
              <Tree showLine blockNode defaultExpandAll treeData={treeData} style={{ background: 'transparent' }} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
            {showSearch ? (
              <div>
                <h3 style={{ fontSize: 13, color: '#6b778c', marginBottom: 8 }}>Search results for "{q}"</h3>
                {searchLoading ? (
                  <Spin />
                ) : (searchResults ?? []).length === 0 ? (
                  <Empty description="No results" />
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {(searchResults ?? []).map((a) => (
                      <li
                        key={a.id}
                        style={{
                          padding: '8px 10px',
                          borderBottom: '1px solid #f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Link to={`/kb/${a.id}`} style={{ fontWeight: 500 }}>
                          {a.title}
                        </Link>
                        <Dropdown
                          menu={{
                            items: [
                              { key: 'edit', icon: <EditOutlined />, label: 'Edit', onClick: () => (window.location.href = '/kb/' + a.id + '/edit') },
                              { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true, onClick: () => handleDelete(a.id, a.title) },
                            ] as MenuProps['items'],
                          }}
                          trigger={['click']}
                        >
                          <Button type="text" size="small" icon={<MoreOutlined />} />
                        </Dropdown>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: 13, color: '#6b778c', marginBottom: 8 }}>Recent / root articles</h3>
                {list.length === 0 ? (
                  <Empty description="No articles yet. Create one to get started." />
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {list.map((a) => (
                      <li
                        key={a.id}
                        style={{
                          padding: '8px 10px',
                          borderBottom: '1px solid #f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Link to={`/kb/${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileTextOutlined style={{ color: PRIMARY }} />
                          {a.title}
                        </Link>
                        <Dropdown
                          menu={{
                            items: [
                              { key: 'edit', icon: <EditOutlined />, label: 'Edit', onClick: () => (window.location.href = '/kb/' + a.id + '/edit') },
                              { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true, onClick: () => handleDelete(a.id, a.title) },
                            ] as MenuProps['items'],
                          }}
                          trigger={['click']}
                        >
                          <Button type="text" size="small" icon={<MoreOutlined />} />
                        </Dropdown>
                      </li>
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
