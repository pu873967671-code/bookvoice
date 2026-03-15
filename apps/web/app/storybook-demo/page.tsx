'use client';

import { useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';

// 示例绘本数据
const storyPages = [
  {
    id: 0,
    type: 'cover',
    title: '小猫咪嘅冒险',
    subtitle: '一个关于勇气同友谊嘅故事',
    image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800',
  },
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800',
    text: '从前有只小猫咪，佢好钟意喺花园度玩。',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
    text: '有一日，佢发现咗一只好靓嘅蝴蝶。',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1573865526739-10c1d3a1f0cc?w=800',
    text: '小猫咪追住蝴蝶跑，跑到好远好远。',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800',
    text: '最后佢发现咗一个神秘嘅花园，入面有好多朋友。',
  },
  {
    id: 5,
    type: 'end',
    title: '完',
    subtitle: '多谢你睇我哋嘅故事 ❤️',
  },
];

// 单页组件
const Page = ({ data, pageNumber }: any) => {
  if (data.type === 'cover') {
    return (
      <div className="relative h-full w-full bg-gradient-to-br from-purple-500 to-pink-500 flex flex-col items-center justify-center text-white p-8">
        <div className="absolute inset-0 opacity-20">
          <img src={data.image} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-bold mb-4">{data.title}</h1>
          <p className="text-xl opacity-90">{data.subtitle}</p>
        </div>
      </div>
    );
  }

  if (data.type === 'end') {
    return (
      <div className="h-full w-full bg-gradient-to-br from-orange-400 to-red-500 flex flex-col items-center justify-center text-white p-8">
        <h2 className="text-5xl font-bold mb-4">{data.title}</h2>
        <p className="text-xl opacity-90">{data.subtitle}</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-white shadow-lg">
      <div className="h-2/3 overflow-hidden">
        <img
          src={data.image}
          alt={`Page ${pageNumber}`}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="h-1/3 p-6 flex items-center justify-center">
        <p className="text-xl text-gray-800 leading-relaxed text-center">
          {data.text}
        </p>
      </div>
      <div className="absolute bottom-4 right-4 text-sm text-gray-400">
        {pageNumber}
      </div>
    </div>
  );
};

export default function StorybookDemo() {
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  const nextPage = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipNext();
    }
  };

  const prevPage = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipPrev();
    }
  };

  const onFlip = (e: any) => {
    setCurrentPage(e.data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col items-center justify-center p-4">
      {/* 控制按钮 */}
      <div className="mb-6 flex gap-4 items-center">
        <button
          onClick={prevPage}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition disabled:opacity-50"
          disabled={currentPage === 0}
        >
          ← 上一页
        </button>
        
        <div className="px-6 py-3 bg-white rounded-lg shadow-lg">
          第 {currentPage + 1} / {storyPages.length} 页
        </div>

        <button
          onClick={nextPage}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition disabled:opacity-50"
          disabled={currentPage === storyPages.length - 1}
        >
          下一页 →
        </button>
      </div>

      {/* 3D 翻页书 */}
      <div className="shadow-2xl">
        <HTMLFlipBook
          ref={bookRef}
          width={400}
          height={600}
          size="stretch"
          minWidth={315}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1533}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={onFlip}
          className="demo-book"
        >
          {storyPages.map((page, index) => (
            <div key={page.id} className="page">
              <Page data={page} pageNumber={index + 1} />
            </div>
          ))}
        </HTMLFlipBook>
      </div>

      {/* 提示 */}
      <div className="mt-6 text-center text-gray-600">
        <p>💡 提示：可以用鼠标拖动书页翻页，或者点击书页边缘</p>
      </div>
    </div>
  );
}
