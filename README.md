# AttackPilot · 链上攻击复盘平台

从交易哈希出发，组织交易取证、跨交易调查、根因定位、补丁生成与执行验证，并保留可核对的价格和执行证据。

本项目由 CryptoRisk Agent 的链上攻击复盘模块独立整理而来，包含独立的 Next.js 前端、FastAPI 后端、账号会话、任务调度和公共历史案例。无需原项目的新闻、持仓、行情或模拟交易模块。

## 为什么做这个项目

一次攻击可能包含准备、触发和获利等多笔交易。安全人员需要整理调用、源码与资金变化，反复验证假设，再检查补丁效果并交付报告。AttackPilot 将这些步骤组织到同一个任务中，帮助减少重复的工具操作、上下文整理与结果交接。

- **事件级调查**：对用户提交或从案例库载入的多笔交易排序，识别辅助步骤与漏洞触发候选，在交易间切换并保留调查上下文。
- **修复与执行对照**：保存实际应用的源码修改，检查运行时代码和存储布局，组织原版与补丁版回放。
- **Chainlink 历史参考价**：为配置覆盖的资产保存 Feed、轮次、精度、报价时间及缺失原因，供历史估值与复核。
- **可追溯交付**：集中展示根因、路径、补丁、验证范围、原生币余额变化，支持 Markdown 和 JSON 导出。

当前多交易能力处理输入集合内的交易；没有实现从任意单个 Hash 自动发现所有关联交易，也没有通用的部署或初始化交易自动合成器。连续回放不能自动补足稀疏攻击步骤之间的全部背景交易。缺少证据或历史复现不一致时，系统会保留未确认或阻断状态。

## 环境

- 推荐 **Linux x86_64**，Windows 可使用 WSL2。
- Python 3.12 或更高版本；推荐 Node.js 24 与 npm，完整兼容范围见 `frontend/package.json`。
- 完整补丁验证依赖 Linux Solidity 编译器以及链上 RPC、区块浏览器、模型和 Tenderly 配置。
- 公共历史示例与本地知识检索不需要上述远端服务凭据。

调度器使用 POSIX 进程组和 `fcntl`；当前编译器安装工具面向 Linux x86_64。原生 Windows 不在当前完整运行支持范围内。

## 快速开始：浏览公共案例

先启动后端。在项目根目录执行：

```bash
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

编辑 `backend/.env`，为 `AUTH_PASSWORD_PEPPER` 设置一段自己的随机长字符串。未配置分析服务时，可以先使用公共历史案例。

```bash
cd backend
.venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

在另一个终端启动前端：

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

打开 <http://localhost:3000>，页面会进入 `/attackpilot`。前端通过同源 `/api/*` 代理访问后端，默认后端地址为 `http://127.0.0.1:8000`。

通过受信任的 HTTPS 反向代理部署时，保持后端仅能从该代理或私有网络访问，并设置 `TRUST_PROXY_HEADERS=1`，以正确识别 HTTPS 和设置 Secure Cookie。直接访问后端时保持默认的 `0`。

可以先浏览“查看示例案例”“任务库”“漏洞知识库”。创建自己的复盘任务需要先注册并登录；账号库和任务库均在首次使用时创建，不包含预设账号。

## 配置真实交易分析

在 `backend/.env` 中填写：

| 配置 | 用途 |
| --- | --- |
| `DEEPSEEK_API_KEY` | 调查、补丁、解释及按需翻译所用模型接口 |
| `DEEPSEEK_BASE_URL` | 模型服务地址，默认 `https://api.deepseek.com` |
| `ATTACKPILOT_RPC_URLS` | 按 `Ethereum` / `BNBChain` 配置 RPC URL 数组 |
| `ATTACKPILOT_SCAN_URLS` | 按网络配置完整区块浏览器 API URL 数组 |
| `ATTACKPILOT_TENDERLY_API_KEY` | 原始动态轨迹和补丁模拟服务密钥 |
| `ATTACKPILOT_TENDERLY_ACCOUNT` | Tenderly account slug |
| `ATTACKPILOT_TENDERLY_PROJECT` | Tenderly project slug |
| `AUTH_PASSWORD_PEPPER` | 账号密码散列的部署级附加秘密 |

