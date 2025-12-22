export function Card({ children }) {
  return <div className="rounded-xl bg-white shadow">{children}</div>;
}

export function CardHeader({ children }) {
  return <div className="border-b p-4">{children}</div>;
}

export function CardTitle({ children }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function CardDescription({ children }) {
  return <p className="text-sm text-gray-500">{children}</p>;
}

export function CardContent({ children }) {
  return <div className="p-4">{children}</div>;
}
