type TagListProps = {
  tags: string[];
  tone?: 'orange' | 'green' | 'zinc';
  className?: string;
};

export function TagList({
  tags,
  tone = 'orange',
  className = '',
}: TagListProps) {
  const toneClassMap = {
    orange: 'bg-orange-50 text-orange-700',
    green: 'bg-green-50 text-green-700',
    zinc: 'bg-zinc-100 text-zinc-700',
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className={`rounded-full px-3 py-1 text-xs font-medium ${toneClassMap[tone]}`}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
