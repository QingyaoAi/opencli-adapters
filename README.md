# OpenCLI Adapters Collection

Custom OpenCLI adapters maintained by [QingyaoAi](https://github.com/QingyaoAi).

## Available Adapters

| Site | Command | Description |
|------|---------|-------------|
| Bing | `opencli bing search <query>` | Bing search via browser DOM |
| Baidu | `opencli baidu search <query>` | Baidu search via browser DOM |
| Sogou | `opencli sogou search <query>` | Sogou search via browser DOM |

## Installation

Clone and copy to your OpenCLI directory:

```bash
# Clone the repository
git clone https://github.com/QingyaoAi/opencli-adapters.git

# Copy adapters to OpenCLI directory
cp -r opencli-adapters/bing ~/.opencli/clis/
cp -r opencli-adapters/baidu ~/.opencli/clis/
cp -r opencli-adapters/sogou ~/.opencli/clis/
```

## Usage Examples

```bash
# Bing search
opencli bing search "opencli" --limit 5

# Baidu search
opencli baidu search "人工智能" --limit 10

# Sogou search
opencli sogou search "机器学习" --limit 3
```

## Adapter Structure

Each adapter follows this structure:

```
site-name/
└── command.js    # CLI definition file
```

## Creating New Adapters

See [opencli-adapter-creator/SKILL.md](opencli-adapter-creator/SKILL.md) for detailed guide on creating new OpenCLI adapters.

## Contributing

1. Create a new adapter following the [opencli-adapter-creator/SKILL.md](opencli-adapter-creator/SKILL.md) guide
2. Test your adapter locally (`cp -r site-name ~/.opencli/clis/` then `opencli site-name command`)
3. Submit a PR with your new adapter

## License

MIT