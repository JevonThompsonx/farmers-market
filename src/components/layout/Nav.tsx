import Link from "next/link";

const links = [
  { href: "/products", label: "Products" },
  { href: "/farms", label: "Farms" },
  { href: "/search", label: "Search" },
];

export function Nav() {
  return (
    <nav aria-label="Main navigation">
      <ul className="flex items-center gap-6 list-none">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
