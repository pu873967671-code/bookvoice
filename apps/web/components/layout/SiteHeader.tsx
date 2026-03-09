'use client';

import Link from 'next/link';
import { useState } from 'react';

const navItems = [
  { label: '首页', href: '/' },
  { label: '粤语转换', href: '/translate' },
  { label: '绘本', href: '/resources' },
  { label: '关于', href: '/about' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="py-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          爪读 <span className="text-zinc-500 font-semibold">ClawRead</span>
        </Link>

        {/* desktop nav */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-zinc-700 transition hover:text-orange-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm md:hidden"
          aria-label="打开导航菜单"
        >
          {open ? '关闭' : '菜单'}
        </button>
      </div>

      {/* mobile nav */}
      {open && (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm md:hidden">
          <nav className="flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm text-zinc-700 hover:bg-orange-50 hover:text-orange-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
