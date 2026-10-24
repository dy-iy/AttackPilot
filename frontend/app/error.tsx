"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="ap-route-message"><h1>页面暂时无法加载</h1><p>请重试或返回工作台重新打开任务。</p>
    <button onClick={reset}>重试</button> <Link href="/attackpilot">返回复盘工作台</Link></main>;
}
