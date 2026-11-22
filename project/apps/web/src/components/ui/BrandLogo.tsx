export function BrandLogo({ size = 36 }: { size?: number }) {
  return (
    <span className="brand-logo-frame" style={{ width: size, height: size }}>
      <img
        src="/logo.svg"
        alt="CertChain Logo"
        width={size}
        height={size}
        className="brand-logo-img"
      />
    </span>
  );
}
