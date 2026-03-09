type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
};

export function SectionHeading({
  title,
  subtitle,
  align = 'left',
  className = '',
}: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start';

  return (
    <div className={`flex flex-col ${alignClass} ${className}`}>
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
