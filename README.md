# Wren Code

![Wren Code Screenshot](./docs/assets/wren-screenshot.png)

Wren Code is a command-line AI workflow tool forked from [**Qwen CLI Coder**](https://github.com/QwenLM/Qwen-Coder), which was itself a fork of [**Gemini CLI**](https://github.com/google-gemini/gemini-cli) (Please refer to [this document](./README.gemini.md) for more details). This version is currently optimized for deepseek models with enhanced parser support & tool support. With a goal to support local models.

> [!WARNING]
> Wren Code may issue multiple API calls per cycle, resulting in higher token usage, similar to Claude Code. We’re actively working to enhance API efficiency and improve the overall developer experience.

## Key Features

- **Code Understanding & Editing** - Query and edit large codebases beyond traditional context window limits
- **Workflow Automation** - Automate operational tasks like handling pull requests and complex rebases
- **Enhanced Parser** - Adapted parser specifically optimized for cli-coderr models

## Quick Start

### Prerequisites

Ensure you have [Node.js version 20](https://nodejs.org/en/download) or higher installed.

```bash
curl -qL https://www.npmjs.com/install.sh | sh
```

### Installation

```bash
npm install -g @wren/wren-coder
wren --version
```

Then run from anywhere:

```bash
wren
```

Or you can install it from source:

```bash
git clone https://github.com/ryanrawlingswang/wren-coder.git
cd cli-coder
npm install
npm install -g .
```

### API Configuration

Set your Wren API key (In Wren Code project, you can also set your API key in `.env` file). the `.env` file should be placed in the root directory of your current project.

> ⚠️ **Notice:** <br>
> **If you are in mainland China, please go to <https://bailian.console.aliyun.com/> to apply for your API key** <br>
> **If you are not in mainland China, please go to <https://modelstudio.console.alibabacloud.com/> to apply for your API key**

```bash
# If you are in mainland China, use the following URL:
# https://dashscope.aliyuncs.com/compatible-mode/v1
# If you are not in mainland China, use the following URL:
# https://dashscope-intl.aliyuncs.com/compatible-mode/v1
export OPENAI_API_KEY="your_api_key_here"
export OPENAI_BASE_URL="your_api_base_url_here"
export OPENAI_MODEL="your_api_model_here"
```

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

| Agent     | Model              | Accuracy |
| --------- | ------------------ | -------- |
| Wren Code | Wren3-Coder-480A35 | 37.5     |

## Project Structure

```
cli-coder/
├── packages/           # Core packages
├── docs/              # Documentation
├── examples/          # Example code
└── tests/            # Test files
```

## Development & Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) to learn how to contribute to the project.

## Troubleshooting

If you encounter issues, check the [troubleshooting guide](docs/troubleshooting.md).

## Acknowledgments

This project is a fork of [Qwen CLI Coder](https://github.com/QwenLM/Qwen-Coder), which was originally forked from [Google Gemini CLI](https://github.com/google-gemini/gemini-cli). We acknowledge and appreciate the excellent work of both the Gemini CLI team and the Qwen team. Our main contribution focuses on adaptations to better support Wren3-Coder models with enhanced parser and tool support.

## License

[LICENSE](./LICENSE)
