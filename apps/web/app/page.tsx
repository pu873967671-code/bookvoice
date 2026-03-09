import Link from 'next/link';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

const capabilities = [
  {
    title: '粤语转换助手',
    description: '将书面语/普通话转成地道粤语口语，实时转换。',
    href: '/translate',
    cta: '立即转换',
  },
  {
    title: '粤语资源导航',
    description: '唔知边度搵靠谱粤语内容？按年龄、场景同类别快速开始。',
    href: '/resources',
    cta: '去睇资源',
  },
];

const useCases = [
  {
    title: '睡前故事',
    description: '将短篇故事转成温和粤语音频，做晚安陪伴。',
  },
  {
    title: '学校短文',
    description: '将教材或阅读材料变成可播版本，反复听更容易入耳。',
  },
  {
    title: '生活词汇',
    description: '遇到"搞掂""醒目"呢啲词，可以顺手睇返语境同港味。',
  },
];

const audience = [
  '想畀小朋友多听粤语嘅家长',
  '海外粤语家庭',
  '想保存母语环境嘅人',
  '想将文字转成粤语声音嘅创作者',
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <div className="page-container">
        <SiteHeader />

        <section className="py-12 sm:py-20">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-medium text-orange-600">
              最好跑嘅粤语家庭内容入口
            </p>

            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              爪读：帮家庭发现、生成同沉淀正宗粤语内容。
            </h1>

            <p className="mt-5 text-lg leading-8 text-zinc-600">
              搵粤语资源、将文字转成粤语音频，并透过词汇语境保留地道港味。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/translate"
                className="btn-primary"
              >
                立即转换粤语
              </Link>

              <Link
                href="/resources"
                className="btn-secondary"
              >
                浏览粤语资源
              </Link>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">爪读而家最核心嘅两件事</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              先帮家庭搵到内容，再变成可播音频，保留粤语独有嘅语气同港味。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {capabilities.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-600">
                  {item.description}
                </p>
                <Link
                  href={item.href}
                  className="mt-5 inline-block text-sm font-medium text-orange-600"
                >
                  {item.cta} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <h2 className="text-2xl font-semibold">你可以咁用爪读</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {useCases.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100"
              >
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <h2 className="text-2xl font-semibold">适合边个用？</h2>
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {audience.map((item) => (
              <li
                key={item}
                className="rounded-xl bg-white px-4 py-4 text-sm shadow-sm ring-1 ring-zinc-100"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="py-14">
          <div className="rounded-3xl bg-zinc-900 px-6 py-8 text-white">
            <h2 className="text-2xl font-semibold">唔止识读，更识港味。</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-300">
              爪读唔止帮你读出粤语，仲帮你保留粤语嘅语境、语气同文化记忆。
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/translate"
                className="btn-primary"
              >
                试下转换粤语
              </Link>

              <Link
                href="/resources"
                className="btn-dark"
              >
                先睇资源导航
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
