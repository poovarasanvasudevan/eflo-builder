package nodes

import "eflo/backend/engine"

func RegisterAll() {
	engine.Register("start", &StartNode{})
	engine.Register("end", &EndNode{})
	engine.Register("http_request", &HttpRequestNode{})
	engine.Register("delay", &DelayNode{})
	engine.Register("condition", &ConditionNode{})
	engine.Register("log", &LogNode{})
	engine.Register("transform", &TransformNode{})
	engine.Register("redis", &RedisNode{})
	engine.Register("cron", &CronNode{})
	engine.Register("redis_subscribe", &RedisSubscribeNode{})
	engine.Register("email", &EmailNode{})
	engine.Register("email_receive", &EmailReceiveNode{})
	engine.Register("read_file", &ReadFileNode{})
	engine.Register("write_file", &WriteFileNode{})
	engine.Register("exec", &ExecNode{})
	engine.Register("switch", &SwitchNode{})
	engine.Register("flow", &FlowNode{})
	engine.Register("function", &FunctionNode{})
}