模型调用沿用提取时的 `deepseek-flash` 配置；具体参数以 `backend/app/attackpilot/settings.py` 为准。

安装深度分析所需的 Node 编译工具依赖：

```bash
cd backend/app/attackpilot
npm ci
```

在 `backend` 目录安装案例对应的准确 Solidity 版本，例如：

```bash
.venv/bin/python -m app.attackpilot.prepare --compiler-version v0.8.23+commit.f704f362
```

安装命令从官方镜像获取清单和编译器，并核对 SHA-256。不同合约需要不同版本，单独安装 0.8.23 不表示所有历史案例都能编译。未验证合约的反编译能力可选依赖 Heimdall，可通过 `HEIMDALL_BIN_PATH` 或系统 PATH 配置。

访问 <http://127.0.0.1:8000/api/attackpilot/capabilities> 检查本地配置状态。配置存在不代表远端凭据、历史状态读取或完整案例执行已经通过验证。提交真实任务会使用配置的外部服务，并可能产生费用。

## Chainlink 的作用和范围

Chainlink Data Feeds 用于历史参考估值。默认映射覆盖 Ethereum 的 ETH/WETH 与 BNB Chain 的 BNB/WBNB，复用已配置的 RPC，通过只读调用获取价格；不需要为读取价格单独提供钱包或发送链上交易。

- 记录 Feed、轮次、原始报价、精度、更新时间和报价与交易的时间关系。
- 对过期、缺失、历史状态不可用等情况保留明确原因。
- 历史参考价与“协议实际读取”分别展示，参考报价不能证明目标协议调用了相同轮次。
- 原生币收益表统计指定交易发起地址的余额净变化，包含 Gas；不等同于跨地址、跨代币的完整美元利润。

接口背景：[Chainlink Data Feeds](https://docs.chain.link/data-feeds)、[历史数据](https://docs.chain.link/data-feeds/historical-data)。

## 目录

```text
.
├── frontend/                 # 独立 Next.js 工作台、登录注册与同源 API 代理
├── backend/
│   ├── main.py               # 独立 FastAPI 入口
│   ├── requirements.txt
│   └── app/
│       ├── attackpilot/      # Agent、工具、回放、API、静态案例及知识库
│       ├── api/              # 账号接口
│       └── services/         # 最小账号、安全和模型配置依赖
├── docs/ARCHITECTURE.md
├── scripts/package.py        # 重新生成干净的源码 ZIP 和摘要
└── THIRD_PARTY_NOTICES.md
```

主要页面：`/attackpilot`、`/attackpilot/tasks`、`/attackpilot/tasks/{task_id}`、`/attackpilot/knowledge`、`/attackpilot/briefing`。

API 文档：<http://127.0.0.1:8000/docs>。主要接口前缀为 `/api/auth` 与 `/api/attackpilot`。

## 数据与发布边界

保留的 `data/demo-seed.json`、中文译文、`dataset/raw`、`dataset/processed` 和知识库来自模块原有的公共历史案例。归档报告可能包含旧策略的分析或验证措辞，页面会标记历史示例；它们没有在此独立包中重新执行验证。

未打包原项目的真实 `.env`、私有任务、账号数据库、原始模拟运行文件、日志、编译器二进制、依赖目录或 Git 历史。原先未被当前执行代码消费的 `misc/model.pth`、`misc/SignItem.csv` 等遗留大资源亦未包含；当前本地知识检索不依赖这些文件或外部向量数据库。

运行时目录、环境文件和依赖均被 `.gitignore` 排除。更换实例、迁移账号数据时，应保持原 `AUTH_PASSWORD_PEPPER`，否则原密码校验会失败。

源码没有新增整个项目的许可证授权。上游来源、依赖许可和案例引用见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 上传 GitHub

解压后，在本目录创建自己的仓库。不要将 ZIP 文件本身当作源码目录提交：

```bash
git init
git add .
git commit -m "Extract standalone AttackPilot platform"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/YOUR_REPOSITORY.git
git push -u origin main
```

修改源码后，可从本目录重新打包：

```bash
python3 scripts/package.py
```

打包器会排除依赖、运行数据、环境秘密和测试缓存，生成源码清单、ZIP 及 SHA-256 文件；实际凭据仍需在自己的运行环境配置。
