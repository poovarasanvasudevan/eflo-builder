import type { ComponentType } from 'react';
import type { NodeConfigProps, NodeDoc } from './types';
import StartNodeConfig, { START_NODE_DOC } from './StartNodeConfig';
import EndNodeConfig, { END_NODE_DOC } from './EndNodeConfig';
import HttpRequestNodeConfig, { HTTP_REQUEST_NODE_DOC } from './HttpRequestNodeConfig';
import DelayNodeConfig, { DELAY_NODE_DOC } from './DelayNodeConfig';
import ConditionNodeConfig, { CONDITION_NODE_DOC } from './ConditionNodeConfig';
import LogNodeConfig, { LOG_NODE_DOC } from './LogNodeConfig';
import TransformNodeConfig, { TRANSFORM_NODE_DOC } from './TransformNodeConfig';
import FunctionNodeConfig, { FUNCTION_NODE_DOC } from './FunctionNodeConfig';
import RedisNodeConfig, { REDIS_NODE_DOC } from './RedisNodeConfig';
import CronNodeConfig, { CRON_NODE_DOC } from './CronNodeConfig';
import RedisSubscribeNodeConfig, { REDIS_SUBSCRIBE_NODE_DOC } from './RedisSubscribeNodeConfig';
import EmailNodeConfig, { EMAIL_NODE_DOC } from './EmailNodeConfig';
import EmailReceiveNodeConfig, { EMAIL_RECEIVE_NODE_DOC } from './EmailReceiveNodeConfig';
import ReadFileNodeConfig, { READ_FILE_NODE_DOC } from './ReadFileNodeConfig';
import WriteFileNodeConfig, { WRITE_FILE_NODE_DOC } from './WriteFileNodeConfig';
import ExecNodeConfig, { EXEC_NODE_DOC } from './ExecNodeConfig';
import SshNodeConfig, { SSH_NODE_DOC } from './SshNodeConfig';
import DatabaseNodeConfig, { DATABASE_NODE_DOC } from './DatabaseNodeConfig';
import HttpInNodeConfig, { HTTP_IN_NODE_DOC } from './HttpInNodeConfig';
import HttpOutNodeConfig, { HTTP_OUT_NODE_DOC } from './HttpOutNodeConfig';
import SwitchNodeConfig, { SWITCH_NODE_DOC } from './SwitchNodeConfig';
import FlowNodeConfig, { FLOW_NODE_DOC } from './FlowNodeConfig';
import ContinueNodeConfig, { CONTINUE_NODE_DOC } from './ContinueNodeConfig';
import GraphQLNodeConfig, { GRAPHQL_NODE_DOC } from './GraphQLNodeConfig';
import GetConfigStoreNodeConfig, { GET_CONFIG_STORE_NODE_DOC } from './GetConfigStoreNodeConfig';
import SetConfigStoreNodeConfig, { SET_CONFIG_STORE_NODE_DOC } from './SetConfigStoreNodeConfig';

export type NodeConfigComponent = ComponentType<NodeConfigProps>;
export type { NodeDoc } from './types';

export const NODE_CONFIG_MAP: Record<string, NodeConfigComponent> = {
  start: StartNodeConfig,
  end: EndNodeConfig,
  http_request: HttpRequestNodeConfig,
  delay: DelayNodeConfig,
  condition: ConditionNodeConfig,
  log: LogNodeConfig,
  transform: TransformNodeConfig,
  function: FunctionNodeConfig,
  redis: RedisNodeConfig,
  cron: CronNodeConfig,
  redis_subscribe: RedisSubscribeNodeConfig,
  email: EmailNodeConfig,
  email_receive: EmailReceiveNodeConfig,
  read_file: ReadFileNodeConfig,
  write_file: WriteFileNodeConfig,
  exec: ExecNodeConfig,
  ssh: SshNodeConfig,
  database: DatabaseNodeConfig,
  http_in: HttpInNodeConfig,
  http_out: HttpOutNodeConfig,
  switch: SwitchNodeConfig,
  flow: FlowNodeConfig,
  continue: ContinueNodeConfig,
  graphql: GraphQLNodeConfig,
  get_config_store: GetConfigStoreNodeConfig,
  set_config_store: SetConfigStoreNodeConfig,
};

export const NODE_DOCS: Record<string, NodeDoc> = {
  start: START_NODE_DOC,
  end: END_NODE_DOC,
  http_request: HTTP_REQUEST_NODE_DOC,
  delay: DELAY_NODE_DOC,
  condition: CONDITION_NODE_DOC,
  log: LOG_NODE_DOC,
  transform: TRANSFORM_NODE_DOC,
  function: FUNCTION_NODE_DOC,
  redis: REDIS_NODE_DOC,
  cron: CRON_NODE_DOC,
  redis_subscribe: REDIS_SUBSCRIBE_NODE_DOC,
  email: EMAIL_NODE_DOC,
  email_receive: EMAIL_RECEIVE_NODE_DOC,
  read_file: READ_FILE_NODE_DOC,
  write_file: WRITE_FILE_NODE_DOC,
  exec: EXEC_NODE_DOC,
  ssh: SSH_NODE_DOC,
  database: DATABASE_NODE_DOC,
  http_in: HTTP_IN_NODE_DOC,
  http_out: HTTP_OUT_NODE_DOC,
  switch: SWITCH_NODE_DOC,
  flow: FLOW_NODE_DOC,
  continue: CONTINUE_NODE_DOC,
  graphql: GRAPHQL_NODE_DOC,
  get_config_store: GET_CONFIG_STORE_NODE_DOC,
  set_config_store: SET_CONFIG_STORE_NODE_DOC,
};

export function getNodeConfigComponent(nodeType: string): NodeConfigComponent | null {
  return NODE_CONFIG_MAP[nodeType] ?? null;
}
