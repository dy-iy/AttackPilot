import Link from "next/link";

export default function NotFound() {
  return <main className="ap-route-message"><h1>页面不存在</h1><Link href="/attackpilot">返回复盘工作台</Link></main>;
}
