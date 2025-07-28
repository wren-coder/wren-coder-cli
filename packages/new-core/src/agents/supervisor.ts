/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */


import { z } from "zod";

// 2. Create Supervisor from Scratch

// Define state type
interface MessagesState {
    messages: Array<HumanMessage | AIMessage | ToolMessage>;
}

// Create handoff tools
const createHandoffTool = (agentName: string, description?: string) => {
    const name = `transfer_to_${agentName}`;
    const toolDescription = description || `Ask ${agentName} for help.`;

    return new DynamicStructuredTool({
        name,
        description: toolDescription,
        schema: z.object({
            task_description: z.string().describe(
                "Description of what the next agent should do, including all relevant context."
            ),
        }),
        func: async ({ task_description }) => {
            // In a real implementation, this would transfer control to the specified agent
            // For now, we'll just return a success message
            return JSON.stringify({
                success: true,
                message: `Successfully transferred to ${agentName}`,
                task_description,
            });
        },
    });
};

const assignToResearchAgent = createHandoffTool(
    "research_agent",
    "Assign task to a researcher agent."
);

const assignToMathAgent = createHandoffTool(
    "math_agent",
    "Assign task to a math agent."
);

// Create supervisor agent
const supervisorAgent = await createReactAgent({
    llm: new ChatOpenAI({ model: "gpt-4-turbo", temperature: 0 }),
    tools: [assignToResearchAgent, assignToMathAgent],
    prompt: `
    You are a supervisor managing two agents:
    - a research agent. Assign research-related tasks to this agent
    - a math agent. Assign math-related tasks to this agent
    Assign work to one agent at a time, do not call agents in parallel.
    Do not do any work yourself.
  `,
    name: "supervisor",
});

// Create the multi-agent supervisor graph
const supervisorGraph = new StateGraph<MessagesState>({
    channels: {
        messages: {
            value: (x: MessagesState, y: MessagesState) => ({
                messages: [...x.messages, ...y.messages],
            }),
        },
    },
});

// Add nodes
supervisorGraph.addNode("supervisor", supervisorAgent);
supervisorGraph.addNode("research_agent", researchAgent);
supervisorGraph.addNode("math_agent", mathAgent);

// Add edges
supervisorGraph.addEdge(START, "supervisor");
supervisorGraph.addEdge("research_agent", "supervisor");
supervisorGraph.addEdge("math_agent", "supervisor");

// Set entry point
supervisorGraph.addEdge("supervisor", END);

// Compile the graph
const supervisor = supervisorGraph.compile();

// 3. Run the supervisor
export async function handleQuery(query: string) {
    const initialState = {
        messages: [new HumanMessage(query)],
    };

    for await (const step of supervisor.stream(initialState)) {
        console.log(step);
        console.log("---");
    }
}
