# Ant Design → Atlaskit + Tailwind Migration

This doc maps antd usage to Atlaskit and Tailwind so remaining files can be updated.

## Done
- **theme.ts** – No antd; uses `PRIMARY`, `FONT_FAMILY`, `colors`.
- **Toast** – `context/ToastContext.tsx` + `useToast()` replace `message.success` / `message.error`.
- **Icons** – `components/ui/Icons.tsx` replaces `@ant-design/icons`.
- **App.tsx** – Uses `@atlaskit/tabs` (Tabs, TabList, Tab, TabPanel), Tailwind layout.
- **PageLayout.tsx** – Uses `@atlaskit/button`, `@atlaskit/tooltip`, `Icons`, Tailwind.
- **Canvas.tsx** – Uses `@atlaskit/modal-dialog`, `@atlaskit/button`, native `<textarea>`.
- **ConfluenceArticleLayout.tsx** – Uses `@atlaskit/lozenge`, `Icons`.
- **AtlaskitKBEditor / AtlaskitKBRenderer** – Stubbed (no editor-core/renderer).

## Component mapping

| antd | Replacement |
|------|-------------|
| `Button` | `import Button from '@atlaskit/button'` — use `appearance="primary" \| "subtle" \| "default"` |
| `Input` | `import TextField from '@atlaskit/textfield'` — `<TextField value={} onChange={} />` |
| `Input.TextArea` | Native `<textarea className="...">` or `@atlaskit/textarea` if added |
| `Select` | `import Select from '@atlaskit/select'` — options `{ label, value }[]`, `value`, `onChange(option)` |
| `Modal` | `import ModalDialog, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog'` — render when open, `onClose`, children = header/body/footer |
| `message.useMessage()` / `message.success()` | `const toast = useToast(); toast.success('...');` (from `context/ToastContext`) |
| `Typography.Text` | `<span className="text-sm">` or `import { Text } from '../components/ui/Text'` |
| `Tag` | `import Lozenge from '@atlaskit/lozenge'` or `import Tag from '@atlaskit/tag'` |
| `Spin` | `import Spinner from '@atlaskit/spinner'` |
| `Empty` | `import EmptyState from '@atlaskit/empty-state'` |
| `Tooltip` | `import Tooltip from '@atlaskit/tooltip'` — `<Tooltip content="..."><child /></Tooltip>` |
| `Table` | `import { DynamicTable } from '@atlaskit/dynamic-table'` or custom table with Tailwind |
| `Tabs` (antd) | `import Tabs, { TabList, Tab, TabPanel } from '@atlaskit/tabs'` — `selected` index, `onChange(index)` |
| `Tree` | Custom tree with Tailwind (divs + state) or keep a minimal tree component |
| `Dropdown` / `Menu` | `import DropdownMenu from '@atlaskit/dropdown-menu'` |
| `Breadcrumb` | `import Breadcrumbs from '@atlaskit/breadcrumbs'` |
| `Drawer` | `import Drawer from '@atlaskit/drawer'` |
| `Collapse` | Custom with Tailwind or a simple accordion |
| `Descriptions` | `<dl className="grid ...">` with Tailwind |
| `Card` | `<div className="rounded border bg-white p-4">` or Atlaskit card if used |
| `Row` / `Col` | Tailwind `flex`, `grid`, `gap` |

## Files still to migrate (antd / @ant-design/icons)

- **Toolbar.tsx** – ✅ Done.
- **NodePalette.tsx** – ✅ Done (Tabs, Lozenge, TextField, ModalDialog, SimpleTree, Icons).
- **NodeConfigPanel.tsx** – ✅ Done (Tabs, TextField, Lozenge, Text).
- **DebugPanel.tsx** – ✅ Done (Text, Lozenge, Spinner, Button, native list + dl).
- **ExecutionHistory.tsx** – ✅ Done (Text, Lozenge, Tabs, native list + dl).
- **All nodeConfigs/** – ✅ Done (Text, TextField, native select/textarea/input, Lozenge, Button where needed).
- **ConfigManager.tsx**, **ConfigStoreManager.tsx**, **ScheduleManager.tsx**, **RedisSubscriptionManager.tsx**, **EmailTriggerManager.tsx**, **HttpTriggerManager.tsx** – ✅ Done (ModalDialog, Button, TextField, Lozenge, native select/input, HTML table, useToast, Icons).
- **nodes/index.tsx** – ✅ Done (Icons from components/ui/Icons).
- **Pages: Home.tsx, Flows.tsx, FlowExecutions.tsx, KBMain.tsx, KBArticleView.tsx, KBArticleEdit.tsx** – ✅ Done (Spinner, Button, Text/Text, Lozenge, Drawer, native table, useToast, Icons, SimpleTree on KBMain).

## Tailwind 4

- Use `className` with Tailwind classes for layout, spacing, colors, typography.
- No `tailwind.config.js` by default; use `@import "tailwindcss"` in CSS and `@tailwindcss/vite` in Vite.
