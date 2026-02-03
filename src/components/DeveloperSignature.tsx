interface DeveloperSignatureProps {
  className?: string;
}

export function DeveloperSignature({ className = "" }: DeveloperSignatureProps) {
  return (
    <p className={`text-xs text-muted-foreground/60 ${className}`}>
      Desenvolvido por Matheus Macedo
    </p>
  );
}
