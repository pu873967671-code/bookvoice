import Link from 'next/link';
import Masonry from 'react-masonry-css';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

const featureCards = [
  {
    title: '粤语转换助手',
    description: '将书面语/普通话转成地道粤语口语，实时转换。',
    href: '/translate',
    icon: '🗣️',
    color: 'from-orange-400 to-red-500',
    size: 'large',
  },
  {
    title: '绘本专区',
    description: '3D 翻页效果，沉浸式阅读体验，配合粤语配音。',
    href: '/storybook-demo',
    icon: '📖',
    color: 'from-purple-500 to-pink-500',
    size: 'large',
  },
  {
    title: '粤语资源导航',
    description: '按年龄、场景同类别快速搵到靠谱粤语内容。',
    href: '/resources',
    icon: '🧭',
    color: 'from-blue-400 to-cyan-500',
    size: 'medium',
  },
  {
    title: '生成语音',
    description: '将文字转成粤语音频，支持多种声线。',
    href: '/generate',
    icon: '🎵',
    color: 'from-green-400 to-teal-500',
    size: 'medium',
  },
  {
    title: '粤语时刻',
    description: '记录同分享你嘅粤语学习时刻。',
    href: '/moments',
    icon: '✨',
    color: 'from-yellow-400 to-orange-400',
    size: 'small',
  },
  {
    title: '关于我们',
    description: '了解爪读嘅故事同使命。',
    href: '/about',
    icon: '💡',
    color: 'from-indigo-400 to-purple-500',
    size: 'small',
  },
];

const breakpointColumns = {
  default: 3,
  1100: 2,
  700: 1,
};

export default function HomePage() {
  return (
    <main className="page-shell">
      <div className="page-container">
        <SiteHeader />

        {/* Hero Section */}
        <section className="py-12 sm:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <p className="mb-3 text-sm font-medium text-orange-600">
              最好跑嘅粤语家庭内容入口
            </p>

            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              爪读：帮家庭发现、生成同沉淀正宗粤语内容
            </h1>

            <p className="mt-5 text-lg leading-8 text-zinc-600">
              搵粤语资源、将文字转成粤语音频、沉浸式绘本阅读，保留地道港味。
            </p>
          </div>
        </section>

        {/* Masonry Cards */}
        <section className="py-10">
          <Masonry
            breakpointCols={breakpointColumns}
            className="flex -ml-4 w-auto"
            columnClassName="pl-4 bg-clip-padding"
          >
            {featureCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className={`block mb-4 rounded-2xl bg-gradient-to-br ${card.color} p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white group ${
                  card.size === 'large' ? 'min-h-[280px]' : card.size === 'medium' ? 'min-h-[220px]' : 'min-h-[180px]'
                }`}
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>
                <h2 className="text-2xl font-bold mb-3">{card.title}</h2>
                <p className="text-white/90 leading-relaxed">
                  {card.description}
                </p>
                <div className="mt-4 inline-flex items-center text-sm font-medium">
                  立即体验 →
                </div>
              </Link>
            ))}
          </Masonry>
        </section>

        {/* CTA Section */}
        <section className="py-14">
          <div className="rounded-3xl bg-zinc-900 px-6 py-8 text-white text-center">
            <h2 className="text-2xl font-semibold">唔止识读，更识港味。</h2>
            <p className="mt-3 max-w-2xl mx-auto text-sm leading-7 text-zinc-300">
              爪读唔止帮你读出粤语，仲帮你保留粤语嘅语境、语气同文化记忆。
            </p>

            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Link
                href="/translate"
                className="btn-primary"
              >
                试下转换粤语
              </Link>

              <Link
                href="/storybook-demo"
                className="btn-dark"
              >
                体验绘本阅读
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
