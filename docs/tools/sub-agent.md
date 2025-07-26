# SubAgent Tool

The `SubAgentTool` spawns sub-agents by running `wren --yolo -p "TASK"` in the shell. It leverages the existing `ShellTool` for execution.

## Usage

```typescript
const tool = new SubAgentTool(config);
const result = await tool.execute({ task: 'test-task' }, abortSignal);
```

## Parameters

- `task` (string): The task to delegate to the sub-agent.
- `description` (string, optional): Brief description of the task.
- `directory` (string, optional): Directory to run the command in.
