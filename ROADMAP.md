# Wren CLI Roadmap

Wren CLI is an open-source, model-agnostic AI agent that brings powerful coding assistance and intelligent terminal workflows to your command line. Originally forked from Qwen CLI Coder (itself derived from Gemini CLI), Wren focuses on speed, simplicity, and broad model support — with zero vendor lock-in.

This document outlines our approach to Wren CLI's roadmap, including our core principles and key initiatives. Our roadmap evolves over time and is actively tracked via GitHub Issues and Discussions.

As an Apache 2.0 open source project, we welcome and prioritize public contributions aligned with this roadmap. To propose a new direction, please open an issue.

## ⚠️ Disclaimer

This roadmap reflects our current thinking and is subject to change. Features, releases, and priorities may shift as the project and community evolve.

## 🎯 Guiding Principles

### Model Agnostic by Default

Wren is not tied to a specific provider or architecture. We aim to support any LLM accessible via an API or open protocol.

### CLI First, But Not CLI Only

While Wren is a CLI-native experience, it is built to serve as the foundation for other developer surfaces and SDKs.

### Composable, Reusable Agents

We prioritize modularity and extensibility to let you customize agents for specific workflows, automation, or integrations.

### Hackable and Lightweight

Designed for fast startup, local use, and low dependency overhead.

### Community First

Prioritize usability, speed, and support for real-world developer workflows. Merge good PRs quickly, maintain open discussions, and keep things unblocked.

## 🗺️ Roadmap Overview

We divide our roadmap into three major tracks: Model Integration, Agent Experience, and Developer Platform (SDK).

### 1. Model Integration

Goal: Support as many foundation models as possible via a modular adapter pattern.

| Milestone                                | Description                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| ✅ openai adapter                        | Basic support for OpenAI-compatible APIs (e.g., GPT-4, Claude via AWS Bedrock) |
| 🔲 ollama support                        | Local models with streaming (Mistral, Phi, etc.)                               |
| 🔲 Local embeddings support              | Local embedding models for semantic search and context retrieval               |
| 🔲 openrouter, together.ai, groq support | Community-supported fast inference endpoints                                   |
| 🔲 Multi-model fallback                  | Let users configure priority lists, e.g. "try Claude, fallback to GPT-3.5"     |
| 🔲 Model testing CLI                     | Benchmark model behavior against reproducible tasks                            |

### 2. Agent Experience

Goal: Make Wren an intelligent, productive CLI companion.

| Milestone                | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| ✅ Streaming + tool mode | Supports basic I/O and streaming output                      |
| 🔲 REPL improvements     | Inline history, undo/redo, scratchpad memory                 |
| 🔲 CLI plugins support   | Extensible plugin system for custom commands and workflows   |
| 🔲 File-aware workflows  | Pass context-aware files automatically                       |
| 🔲 Long-running agents   | Background tasks with state (like `wren watch`, `wren plan`) |
| 🔲 Autonomy primitives   | Planning, retries, follow-ups                                |
| 🔲 Prompt engineering UX | Aliases, macros, prompt editing commands                     |

### 3. Developer Platform (SDK)

Goal: Build an SDK on top of Wren that other apps and agents can reuse — like a Claude Code for all models.

| Milestone                    | Description                                                    |
| ---------------------------- | -------------------------------------------------------------- |
| 🔲 Agent SDK (alpha)         | Extract reusable agent logic into a package (e.g. `@wren/sdk`) |
| 🔲 Task tree / plan executor | Fork+join tasks, retry logic, conditional follow-ups           |
| 🔲 Agent adapters            | Use Wren as a shell plugin, GitHub bot, or Slack command       |
| 🔲 Shared memory store       | Bring-your-own-memory backend for session persistence          |
| 🔲 Web REPL & REST API       | Lightweight headless server mode for agent endpoints           |

## 🗓️ Release Timeline (Tentative)

| Quarter | Focus                                                       |
| ------- | ----------------------------------------------------------- |
| Q3 2025 | v1.0: OpenAI support, CLI polish, REPL upgrade              |
| Q4 2025 | Plugins, background agents, local model adapters            |
| Q1 2026 | SDK stable, external integrations, long-running memory      |
| Q2 2026 | Hosted UI, REST endpoints, hosted SaaS fork (if applicable) |

## 🤝 Contribution Guide

You can help by:

- Reporting bugs or broken behavior
- Contributing code (see `good first issue` label)
- Suggesting and testing new model adapters
- Helping build SDK examples and demos
- Improving docs and tutorials

👉 See CONTRIBUTING.md for setup instructions and style guidelines.
