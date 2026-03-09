import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-orange-100 py-10">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <h2 className="text-lg font-semibold">
            爪读 <span className="text-zinc-500">ClawRead</span>
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600">
            帮家庭发现、生成同沉淀正宗粤语内容。
            唔止帮你将文字变成粤语声音，仲想保留粤语独有嘅语境同港味。
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">快速入口</h3>
            <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-600">
              <Link href="/" className="hover:text-orange-600">
                首页
              </Link>
              <Link href="/translate" className="hover:text-orange-600">
                粤语转换
              </Link>
              <Link href="/resources" className="hover:text-orange-600">
                资源导航
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900">说明</h3>
            <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-600">
              <p>面向粤语家庭内容场景</p>
              <p>先以 MVP 形式逐步完善</p>
              <p>自托管优先，力求最好跑</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-xs text-zinc-500">
        © {new Date().getFullYear()} ClawRead / 爪读
      </div>
    </footer>
  );
}
