export function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const row = items.map((t) => `${t}  ✦  `).join("");
  return (
    <div className={`overflow-hidden whitespace-nowrap bg-background py-2 ${className}`}>
      <div className="animate-marquee inline-block text-[0.65rem] font-semibold tracking-brand text-gold">
        <span>{row.repeat(4)}</span>
        <span>{row.repeat(4)}</span>
      </div>
    </div>
  );
}
