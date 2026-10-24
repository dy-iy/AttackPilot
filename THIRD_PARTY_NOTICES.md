# 来源与第三方说明

此包从 CryptoRisk Agent 工作区中的链上攻击复盘模块提取，包含提取时已经存在的源码修改。打包没有重新授予整个项目的版权许可，也没有改变既有第三方文件和依赖的授权条件。

## 后端编译工具来源

原 `backend/app/attackpilot/package.json` 标注项目名 `fl4sc`、上游仓库 <https://github.com/wuzhy1ng/FL4SC> 和 `ISC` 元数据。提取包保留对应 Node 依赖清单和上游标注。该元数据不被扩展解释为整个 AttackPilot 前后端的统一许可证。

Solidity 编译器通过官方发布源按版本下载安装，不包含在源码包中。第三方 npm / Python 依赖的许可证以其各自发行包为准。

## 公开案例与归档报告

`dataset/raw`、`dataset/processed`、`data/demo-seed.json`、`data/report-translations.zh-CN.json` 和 `data/knowledge` 保留模块原有的公开案例、模型生成的历史分析、公开归档及中文派生文本。案例中保留的 `report_link`、`link`、数据来源和学习材料字段用于追溯，不表示本项目拥有所引用文章的版权。

历史模型分析可能存在错误或不完整内容；引用、收录和重新打包不构成对其结论的重新验证。未包含原实例的私有账号、私有任务或运行数据库。

## 主要基础组件

- Next.js、React、Ant Design、Lucide、react-markdown 与 remark-gfm：前端框架及界面组件。
- FastAPI、Pydantic、Uvicorn：API 与服务运行。
- FastMCP / MCP、OpenAI Python SDK：工具会话和兼容模型接口客户端。
- Web3.py、eth-abi、eth-utils、NetworkX、AnyTree：链上数据及图结构处理。
- Chainlink Data Feeds：历史价格参考与来源链接。
- Tenderly：配置后使用的动态轨迹与模拟服务。

本说明记录来源与依赖，不替代各上游项目的完整许可证文本或服务条款。
