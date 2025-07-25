# Models Configuration

Wren Coder supports custom model configurations that allow you to define token limits and capabilities for both built-in and custom models.

## Built-in Models

Wren Coder comes with pre-configured support for these models:

- **DeepSeek Models**: `deepseek-chat`, `deepseek-reasoner`
- **Gemini Models**: Various Gemini 1.5, 2.0, and 2.5 models
- **Embedding Models**: `gemini-embedding-001`

## Custom Models Configuration

You can create a custom models configuration file to:
1. Add support for new models
2. Override token limits for built-in models
3. Define model capabilities and metadata

### Configuration File Format

Create a JSON file with the following structure:

```json
{
  "models": [
    {
      "name": "model-name",
      "tokenLimit": 100000,
      "description": "Model description (optional)",
      "provider": "provider-name (optional)",
      "capabilities": {
        "reasoning": true,
        "imageGeneration": false,
        "embedding": false
      }
    }
  ]
}
```

### Configuration File Location

By default, Wren Coder looks for models configuration at:
```
<project-directory>/.wren/models.json
```

You can also specify a custom path when calling the model configuration functions.

### Fields

- **name** (required): Unique identifier for the model
- **tokenLimit** (required): Maximum number of tokens the model can handle
- **description** (optional): Human-readable description of the model
- **provider** (optional): The provider/company that offers the model
- **capabilities** (optional): Object defining model capabilities:
  - `reasoning`: Whether the model supports advanced reasoning
  - `imageGeneration`: Whether the model can generate images
  - `embedding`: Whether the model is designed for embeddings

### Example Configuration

See `examples/models-config-example.json` for a complete example that shows:
- Adding custom models
- Overriding built-in model configurations
- Defining model capabilities

### Using Custom Models in Code

The models configuration is automatically loaded when you use the token limit functions:

```typescript
import { getTokenLimit, getModelConfig, isModelSupported } from '@wren/wren-coder-core';

// Get token limit (uses default config location)
const limit = getTokenLimit('custom-model');

// Get token limit with custom config path
const limit2 = getTokenLimit('custom-model', '/path/to/custom/models.json');

// Check if model is supported
const supported = isModelSupported('custom-model');

// Get full model configuration
const config = getModelConfig('custom-model');
```

### Configuration Validation

The configuration loader validates each model entry:
- `name` must be a non-empty string
- `tokenLimit` must be a positive number
- Invalid entries are skipped with a warning

### Precedence

When both built-in and custom configurations exist for the same model name, the custom configuration takes precedence.

### Caching

Model configurations are cached for performance. Use `clearModelConfigCache()` to force reloading when the configuration file changes.