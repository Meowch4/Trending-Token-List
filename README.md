# ⚡ Trending Token List — Tritium Web Interview Demo

这是一个针对 Tritium Research 前端团队面试的 Demo 项目，实现了一个 **trending token 列表**，通过 WebSocket 接入实时数据。

---

## 🧪 项目背景 &目的

- 这个项目是一个 **take-home 面试作业**，限定 3 天完成。  
- 使用 TypeScript + React + Next.js 

  - 支持 WebSocket 实时推送  
  - 心跳机制 (ping/pong)  
  - 数据压缩 (gzip) 解码  
  - 自动重连机制 + 后备数据合并 (batch 更新)  
  - Token 列表排序功能  
  - mock 模式，方便无真实 WS 使用  


## ✅ 功能 (Features)

1. **实时 WebSocket 接入**：连接 `wss://web-t.pinkpunk.io/ws`，订阅 `trending` topic。  
2. **gzip / ISO-8859-1 解码**：使用 `pako` 解压服务端压缩字符串。  
3. **心跳机制 (ping/pong)**：自动响应 `ping` 消息，保持连接。  
4. **自动重连**：断线时指数退避重连，并合并缓冲数据避免频繁重绘。  
5. **批量更新 (throttle)**：多条数据在短时间内合并后一次性更新到界面。  
6. **本地 mock 模式**：开发时可以启用 mock 推送数据，无需真实 WebSocket。  
7. **列表排序**：支持按 24h 涨跌、价格或交易量排序。  
8. **基础 UI**：Token 列表 + 行组件 +排序控制 +连接状态显示。  
9. **响应式设计**：简单样式兼容常见屏幕大小。

---

## 🎨 设计 & 配色 (Color Palette)

使用了面试题方给出的颜色（`Colors.txt`）：

| 语义 | 颜色值 |
|---|---|
| 主文本 (Primary) | `rgba(255, 255, 255, 1)` |
| 次文本 (Secondary) | `rgba(255, 255, 255, 0.4)` |
| 主粉色 (Pink) | `rgba(238, 171, 189, 1)` |
| 行 hover 背景 | `rgba(244, 188, 204, 1)` |
| 涨 (Up) | `rgba(70, 193, 127, 1)` |
| 跌 (Down) | `rgba(229, 56, 56, 1)` |
| 背景 | `rgba(0, 0, 0, 1)` |
| 边框 | `rgba(60, 43, 47, 1)` |

这些颜色都在全局 CSS 变量中定义，并在组件样式中使用。

---

## 🚀 如何本地运行

1. 克隆仓库  
   ```bash
   git clone https://github.com/Meowch4/Trending-Token-List.git
   cd Trending-Token-List
    ```
2. 安装依赖
  ```bash
  npm install
  ```
3. 本地开发运行
  ```bash
  npm run dev
  ```
4. mock 模式（如果你没法连接真实 WebSocket，比如没有 VPN）：
修改 useTrendingTokens({ mock: false }) 参数为 mock: true。
