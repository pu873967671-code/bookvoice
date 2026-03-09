import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '爪读 ClawRead',
  description: '帮家庭发现、生成同沉淀正宗粤语内容。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-HK">
      <body>{children}</body>
    </html>
  );
}
