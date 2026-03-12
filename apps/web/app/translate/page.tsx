'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const apiUrl = (path: string) => `${API_BASE}${path}`;

// Mock 转换规则（后续替换为 LLM API）
const cantoneseRules: Record<string, string> = {
  '今天': '今日',
  '明天': '听日',
  '昨天': '琴日',
  '这个': '呢个',
  '那个': '嗰个',
  '什么': '咩',
  '怎么': '点样',
  '为什么': '点解',
  '哪里': '边度',
  '谁': '边个',
  '多少': '几多',
  '去': '去',
  '买了': '买咗',
  '吃了': '食咗',
  '看了': '睇咗',
  '做了': '做咗',
  '一些': '啲',
  '很多': '好多',
  '一点': '少少',
  '市场': '街市',
  '橙子': '橙',
  '苹果': '苹果',
  '香蕉': '香蕉',
  '东西': '嘢',
  '孩子': '细路',
  '小朋友': '细路',
  '吃饭': '食饭',
  '喝水': '饮水',
  '睡觉': '瞓觉',
  '上班': '返工',
  '下班': '收工',
  '上学': '返学',
  '放学': '放学',
  '不用': '唔使',
  '不知道': '唔知',
  '不行': '唔得',
  '不是': '唔系',
  '没有': '冇',
  '别': '唔好',
  '不要': '唔好',
  '还在': '仲喺',
  '正在': '紧',
  '已经': '已经',
  '一会儿': '一阵间',
  '现在': '而家',
  '刚才': '头先',
  '以前': '之前',
  '以后': '之后',
  '非常': '好',
  '很': '好',
  '太': '太',
  '真的': '真系',
  '假的': '假嘅',
  '我的': '我嘅',
  '你的': '你嘅',
  '他的': '佢嘅',
  '她的': '佢嘅',
  '我们的': '我哋嘅',
  '你们的': '你哋嘅',
  '他们的': '佢哋嘅',
  '这里': '呢度',
  '那里': '嗰度',
  '上面': '上面',
  '下面': '下面',
  '里面': '入面',
  '外面': '出面',
};

function mockTranslate(text: string): string {
  let result = text;
  
  // 按词长度降序排列，优先替换长词
  const sortedKeys = Object.keys(cantoneseRules).sort((a, b) => b.length - a.length);
  
  for (const mandarin of sortedKeys) {
    const cantonese = cantoneseRules[mandarin];
    result = result.split(mandarin).join(cantonese);
  }
  
  return result;
}

export default function TranslatePage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speakError, setSpeakError] = useState('');
  const activeRequestIdRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // 实时转换（先本地秒出，再用 LLM 覆盖）
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setIsLoading(false);
      return;
    }

    // 先本地快速结果，避免“卡住”体感
    setOutput(mockTranslate(input));

    const requestId = ++activeRequestIdRef.current;

    // 防抖：延迟 250ms 再请求模型
    const timer = setTimeout(async () => {
      setIsLoading(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      try {
        const res = await fetch(apiUrl('/v1/translate/cantonese'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: input }),
          signal: controller.signal
        });

        if (res.ok) {
          const data = await res.json();
          // 只应用最新一次请求结果，避免旧请求回写
          if (activeRequestIdRef.current === requestId) {
            setOutput(data.translated || input);
          }
        }
      } catch (error) {
        // 保持本地快速结果，不额外覆盖
      } finally {
        clearTimeout(timeout);
        if (activeRequestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = async () => {
    if (!output) return;

    setSpeakError('');

    try {
      // 手机浏览器要同一个 audio 元素 + playsInline 更稳定
      const audio = audioRef.current || new Audio();
      audioRef.current = audio;
      audio.playsInline = true;
      audio.preload = 'auto';

      const res = await fetch(apiUrl('/v1/tts/speak'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: output })
      });

      if (!res.ok) {
        throw new Error(`tts_http_${res.status}`);
      }

      const data = await res.json();
      if (!data?.audio) {
        throw new Error('tts_audio_empty');
      }

      // base64 -> blob URL，移动端比 data URL 更稳
      const binary = atob(data.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
      objectUrlRef.current = objectUrl;
      audio.src = objectUrl;
      audio.load();
      await audio.play();
      return;
    } catch (error) {
      console.error('[translate] mobile play failed, fallback to speechSynthesis:', error);
      setSpeakError('手机播放失败，请再点一次；已切换系统语音兜底。');

      // 降级到浏览器 TTS
      const utterance = new SpeechSynthesisUtterance(output);
      utterance.lang = 'zh-HK';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const examples = [
    '今天去市场买了一些橙子',
    '小朋友在吃饭',
    '不知道他在做什么',
    '这个东西真的很好',
    '我们现在去哪里',
  ];

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
              <Link className="text-orange-600 font-medium" href="/translate">粤语转换</Link>
              <Link className="text-zinc-700 transition hover:text-orange-600" href="/about">关于</Link>
            </nav>
          </div>
        </header>

        <section className="py-12">
          <h1 className="text-4xl font-bold">粤语转换助手</h1>
          <p className="mt-4 text-lg text-zinc-600">
            将书面语/普通话转成地道粤语口语
          </p>
        </section>

        <section className="py-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 输入 */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                输入（书面语/普通话）
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="喺度输入你想转换嘅内容..."
                className="w-full h-64 rounded-xl border border-zinc-200 p-4 text-zinc-700 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <div className="mt-2 text-sm text-zinc-500">
                {input.length} 字符
              </div>
            </div>

            {/* 输出 */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                输出（地道粤语）
              </label>
              <div className="relative">
                <textarea
                  value={output}
                  readOnly
                  placeholder="转换结果会喺度显示..."
                  className="w-full h-64 rounded-xl border border-orange-200 bg-orange-50 p-4 pr-24 text-zinc-700 placeholder:text-zinc-400 disabled:opacity-75"
                  disabled={isLoading}
                />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-orange-50/80">
                    <div className="text-sm text-orange-600">转换中...</div>
                  </div>
                )}
                {output && !isLoading && (
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={handleSpeak}
                      className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700"
                      title="播放地道港人读法"
                    >
                      🎵 朗读
                    </button>
                    <button
                      onClick={handleCopy}
                      className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
                    >
                      {copied ? '✓ 已复制' : '复制'}
                    </button>
                  </div>
                )}
              </div>
              <audio ref={audioRef} playsInline className="hidden" />
              {speakError && (
                <div className="mt-2 text-sm text-amber-600">{speakError}</div>
              )}
              <div className="mt-2 text-sm text-zinc-500">
                {output.length} 字符
              </div>
            </div>
          </div>
        </section>

        {/* 示例 */}
        <section className="py-6">
          <h2 className="text-lg font-semibold mb-4">试试呢啲例子</h2>
          <div className="flex flex-wrap gap-2">
            {examples.map((example, i) => (
              <button
                key={i}
                onClick={() => setInput(example)}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 transition hover:border-orange-300 hover:bg-orange-50"
              >
                {example}
              </button>
            ))}
          </div>
        </section>

        {/* 说明 */}
        <section className="py-6">
          <div className="rounded-2xl bg-zinc-50 p-6">
            <h3 className="font-semibold text-zinc-900">✨ 智能粤语转换</h3>
            <p className="mt-2 text-sm text-zinc-600">
              使用 GLM-4 大模型进行地道粤语转换，支持语法、语气词同港式表达。
            </p>
            <div className="mt-4 text-xs text-zinc-500">
              模型：GLM-4-Flash | 语音：Azure 粤语女声 (HiuGaai)
            </div>
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
