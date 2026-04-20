# OpenCLI Adapters Collection

Custom OpenCLI adapters maintained by [QingyaoAi](https://github.com/QingyaoAi).

## Available Adapters

| Site | Command | Description |
|------|---------|-------------|
| Bing | `opencli bing search <query>` | Bing search via browser DOM |
| Baidu | `opencli baidu search <query>` | Baidu search via browser DOM |
| Sogou | `opencli sogou search <query>` | Sogou search via browser DOM |

## Installation

### Method 1: Clone and Copy

```bash
# Clone the repository
git clone https://github.com/QingyaoAi/opencli-adapters.git

# Copy adapters to OpenCLI directory
cp -r opencli-adapters/bing ~/.opencli/clis/
cp -r opencli-adapters/baidu ~/.opencli/clis/
cp -r opencli-adapters/sogou ~/.opencli/clis/
```

### Method 2: Direct Install (if published)

```bash
opencli install bing
opencli install baidu
opencli install sogou
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

See [SKILL.md](SKILL.md) for detailed guide on creating new OpenCLI adapters.

## Contributing

1. Create a new adapter following the [SKILL.md](SKILL.md) guide
2. Test your adapter thoroughly
3. Submit a PR with your new adapter

## License

MIT