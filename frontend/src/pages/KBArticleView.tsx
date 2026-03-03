import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Button, Spin, Dropdown, message } from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import PageLayout from '../components/PageLayout';
import ConfluenceArticleLayout from '../components/kb/ConfluenceArticleLayout';
import KBEditor from '../components/kb/KBEditor';
import { kbGet, kbDelete, type KBArticle } from '../api/client';

const SPACE_NAME = 'Knowledge base space';

export default function KBArticleView() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<KBArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    kbGet(Number(id))
      .then((r) => setArticle(r.data))
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    if (!article || !confirm(`Delete "${article.title}"?`)) return;
    kbDelete(article.id)
      .then(() => {
        message.success('Article deleted');
        window.location.href = '/kb';
      })
      .catch(() => message.error('Failed to delete'));
  };

  if (loading || !id) {
    return (
      <PageLayout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      </PageLayout>
    );
  }

  if (!article) {
    return (
      <PageLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to={`/kb/${article.id}/edit`}>
              <Button type="primary" size="small" icon={<EditOutlined />}>
                Edit
              </Button>
            </Link>
            <Dropdown
              menu={{
                items: [
                  { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true, onClick: handleDelete },
                ] as MenuProps['items'],
              }}
              trigger={['click']}
            >
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </div>
        }
        titleArea={<h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>{article.title}</h1>}
        descriptionArea={article.summary ? <p style={{ margin: 0, color: '#6b778c', fontSize: 14 }}>{article.summary}</p> : null}
      >
        <div style={{ minHeight: 120 }}>
          <KBEditor
            initialContent={article.content as Record<string, unknown> ?? undefined}
            editable={false}
          />
        </div>
      </ConfluenceArticleLayout>
    </PageLayout>
  );
}
