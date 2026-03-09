import Link from 'next/link';
import { starterResources, resourceQuickGroups, ResourceCategory, ResourceAgeRange } from '../../data/resources';
import { TagList } from '../../components/shared/TagList';

export default function ResourcesPage() {
  const categories: ResourceCategory[] = ['睡前故事', '日常对话', '儿歌短文', '家长陪读', '句型练习', '绘本风短文'];
  const ageRanges: ResourceAgeRange[] = ['0-3', '3-6', '6-9', 'all'];

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
              <Link className="text-orange-600 font-medium" href="/resources">资源</Link>
              <Link className="text-zinc-700 transition hover:text-orange-600" href="/generate">转音频</Link>
              <Link className="text-zinc-700 transition hover:text-orange-600" href="/about">关于爪读</Link>
            </nav>
          </div>
        </header>

        <section className="py-12">
          <h1 className="text-4xl font-bold">亲子绘本</h1>
          <p className="mt-4 text-lg text-zinc-600">
            陪小朋友一齐读绘本，听粤语，学表达。睡前、日常、随时开讲。
          </p>
        </section>

        {/* 快速组合 */}
        <section className="py-6">
          <h2 className="text-2xl font-semibold mb-4">今晚读乜？</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {resourceQuickGroups.map((group) => (
              <div key={group.id} className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-orange-600">{group.title}</h3>
                <p className="mt-2 text-sm text-zinc-600">{group.resourceIds.length} 个精选内容</p>
              </div>
            ))}
          </div>
        </section>

        {/* 按年龄分类 */}
        <section className="py-6">
          <h2 className="text-2xl font-semibold mb-4">按年龄选书</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {ageRanges.map((age) => {
              const count = starterResources.filter(r => r.ageRange === age).length;
              return (
                <div key={age} className="rounded-xl bg-white px-4 py-4 text-sm shadow-sm ring-1 ring-zinc-100">
                  <span className="font-medium">{age === 'all' ? '全年龄' : `${age} 岁`}</span>
                  <span className="ml-2 text-zinc-500">({count})</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 全部资源 */}
        <section className="py-6">
          <h2 className="text-2xl font-semibold mb-4">绘本库 ({starterResources.length})</h2>
          <div className="grid gap-4">
            {starterResources.map((resource) => (
              <div key={resource.id} className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{resource.title}</h3>
                    <p className="mt-2 text-sm text-zinc-600">{resource.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-600">{resource.category}</span>
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-600">
                        {resource.ageRange === 'all' ? '全年龄' : `${resource.ageRange}岁`}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-600">{resource.recommendedMode}</span>
                    </div>
                    <TagList tags={resource.tags} />
                  </div>
                </div>
                {resource.content && (
                  <div className="mt-4 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700 leading-relaxed">
                    {resource.content.slice(0, 150)}...
                  </div>
                )}
                <div className="mt-4 flex gap-3">
                  <Link href="/generate" className="text-sm font-medium text-orange-600 hover:underline">
                    播畀小朋友听 →
                  </Link>
                </div>
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
