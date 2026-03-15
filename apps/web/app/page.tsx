import Link from 'next/link';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

const featureCards = [
  {
    title: '粤语转换助手',
    description: '将书面语/普通话转成地道粤语口语，实时转换。',
    href: '/translate',
    gradient: 'from-orange-400 to-red-500',
    icon: '🗣️',
    size: 'large',
  },
  {
    title: '绘本专区',
    description: '3D 翻页效果，沉浸式阅读体验，自动播放粤语配音。',
    href: '/storybook-demo',
    gradient: 'from-purple-500 to-pink-500',
    icon: '📖',
    size: 'large',
  },
  {
    title: '粤语资源导航',
    description: '按年龄、场景同类别快速搵到靠谱粤语内容。',
    href: '/resources',
    gradient: 'from-blue-500 to-cyan-500',
    icon: '🧭',
    size: 'medium',
  },
  {
    title: '生成语音',
    description: '将文字转成粤语音频，支持多种声线。',
    href: '/generate',
    gradient: 'from-green-500 to-teal-500',
    icon: '🎵',
    size: 'medium',
  },
  {
    title: '粤语时刻',
    description: '记录同分享你嘅粤语学习时刻。',
    href: '/moments',
    gradient: 'from-yellow-400 to-orange-500',
    icon: '✨',
    size: 'small',
  },
  {
    title: '关于我哋',
    description: '了解爪读嘅故事同使命。',
    href: '/about',
    gradient: 'from-indigo-500 to-purple-500',
    icon: '💡',
    size: 'small',
  },
];

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
              爪读：帮家庭发现、生成同沉淀正宗粤语内容。
            </h1>

            <p className="mt-5 text-lg leading-8 text-zinc-600">
              搵粤语资源、将文字转成粤语音频，并透过词汇语境保留地道港味。
            </p>
          </div>
        </section>

        {/* Masonry Grid - 瀑布流卡片 */}
        <section className="py-10">
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {featureCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className={`
                  block break-inside-avoid rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1
                  ${card.size === 'large' ? 'h-80' : card.size === 'medium' ? 'h-64' : 'h-48'}
                `}
              >
                <div className={`h-full w-full bg-gradient-to-br ${card.gradient} p-6 flex flex-col justify-between text-white`}>
                  <div>
                    <div className="text-5xl mb-4">{card.icon}</div>
                    <h2 className="text-2xl font-bold mb-3">{card.title}</h2>
                    <p className="text-sm opacity-90 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  <div className="flex items-center text-sm font-medium">
                    立即体验 →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-10">
          <h2 className="text-2xl font-semibold mb-6 text-center">你可以咁用爪读</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: '睡前故事',
                description: '将短篇故事转成温和粤语音频，做晚安陪伴。',
                emoji: '🌙',
              },
              {
                title: '学校短文',
                description: '将教材或阅读材料变成可播版本，反复听更容易入耳。',
                emoji: '📚',
              },
              {
                title: '生活词汇',
                description: '遇到"搞掂""醒目"呢啲词，可以顺手睇返语境同港味。',
                emoji: '💬',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 hover:shadow-md transition"
              >
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm leading-7 text-zinc-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
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
                href="/storybook-demo"
                className="btn-dark"
              >
                体验 3D 绘本
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
