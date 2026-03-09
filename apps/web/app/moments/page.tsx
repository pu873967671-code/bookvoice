import Link from 'next/link';
import { starterMoments, momentCategories, MomentCategory } from '../../data/moments';
import { TagList } from '../../components/shared/TagList';

export default function MomentsPage() {
  return (
    <main className="page-shell">
      <div className="page-container">
        <header className="py-4">
          <div className="flex items-center justify-between">
            <Link className="text-xl font-bold tracking-tight" href="/">
              爪读 <span className="text-zinc-500 font-semibold">ClawRead</span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm md:flex">
              <Link className="text-zinc-700 transition hover:text-orange-600" href="/">首页</Link>
              <Link className="text-zinc-700 transition hover:text-orange-600" href="/resources">资源</Link>
              <Link className="text-zinc-700 transition hover:text-orange-600" href="/generate">转音频</Link>
              <Link className="text-zinc-700 transition hover:text-orange-600" href="/about">关于爪读</Link>
            </nav>
          </div>
        </header>

        <section className="py-12">
          <h1 className="text-4xl font-bold">粤语彩蛋</h1>
          <p className="mt-4 text-lg text-zinc-600">
            唔止识读，仲识港味。透过词汇语气、场景同文化联想，保留粤语独有嘅生活感。
          </p>
        </section>

        {/* 分类标签 */}
        <section className="py-6">
          <div className="flex flex-wrap gap-2">
            {momentCategories.map((cat) => (
              <span key={cat} className="rounded-full bg-zinc-100 px-4 py-2 text-sm text-zinc-700">
                {cat}
              </span>
            ))}
          </div>
        </section>

        {/* 词汇列表 */}
        <section className="py-6">
          <h2 className="text-2xl font-semibold mb-4">全部词汇 ({starterMoments.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {starterMoments.map((moment) => (
              <div key={moment.id} className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-lg font-bold text-orange-600">
                    {moment.word[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{moment.word}</h3>
                    <p className="mt-2 text-sm text-zinc-600">{moment.meaning}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-zinc-500">语气：</span>
                    <span className="ml-2 text-zinc-700">{moment.tone}</span>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-500">场景：</span>
                    <span className="ml-2 text-zinc-700">{moment.scene}</span>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-500">港味：</span>
                    <span className="ml-2 text-zinc-700">{moment.cantoneseMoment}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-zinc-50 p-4">
                  <span className="text-xs text-zinc-500">例句</span>
                  <p className="mt-1 text-zinc-700">{moment.example}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {moment.category.map((cat) => (
                    <span key={cat} className="rounded-full bg-orange-50 px-2 py-1 text-xs text-orange-600">
                      {cat}
                    </span>
                  ))}
                </div>
                <TagList tags={moment.tags} />
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-16 border-t border-orange-100 py-10">
          <div className="text-center text-sm text-zinc-500">
            © 2026 ClawRead / 爪读
          </div>
        </footer>
      </div>
    </main>
  );
}
