import Image from 'next/image';

type MindGuardMarkProps = {
  size: number;
};

export default function MindGuardMark({ size }: MindGuardMarkProps) {
  return (
    <Image
      src="/logo-mindguard.jpeg"
      alt="Logo MindGuard"
      width={size}
      height={size}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        maxWidth: 'none',
        objectFit: 'cover',
        objectPosition: 'center 38%',
        mixBlendMode: 'screen',
        flexShrink: 0,
      }}
    />
  );
}
