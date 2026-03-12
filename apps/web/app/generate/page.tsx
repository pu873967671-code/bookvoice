'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { starterResources } from '../../data/resources';
import { starterMoments, recommendedMomentIds } from '../../data/moments';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const apiUrl = (path: string) => `${API_BASE}${path}`;

export default function GeneratePage() {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [bookId, setBookId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);
    
    try {
      // 1. 创建书籍
      const bookRes = await fetch(apiUrl('/v1/books'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '粤语音频 - 爪读',
          sourceText: text,
          language: 'zh-CN',
          totalChars: text.length
        })
      });

      if (!bookRes.ok) throw new Error('创建书籍失败');
      const book = await bookRes.json();
      setBookId(book.id);
      
      // 2. 创建 TTS 任务
      const jobRes = await fetch(apiUrl('/v1/jobs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          type: 'tts'
        })
      });

      if (!jobRes.ok) {
        const err = await jobRes.json();
        if (err.error === 'quota_exceeded') {
          throw new Error(`配额不足：剩余 ${err.remainChars} 字符`);
        }
        throw new Error('创建任务失败');
      }
      
      const job = await jobRes.json();
      setJobId(job.id);
      setJobStatus('queued');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
      setIsGenerating(false);
    }
  };

  // 轮询任务状态
  useEffect(() => {
    if (!jobId || jobStatus === 'done' || jobStatus === 'failed') return;

    const poll = async () => {
      try {
        const res = await fetch(apiUrl(`/v1/jobs/${jobId}`));
        const job = await res.json();
        setJobStatus(job.status);
        
        if (job.status === 'done' || job.status === 'failed') {
          setIsGenerating(false);
          if (job.status === 'failed') {
            setError(job.error || '处理失败');
          }
        }
      } catch (err) {
        console.error('查询任务失败:', err);
      }
    };

    const timer = setInterval(poll, 2000);
    return () => clearInterval(timer);
  }, [jobId, jobStatus]);

  const handleSelectResource = (content: string) => {
    setText(content);
  };

  const handleSelectMoment = (word: string, example: string) => {
    setText(example);
  };

  const resolveDownloadUrl = async () => {
    if (!bookId) throw new Error('book_missing');

    const endpoint = apiUrl(`/v1/books/${bookId}/download`);
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`download_api_${res.status}`);

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (data?.url) return data.url as string;
      if (data?.mode === 'signed_url' && data?.url) return data.url as string;
      throw new Error('download_url_missing');
    }

    // 非 JSON 代表 API 直接返回音频文件
    return endpoint;
  };

  const handleDownload = async () => {
    if (!bookId) return;
    try {
      const url = await resolveDownloadUrl();
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    } catch {
      setError('下载失败');
    }
  };

  const handlePlay = async () => {
    if (!bookId) return;
    try {
      const url = await resolveDownloadUrl();
      setAudioUrl(url);
      setError(null);
    } catch {
      setError('播放失败');
    }
  };

  const randomMoments = starterMoments
    .filter(m => recommendedMomentIds.includes(m.id))
    .slice(0, 3);

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
              <Link className="text-orange-600 font-medium" href="/generate">转音频</Link>
              <Link className="text-zinc-700 transition hover:text-orange-600" href="/about">关于爪读</Link>
            </nav>
          </div>
        </header>

        <section className="py-12">
          <h1 className="text-4xl font-bold">转成粤语音频</h1>
          <p className="mt-4 text-lg text-zinc-600">
            将粤语文字一键转成自然嘅粤语音频，适合小朋友听、家长陪读。
          </p>
        </section>

        <section className="py-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              输入粤语文字
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="喺度输入你想转成音频嘅粤语内容..."
              className="w-full h-48 rounded-xl border border-zinc-200 p-4 text-zinc-700 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              disabled={isGenerating}
            />

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-zinc-500">
                {text.length} 字符
              </span>
              <button
                onClick={handleGenerate}
                disabled={!text.trim() || isGenerating}
                className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-orange-700 disabled:bg-zinc-300 disabled:cursor-not-allowed"
              >
                {isGenerating ? '生成中...' : '生成音频'}
              </button>
            </div>
          </div>
        </section>

        {/* 任务状态 */}
        {(jobStatus || error) && (
          <section className="py-6">
            <div className={`rounded-2xl p-6 ${error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              {error && (
                <div>
                  <h3 className="font-semibold text-red-700">❌ 错误</h3>
                  <p className="mt-2 text-red-600">{error}</p>
                </div>
              )}
              
              {jobStatus && !error && (
                <div>
                  <h3 className="font-semibold text-green-700">
                    {jobStatus === 'done' ? '✅ 生成完成' : 
                     jobStatus === 'queued' ? '⏳ 排队中...' :
                     jobStatus === 'running' ? '🎵 正在生成...' : `状态: ${jobStatus}`}
                  </h3>
                  
                  {jobStatus === 'done' && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={handlePlay}
                        className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                      >
                        在线播放
                      </button>
                      <button
                        onClick={handleDownload}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        下载音频
                      </button>
                      <button
                        onClick={() => {
                          setJobId(null);
                          setJobStatus(null);
                          setBookId(null);
                          setAudioUrl(null);
                        }}
                        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        重新生成
                      </button>
                    </div>
                    {audioUrl && (
                      <div className="mt-4">
                        <audio controls src={audioUrl} className="w-full" preload="none" />
                      </div>
                    )}
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 快速选择现有资源 */}
        <section className="py-6">
          <h2 className="text-xl font-semibold mb-4">或者选择现有内容</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {starterResources.slice(0, 6).map((resource) => (
              <button
                key={resource.id}
                onClick={() => handleSelectResource(resource.content || '')}
                disabled={isGenerating}
                className="rounded-xl border border-zinc-100 bg-white p-4 text-left shadow-sm transition hover:border-orange-200 hover:shadow-md disabled:opacity-50"
              >
                <h3 className="font-medium text-zinc-900">{resource.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{resource.category}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 粤语彩蛋娱乐模块 */}
        <section className="py-6">
          <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-6 border border-orange-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🥚</span>
              <h2 className="text-xl font-semibold">粤语彩蛋 · 学下港味</h2>
            </div>
            <p className="text-sm text-zinc-600 mb-4">
              生成音频之余，顺便学下地道粤语词汇！每个词都有港式场景同例句。
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {randomMoments.map((moment) => (
                <div
                  key={moment.id}
                  className="rounded-xl bg-white p-4 shadow-sm cursor-pointer transition hover:shadow-md"
                  onClick={() => handleSelectMoment(moment.word, moment.example)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-orange-600">{moment.word}</span>
                  </div>
                  <p className="text-sm text-zinc-600 line-clamp-2">{moment.meaning}</p>
                  <p className="mt-2 text-xs text-zinc-400 line-clamp-1">"{moment.example}"</p>
                </div>
              ))}
            </div>
            <Link
              href="/moments"
              className="mt-4 inline-block text-sm font-medium text-orange-600 hover:underline"
            >
              睇更多彩蛋 →
            </Link>
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
