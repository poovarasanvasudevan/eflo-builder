// Comprehensive help documentation for each node type.
// Each entry has a description, usage guide, property list, sample input, and sample output.

export interface NodeDoc {
  title: string;
  description: string;
  usage: string;
  properties: { name: string; type: string; desc: string; required?: boolean }[];
  sampleInput: Record<string, any>;
  sampleOutput: Record<string, any>;
  tips?: string[];
}

const NODE_DOCS: Record<string, NodeDoc> = {
  start: {
    title: 'Start',
    description:
      'The entry point of every workflow. Execution begins from this node and flows downstream through connected edges. Every workflow must have exactly one Start node.',
    usage:
      'Drag the Start node onto the canvas. Connect its output to the first action node. No configuration is needed — it simply initiates the flow.',
    properties: [
      { name: 'label', type: 'string', desc: 'Display label for the node', required: false },
    ],
    sampleInput: {},
    sampleOutput: {
      started: true,
      startedAt: '2026-02-24T10:00:00Z',
    },
    tips: [
      'A workflow can only have one Start node.',
      'Start nodes have no target handle — they are always the first node.',
      'Use Cron or Redis Subscribe triggers as alternatives to Start for event-driven flows.',
    ],
  },

  end: {
    title: 'End',
    description:
      'Marks the termination point of a workflow branch. When execution reaches this node, that path is considered complete. A workflow can have multiple End nodes for different branches.',
    usage:
      'Place an End node at the end of each workflow branch. It passes through any data it receives unchanged.',
    properties: [
      { name: 'label', type: 'string', desc: 'Display label for the node', required: false },
    ],
    sampleInput: {
      result: 'success',
      data: { userId: 42 },
    },
    sampleOutput: {
      result: 'success',
      data: { userId: 42 },
      ended: true,
      endedAt: '2026-02-24T10:00:05Z',
    },
  },

  http_request: {
    title: 'HTTP Request',
    description:
      'Makes an HTTP request to an external URL. Supports GET, POST, PUT, DELETE, and PATCH methods. The response status, headers, and body are passed downstream.',
    usage:
      'Configure the HTTP method and URL. For POST/PUT/PATCH, provide a JSON body. The response is available as output to the next node.',
    properties: [
      { name: 'method', type: 'select', desc: 'HTTP method: GET, POST, PUT, DELETE, PATCH', required: true },
      { name: 'url', type: 'string', desc: 'Full URL to call (e.g. https://api.example.com/data)', required: true },
      { name: 'body', type: 'json', desc: 'Request body (JSON) — for POST, PUT, PATCH', required: false },
    ],
    sampleInput: {
      userId: 42,
    },
    sampleOutput: {
      statusCode: 200,
      body: '{"id":42,"name":"John"}',
      json: { id: 42, name: 'John' },
      headers: { 'content-type': 'application/json' },
    },
    tips: [
      'The URL and body can reference data from upstream nodes.',
      'JSON responses are automatically parsed into the "json" output field.',
      'Non-2xx responses will cause the node to fail unless handled by a condition.',
    ],
  },

  delay: {
    title: 'Delay',
    description:
      'Pauses the workflow execution for a specified duration in milliseconds before continuing to the next node.',
    usage:
      'Set the duration in milliseconds. The node will wait for that period, then pass all input data through to the next node.',
    properties: [
      { name: 'durationMs', type: 'number', desc: 'Wait time in milliseconds (e.g. 1000 = 1 second)', required: true },
    ],
    sampleInput: {
      previousResult: 'data from upstream',
    },
    sampleOutput: {
      previousResult: 'data from upstream',
      delayed: true,
      delayMs: 1000,
      delayedAt: '2026-02-24T10:00:01Z',
    },
    tips: [
      'Use delays between API calls to respect rate limits.',
      'Maximum recommended delay is 300000ms (5 minutes).',
      'All input data is passed through unchanged.',
    ],
  },

  condition: {
    title: 'Decision / Condition',
    description:
      'Evaluates an expression and routes the flow to different branches based on the result. Has two outputs: "Yes" (true) and "No" (false).',
    usage:
      'Write an expression using expr-lang syntax. Variables from upstream node outputs are available. Connect the "Yes" handle for the true path and "No" handle for the false path.',
    properties: [
      { name: 'expression', type: 'expr', desc: 'Boolean expression (e.g. statusCode == 200, amount > 100)', required: true },
    ],
    sampleInput: {
      statusCode: 200,
      json: { active: true },
    },
    sampleOutput: {
      result: true,
      expression: 'statusCode == 200',
      statusCode: 200,
      json: { active: true },
    },
    tips: [
      'Expression syntax: ==, !=, >, <, >=, <=, &&, ||, !',
      'Access nested fields: json.active == true',
      'String comparison: body contains "success"',
      'The "Yes" handle is the left output, "No" is the right output.',
    ],
  },

  log: {
    title: 'Log',
    description:
      'Logs a message to the execution log. Useful for debugging workflows or recording important data at specific points in the flow.',
    usage:
      'Enter a message to log. The message and all input data are recorded in the execution log and also passed downstream.',
    properties: [
      { name: 'message', type: 'string', desc: 'Message to log', required: true },
    ],
    sampleInput: {
      userId: 42,
      action: 'created',
    },
    sampleOutput: {
      logged: true,
      message: 'User created successfully',
      userId: 42,
      action: 'created',
    },
    tips: [
      'Log nodes are great for debugging — view output in Execution History.',
      'All input data is passed through to the next node.',
    ],
  },

  transform: {
    title: 'Transform',
    description:
      'Transforms data using an expr-lang expression. The expression result becomes the primary output, along with all input data.',
    usage:
      'Write an expression to compute a new value. Upstream data is available as variables. The result is stored in the "result" output field.',
    properties: [
      { name: 'expression', type: 'expr', desc: 'Expression to evaluate (e.g. json.price * 1.1)', required: true },
    ],
    sampleInput: {
      json: { price: 100, name: 'Widget' },
    },
    sampleOutput: {
      result: 110,
      expression: 'json.price * 1.1',
      json: { price: 100, name: 'Widget' },
    },
    tips: [
      'Use to reshape data between nodes.',
      'String concat: name + " - processed"',
      'Math: price * quantity',
      'Conditional: status == "active" ? "yes" : "no"',
    ],
  },

  function: {
    title: 'Function',
    description:
      'Runs JavaScript code in a V8 engine and returns the result to the flow. Upstream data is available as the global `input` object; set `returnValue` to pass data to the next node.',
    usage:
      'Write JavaScript in the code editor. The variable `input` holds the data from the previous node. Assign to `returnValue` (object, array, string, or number) to send data downstream. The result is available as the "result" output field.',
    properties: [
      { name: 'code', type: 'string', desc: 'JavaScript code to execute', required: true },
      { name: 'timeoutMs', type: 'number', desc: 'Max execution time in ms (default: 10000)', required: false },
    ],
    sampleInput: {
      value: 10,
      name: 'Widget',
    },
    sampleOutput: {
      result: { value: 10, name: 'Widget', doubled: 20 },
      value: 10,
      name: 'Widget',
    },
    tips: [
      'Always set `returnValue` to control what the next node receives; if unset, `input` is passed through.',
      '`input` is a plain object; you can spread it: returnValue = { ...input, extra: true };',
      'Return values are JSON-serialized; avoid functions or non-serializable values.',
      'Scripts run in a sandbox (no Node.js APIs); use for data transformation only.',
      'Use the timeout to avoid infinite loops blocking the workflow.',
    ],
  },

  redis: {
    title: 'Redis',
    description:
      'Executes Redis operations (GET, SET, DEL, HGET, HSET, LPUSH, PUBLISH, etc.) using a configured Redis server connection.',
    usage:
      'Select a Redis server config, choose an operation, and provide the key/value/field as needed. The result of the operation is passed downstream.',
    properties: [
      { name: 'configId', type: 'select', desc: 'Redis server configuration', required: true },
      { name: 'operation', type: 'select', desc: 'Redis command (GET, SET, DEL, HGET, HSET, etc.)', required: true },
      { name: 'key', type: 'string', desc: 'Redis key name', required: true },
      { name: 'value', type: 'string', desc: 'Value to set (for SET, HSET, LPUSH, etc.)', required: false },
      { name: 'field', type: 'string', desc: 'Hash field name (for HGET, HSET, HDEL)', required: false },
      { name: 'ttl', type: 'number', desc: 'TTL in milliseconds (for SET, EXPIRE)', required: false },
    ],
    sampleInput: {
      userId: '42',
    },
    sampleOutput: {
      operation: 'GET',
      key: 'user:42',
      result: '{"name":"John","age":30}',
      exists: true,
      json: { name: 'John', age: 30 },
    },
    tips: [
      'Create a Redis config in ⚙ Connection Configs first.',
      'Key and value can come from upstream input if not set in properties.',
      'JSON values are auto-parsed when retrieved with GET.',
      'Use PUBLISH to send messages to Redis pub/sub channels.',
    ],
  },

  cron: {
    title: 'Cron Trigger',
    description:
      'A trigger node that starts a workflow on a cron schedule. Acts as an entry point — use instead of Start for time-based automation.',
    usage:
      'Set a cron expression (e.g. "*/5 * * * *" for every 5 minutes). Optionally set a timezone and a JSON payload to inject into the flow. Then create a Schedule in the Cron Schedules manager to activate it.',
    properties: [
      { name: 'expression', type: 'string', desc: 'Cron expression (min hour dom month dow)', required: true },
      { name: 'timezone', type: 'select', desc: 'Timezone for the schedule (default: UTC)', required: false },
      { name: 'payload', type: 'json', desc: 'Optional JSON data passed to downstream nodes', required: false },
    ],
    sampleInput: {},
    sampleOutput: {
      triggered: true,
      triggeredAt: '2026-02-24T10:00:00Z',
      nextRun: '2026-02-24T10:05:00Z',
      expression: '*/5 * * * *',
      timezone: 'UTC',
    },
    tips: [
      'Common presets: "* * * * *" (every min), "0 * * * *" (hourly), "0 0 * * *" (daily).',
      'Remember to create a Schedule via the 🕐 toolbar button to activate.',
      'The cron node acts as a trigger — it has no target handle.',
    ],
  },

  redis_subscribe: {
    title: 'Redis Subscribe Trigger',
    description:
      'A trigger node that starts a workflow when a message is received on a Redis pub/sub channel. Acts as an entry point for event-driven flows.',
    usage:
      'Select a Redis server config, set the channel name or pattern, and choose SUBSCRIBE (exact) or PSUBSCRIBE (glob pattern). Then create a subscription in the 🔔 Redis Subscriptions manager.',
    properties: [
      { name: 'configId', type: 'select', desc: 'Redis server configuration', required: true },
      { name: 'channel', type: 'string', desc: 'Channel name or glob pattern', required: true },
      { name: 'isPattern', type: 'boolean', desc: 'Use PSUBSCRIBE for pattern matching', required: false },
    ],
    sampleInput: {},
    sampleOutput: {
      triggered: true,
      triggeredAt: '2026-02-24T10:00:00Z',
      message: '{"event":"user.created","userId":42}',
      channel: 'events',
      pattern: '',
      subscriptionId: 1,
    },
    tips: [
      'Use PSUBSCRIBE with patterns like "events:*" to match multiple channels.',
      'The message payload is available as the "message" field.',
      'Create a subscription via the 🔔 toolbar button to activate.',
      'Each received message triggers a separate workflow execution.',
    ],
  },

  email: {
    title: 'Send Email',
    description:
      'Sends an email via SMTP using a configured email server. Supports To, CC, BCC, subject, plain text or HTML body.',
    usage:
      'Select an email config (create one in ⚙ Connection Configs with SMTP details). Set the recipient, subject, and body. Multiple recipients can be comma-separated.',
    properties: [
      { name: 'configId', type: 'select', desc: 'Email (SMTP) server configuration', required: true },
      { name: 'to', type: 'string', desc: 'Recipient email(s), comma-separated', required: true },
      { name: 'cc', type: 'string', desc: 'CC recipients, comma-separated', required: false },
      { name: 'bcc', type: 'string', desc: 'BCC recipients, comma-separated', required: false },
      { name: 'subject', type: 'string', desc: 'Email subject line', required: true },
      { name: 'body', type: 'string', desc: 'Email body content', required: true },
      { name: 'contentType', type: 'select', desc: 'text/plain or text/html', required: false },
    ],
    sampleInput: {
      userName: 'John',
      userEmail: 'john@example.com',
    },
    sampleOutput: {
      sent: true,
      to: 'john@example.com',
      cc: '',
      bcc: '',
      subject: 'Welcome John!',
      from: 'noreply@myapp.com',
      smtpHost: 'smtp.gmail.com',
      sentAt: '2026-02-24T10:00:03Z',
      recipients: 1,
    },
    tips: [
      'Create an email config first in ⚙ Connection Configs (type: Email).',
      'For Gmail, use an App Password (not your regular password).',
      'Port 587 = STARTTLS (recommended), Port 465 = SSL/TLS.',
      'Use text/html content type for rich formatted emails.',
      'To, subject, and body can be populated from upstream node data.',
    ],
  },

  email_receive: {
    title: 'Receive Email Trigger',
    description:
      'A trigger node that polls an IMAP mailbox for unread emails and triggers a workflow execution for each new message. Uses the same email configuration as Send Email (with auto-derived IMAP host).',
    usage:
      'Select an email config (the IMAP host is derived from the SMTP host, e.g. smtp.gmail.com → imap.gmail.com, or set imapHost/imapPort in the config). Set the mailbox folder, poll interval, and whether to mark emails as read. Then create an Email Trigger via the 📨 toolbar button to activate.',
    properties: [
      { name: 'configId', type: 'select', desc: 'Email server configuration (must have IMAP access)', required: true },
      { name: 'mailbox', type: 'string', desc: 'IMAP folder to poll (default: INBOX)', required: false },
      { name: 'pollIntervalSec', type: 'number', desc: 'Seconds between each poll (min: 10, default: 60)', required: false },
      { name: 'markSeen', type: 'boolean', desc: 'Mark fetched emails as read (default: true)', required: false },
      { name: 'maxFetch', type: 'number', desc: 'Max emails to fetch per poll (default: 10)', required: false },
    ],
    sampleInput: {},
    sampleOutput: {
      triggered: true,
      triggeredAt: '2026-02-25T10:00:00Z',
      from: 'sender@example.com',
      to: 'you@gmail.com',
      subject: 'Order Confirmation #12345',
      date: 'Tue, 25 Feb 2026 09:59:45 +0000',
      messageId: '<abc123@mail.example.com>',
      seqNum: 42,
      fetchedAt: '2026-02-25T10:00:01Z',
      triggerId: 1,
      receivedAt: '2026-02-25T10:00:01Z',
    },
    tips: [
      'Uses the same email config as Send Email — IMAP host is auto-derived (smtp.gmail.com → imap.gmail.com).',
      'For custom IMAP hosts, add "imapHost" and "imapPort" to the config JSON.',
      'Only UNSEEN emails are fetched. Enable "Mark as Read" to avoid processing the same email twice.',
      'Each email triggers a separate workflow execution with from, to, subject, date, etc. as input.',
      'For Gmail: enable IMAP in Settings → Forwarding and POP/IMAP, and use an App Password.',
      'Create an Email Trigger via the 📨 toolbar button to activate polling.',
      'Minimum poll interval is 10 seconds. Use 60+ seconds for production.',
    ],
  },

  read_file: {
    title: 'Read File',
    description:
      'Reads a file from the server filesystem and outputs its text content, size, filename, and modification time. Useful for reading config files, logs, data files, etc.',
    usage:
      'Set the file path (absolute or relative to the server working directory). The file content is output as the "content" field for downstream nodes. The path can also come from an upstream node.',
    properties: [
      { name: 'path', type: 'string', desc: 'Absolute or relative file path to read', required: true },
      { name: 'encoding', type: 'select', desc: 'File encoding (utf-8, ascii, binary)', required: false },
    ],
    sampleInput: {
      path: '/tmp/data.json',
    },
    sampleOutput: {
      content: '{"users":[{"id":1,"name":"Alice"}]}',
      path: '/tmp/data.json',
      size: 36,
      filename: 'data.json',
      encoding: 'utf-8',
      isDir: false,
      modTime: '2026-02-25 10:00:00 +0000 UTC',
    },
    tips: [
      'The path can be set in properties or passed from an upstream node as "path".',
      'File content is always returned as a string.',
      'Use a Transform node after this to parse JSON content: json.content',
      'Ensure the server process has read permissions for the target file.',
    ],
  },

  write_file: {
    title: 'Write File',
    description:
      'Writes text content to a file on the server filesystem. Supports overwrite and append modes. Automatically creates parent directories if they do not exist.',
    usage:
      'Set the file path and content to write. Choose "overwrite" to replace or "append" to add to existing content. The content can also come from an upstream node\'s output.',
    properties: [
      { name: 'path', type: 'string', desc: 'Absolute or relative file path to write', required: true },
      { name: 'content', type: 'string', desc: 'Text content to write (or use upstream "content" field)', required: false },
      { name: 'mode', type: 'select', desc: 'Write mode: overwrite or append', required: false },
    ],
    sampleInput: {
      content: 'Hello World\n',
      path: '/tmp/output.txt',
    },
    sampleOutput: {
      written: true,
      path: '/tmp/output.txt',
      bytes: 12,
      mode: 'overwrite',
      filename: 'output.txt',
    },
    tips: [
      'Parent directories are created automatically.',
      'Leave "content" empty in properties to use the upstream "content" field.',
      'Use "append" mode to build log files or accumulate data.',
      'Ensure the server process has write permissions for the target directory.',
    ],
  },

  exec: {
    title: 'Exec Command',
    description:
      'Executes a system shell command on the server. Captures stdout, stderr, exit code, and execution duration. Supports configurable shell, working directory, and timeout.',
    usage:
      'Enter the command to run. Select the shell (auto-detected by OS if left blank). Optionally set a working directory and timeout. The stdout and stderr are available as output fields.',
    properties: [
      { name: 'command', type: 'string', desc: 'Shell command to execute', required: true },
      { name: 'shell', type: 'select', desc: 'Shell to use (/bin/sh, /bin/bash, cmd, powershell)', required: false },
      { name: 'workingDir', type: 'string', desc: 'Working directory for the command', required: false },
      { name: 'timeoutMs', type: 'number', desc: 'Timeout in milliseconds (default: 30000)', required: false },
    ],
    sampleInput: {
      filename: 'report.csv',
    },
    sampleOutput: {
      stdout: 'total 42\n-rw-r--r-- 1 user staff 1024 Feb 25 10:00 report.csv\n',
      stderr: '',
      exitCode: 0,
      command: 'ls -la report.csv',
      shell: '/bin/sh',
      durationMs: 15,
      success: true,
    },
    tips: [
      '⚠️ Security: Be careful with user-supplied input in commands to avoid injection.',
      'On macOS/Linux: defaults to /bin/sh. On Windows: defaults to cmd.',
      'Non-zero exit codes are captured (not treated as node failure) — check "exitCode" or "success".',
      'Use timeout to prevent long-running commands from blocking the workflow.',
      'The command can reference upstream data if set dynamically.',
    ],
  },

  switch: {
    title: 'Switch (Multi-Decision)',
    description:
      'Evaluates an expression and routes the flow to one of multiple branches based on the result. Like a switch/case statement. If no case matches, routes to the "Default" branch.',
    usage:
      'Set an expression to evaluate (e.g. "statusCode" or "json.type"). Add cases with a label and value. Each case becomes a source handle. Connect edges from each handle to the appropriate downstream node. Non-matching results go to "Default".',
    properties: [
      { name: 'expression', type: 'expr', desc: 'Expression to evaluate — result is matched against case values', required: true },
      { name: 'cases', type: 'array', desc: 'Array of {label, value} objects defining each branch', required: true },
    ],
    sampleInput: {
      statusCode: 200,
      json: { type: 'order', status: 'pending' },
    },
    sampleOutput: {
      _branch: 'success',
      result: 200,
      resultStr: '200',
      expression: 'statusCode',
      matched: true,
      statusCode: 200,
      json: { type: 'order', status: 'pending' },
    },
    tips: [
      'Each case needs a "label" (used as the handle ID for edge connections) and a "value" (matched against the expression result).',
      'The expression result is converted to a string for matching.',
      'Add as many cases as needed — each appears as a separate output handle on the node.',
      'The "Default" handle is always present for unmatched values.',
      'Example: expression="json.status", cases: [{label:"pending", value:"pending"}, {label:"shipped", value:"shipped"}]',
      'Works like a switch/case in programming — only the first matching case is followed.',
    ],
  },

  flow: {
    title: 'Sub-Flow',
    description:
      'Executes another workflow as a sub-flow. This allows you to compose complex automations by chaining workflows together. The target workflow runs to completion before the parent flow continues.',
    usage:
      'Select a target workflow from the dropdown. Optionally enable "Pass Input" to forward upstream data into the sub-flow\'s start node. The sub-flow execution result (ID, status, duration) is returned as output. Connect the output to downstream nodes to continue after the sub-flow completes.',
    properties: [
      { name: 'workflow_id', type: 'number', desc: 'ID of the workflow to execute as a sub-flow', required: true },
      { name: 'workflow_name', type: 'string', desc: 'Name of the selected workflow (auto-populated)', required: false },
      { name: 'pass_input', type: 'boolean', desc: 'If true, forward all upstream data as input to the sub-flow', required: false },
    ],
    sampleInput: {
      userId: 42,
      action: 'process',
    },
    sampleOutput: {
      subflow_execution_id: 15,
      subflow_workflow_id: 3,
      subflow_name: 'Data Processing',
      subflow_status: 'completed',
      subflow_duration_ms: 1250,
      userId: 42,
      action: 'process',
    },
    tips: [
      'The current workflow is excluded from the dropdown to prevent infinite recursion.',
      'Sub-flows run synchronously — the parent flow waits until the sub-flow finishes.',
      'If the sub-flow fails, the Flow node will also fail and log the sub-flow error.',
      'Use "Pass Input" to share data between parent and sub-flows.',
      'The sub-flow creates its own execution entry — you can view it separately in Execution History.',
      'Chain multiple Flow nodes to create complex multi-stage pipelines.',
      '⚠️ Avoid circular references (Flow A → Flow B → Flow A) as this will cause infinite execution.',
    ],
  },
};

export default NODE_DOCS;

