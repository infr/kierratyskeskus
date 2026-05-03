// JSON-LD script tag. Escapes characters that could allow JSON to break out
// of the script element or break JS string parsing if a crawler evaluates it.
// Standard OWASP approach for embedding JSON in HTML.

const LT = String.fromCharCode(60);
const GT = String.fromCharCode(62);
const AMP = String.fromCharCode(38);
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);

function escapeJson(s: string): string {
  return s
    .split(LT).join('\\u003c')
    .split(GT).join('\\u003e')
    .split(AMP).join('\\u0026')
    .split(LS).join('\\u2028')
    .split(PS).join('\\u2029');
}

export function JsonLd({ data }: { data: unknown }) {
  const json = escapeJson(JSON.stringify(data));
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
