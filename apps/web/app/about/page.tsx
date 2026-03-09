import Link from 'next/link';

export default function AboutPage() {
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
              <Link className="text-orange-600 font-medium" href="/about">关于爪读</Link>
            </nav>
          </div>
        </header>

        <section className="py-12">
          <h1 className="text-4xl font-bold">关于爪读</h1>
          <p className="mt-4 text-lg text-zinc-600">
            帮家庭发现、生成同沉淀正宗粤语内容。
          </p>
        </section>

        {/* 产品定位 */}
        <section className="py-6">
          <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold">点解要做爪读？</h2>
            <div className="mt-6 space-y-4 text-zinc-600 leading-relaxed">
              <p>
                粤语系一种有生命力嘅语言，但喺海外或者新一代小朋友入面，粤语环境越来越少见。
              </p>
              <p>
                爪读想做一个简单好用嘅工具，帮家庭搵到靠谱嘅粤语内容，将文字变成可以播嘅音频，同埋透过词汇、语气、场景保留返粤语独有嘅生活感。
              </p>
              <p>
                唔止系"识读"，更重要系"识港味"——保留粤语嘅语境、语气同文化记忆。
              </p>
            </div>
          </div>
        </section>

        {/* 三大核心功能 */}
        <section className="py-6">
          <h2 className="text-2xl font-semibold mb-4">爪读做紧嘅三件事</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
              <h3 className="font-semibold">粤语资源导航</h3>
              <p className="mt-3 text-sm text-zinc-600">
                按年龄、场景同类别，整理适合家庭使用嘅粤语内容。
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
              <h3 className="font-semibold">文字转音频</h3>
              <p className="mt-3 text-sm text-zinc-600">
                将粤语文字转成自然嘅语音，小朋友可以听，家长可以陪读。
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
              <h3 className="font-semibold">粤语彩蛋</h3>
              <p className="mt-3 text-sm text-zinc-600">
                透过词汇、语气、场景同港式文化联想，保留粤语嘅地道感。
              </p>
            </div>
          </div>
        </section>

        {/* 技术栈 */}
        <section className="py-6">
          <h2 className="text-2xl font-semibold mb-4">技术实现</h2>
          <div className="rounded-xl bg-zinc-50 p-6">
            <ul className="space-y-2 text-sm text-zinc-600">
              <li>• 前端：Next.js + React + Tailwind CSS</li>
              <li>• 后端：Node.js + Express</li>
              <li>• TTS：Azure Cognitive Services</li>
              <li>• 数据库：PostgreSQL + Redis</li>
              <li>• 开源：MIT License</li>
            </ul>
          </div>
        </section>

        {/* 联系方式 */}
        <section className="py-6">
          <h2 className="text-2xl font-semibold mb-4">联系我们</h2>
          <p className="text-zinc-600">
            有任何建议或者想合作？欢迎通过以下方式联系：
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <p className="text-zinc-600">
              GitHub: <a href="https://github.com/pu873967671-code/bookvoice" className="text-orange-600 hover:underline">pu873967671-code/bookvoice</a>
            </p>
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
