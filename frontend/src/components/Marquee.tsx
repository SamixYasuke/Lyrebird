const endpoints = [
  "GET /orders/bread-and-akara",
  "GET /orders",
  "POST /orders/bread-and-akara/cancel",
  "GET /invoices",
  "PATCH /profile",
  "POST /orders/bokku-bread/refund",
  "GET /usage",
  "DELETE /tokens",
  "POST /sessions/checkout",
  "GET /shipments",
  "PUT /plan",
  "POST /webhooks",
  "GET /balance",
];

export function Marquee() {
  const row = [...endpoints, ...endpoints];
  return (
    <div
      className="overflow-hidden border-y border-line bg-ink-deep py-5"
      aria-hidden="true"
    >
      <div
        className="flex items-center gap-10 whitespace-nowrap"
        style={{ animation: "marquee 40s linear infinite" }}
      >
        {row.map((e, i) => (
          <span
            key={i}
            className="flex items-center gap-10 font-mono text-[13px] text-cream-solid/70"
          >
            {e}
            <span className="text-coral">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
