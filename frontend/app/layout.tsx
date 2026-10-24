import type { Metadata } from "next";
import "antd/dist/reset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "AttackPilot · 链上攻击复盘平台",
  description: "多智能体链上攻击复盘：交易取证、根因定位、补丁生成、对照回放与价格证据。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
