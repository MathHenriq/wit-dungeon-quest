interface DeveloperSignatureProps {
  className?: string;
}

export function DeveloperSignature({ className = "" }: DeveloperSignatureProps) {
  return (
    <p className={`text-xs text-center text-white/20 ${className}`}>
      Desenvolvido por Matheus Macedo
    </p>
  );
}
