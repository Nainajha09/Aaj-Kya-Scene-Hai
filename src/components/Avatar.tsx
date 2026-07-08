export default function Avatar({
  name,
  avatarUrl,
  size = 32,
  className = "",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name || "Profile photo"}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #b298e7, #f5b8d5)",
        fontSize: Math.max(9, size * 0.32),
      }}
      className={`rounded-full flex items-center justify-center font-extrabold text-[#1e1830] flex-shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}
