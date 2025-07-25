# Wren Coder

[![npm version](https://badge.fury.io/js/@wren-coder%2Fwren-coder-cli.svg)](https://badge.fury.io/js/@wren-coder%2Fwren-coder-cli)
[![npm downloads](https://img.shields.io/npm/dm/@wren-coder/wren-coder-cli.svg)](https://www.npmjs.com/package/@wren-coder/wren-coder-cli)
[![License](https://img.shields.io/github/license/wren-coder/wren-coder-cli.svg)](https://github.com/wren-coder/wren-coder-cli/blob/main/LICENSE)
[![Node.js Version](https://img.shields.io/node/v/@wren-coder/wren-coder-cli.svg)](https://nodejs.org/)
[![GitHub stars](https://img.shields.io/github/stars/wren-coder/wren-coder-cli.svg?style=social)](https://github.com/wren-coder/wren-coder-cli/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/wren-coder/wren-coder-cli.svg?style=social)](https://github.com/wren-coder/wren-coder-cli/network/members)

[![CI](https://github.com/wren-coder/wren-coder-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/wren-coder/wren-coder-cli/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/wren-coder/wren-coder-cli/actions/workflows/e2e.yml/badge.svg)](https://github.com/wren-coder/wren-coder-cli/actions/workflows/e2e.yml)
[![Release](https://github.com/wren-coder/wren-coder-cli/actions/workflows/release.yml/badge.svg)](https://github.com/wren-coder/wren-coder-cli/actions/workflows/release.yml)
[![codecov](https://codecov.io/gh/wren-coder/wren-coder-cli/branch/main/graph/badge.svg)](https://codecov.io/gh/wren-coder/wren-coder-cli)

[![GitHub issues](https://img.shields.io/github/issues/wren-coder/wren-coder-cli.svg)](https://github.com/wren-coder/wren-coder-cli/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/wren-coder/wren-coder-cli.svg)](https://github.com/wren-coder/wren-coder-cli/pulls)
[![GitHub contributors](https://img.shields.io/github/contributors/wren-coder/wren-coder-cli.svg)](https://github.com/wren-coder/wren-coder-cli/graphs/contributors)
[![Discord](https://img.shields.io/discord/1321569992885776386?color=7289da&label=Discord&logo=discord&logoColor=white)](https://discord.gg/aUnD2AQgHu)

![Wren Coder Screenshot](./docs/assets/wren-screenshot.png)

Wren Coder is a model-agnostic command-line AI workflow tool forked from [**Qwen CLI Coder**](https://github.com/QwenLM/Qwen-Code), which was itself a fork of [**Gemini CLI**](https://github.com/google-gemini/gemini-cli) (Please refer to [this document](./README.gemini.md) for more details). Currently supports OpenAI-compatible APIs, with plans to expand support to non-OpenAI-compatible models in the future.

> [!WARNING]
> Wren Coder may issue multiple API calls per cycle, resulting in higher token usage, similar to Claude Code. We’re actively working to enhance API efficiency and improve the overall developer experience.

## Key Features

- **Model Agnostic** - Currently supports OpenAI-compatible APIs with plans for broader model support
- **Code Understanding & Editing** - Query and edit large codebases beyond traditional context window limits
- **Workflow Automation** - Automate operational tasks like handling pull requests and complex rebases
- **Enhanced Tool Support** - Comprehensive tool ecosystem for file operations, shell commands, and web integration

## Quick Start

### Prerequisites

Ensure you have [Node.js version 20](https://nodejs.org/en/download) or higher installed.

```bash
curl -qL https://www.npmjs.com/install.sh | sh
```

### Installation

```bash
npm install -g @wren-coder/wren-coder-cli
wren --version
```

Then run from anywhere:

```bash
wren
```

Or you can install it from source:

```bash
git clone https://github.com/wren-coder/wren-coder-cli.git
cd wren-coder
npm install
npm install -g .
```

### API Configuration

Wren Coder currently works with OpenAI-compatible APIs. Configure your API settings using environment variables or a `.env` file in your project root.

```bash
export OPENAI_API_KEY="your_api_key_here"
export OPENAI_BASE_URL="your_api_base_url_here"  # e.g., https://api.openai.com/v1
export OPENAI_MODEL="your_model_name_here"       # e.g., gpt-4, deepseek-coder, etc.
```

**Currently Supported (OpenAI-Compatible):**

- OpenAI (GPT-4, GPT-3.5)
- DeepSeek (deepseek-coder, deepseek-chat)
- Anthropic (via OpenAI-compatible proxy)
- Local models (Ollama, vLLM, etc.)
- Any OpenAI-compatible API endpoint

**Future Support Planned:**

- Native Ollama integration
- Direct Anthropic API support
- Additional model providers and protocols

See our [ROADMAP.md](./ROADMAP.md) for detailed plans on expanding model support.

## Usage Examples

### Explore Codebases

```sh
cd your-project/
wren
> Describe the main pieces of this system's architecture
```

### Code Development

```sh
> Refactor this function to improve readability and performance
```

### Automate Workflows

```sh
> Analyze git commits from the last 7 days, grouped by feature and team member
```

```sh
> Convert all images in this directory to PNG format
```

## Popular Tasks

### Understand New Codebases

```text
> What are the core business logic components?
> What security mechanisms are in place?
> How does the data flow work?
```

### Code Refactoring & Optimization

```text
> What parts of this module can be optimized?
> Help me refactor this class to follow better design patterns
> Add proper error handling and logging
```

### Documentation & Testing

```text
> Generate comprehensive JSDoc comments for this function
> Write unit tests for this component
> Create API documentation
```

## Benchmark Results

### Terminal-Bench

| Agent | Model | Accuracy |
| ----- | ----- | -------- |

## Project Structure

```
wren-coder/
├── packages/           # Core packages
│   ├── cli/           # Command-line interface
│   ├── core/          # Core functionality
│   └── vscode-ide-companion/  # VS Code extension
├── docs/              # Documentation
├── examples/          # Example code
└── tests/            # Test files
```

For detailed development plans and upcoming features, see our [ROADMAP.md](./ROADMAP.md).

## Development & Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) to learn how to contribute to the project.

## Troubleshooting

If you encounter issues, check the [troubleshooting guide](docs/troubleshooting.md).

## Acknowledgments

This project is a fork of [Qwen CLI Coder](https://github.com/QwenLM/Qwen-Code), which was originally forked from [Google Gemini CLI](https://github.com/google-gemini/gemini-cli). We acknowledge and appreciate the excellent work of both the Gemini CLI team and the Qwen team. Our main contribution focuses on creating a model-agnostic solution with enhanced tool support and improved compatibility across different AI providers.

## License

[LICENSE](./LICENSE)
