interface PagBankLogoProps {
  className?: string;
  darkMode?: boolean;
}

export default function PagBankLogo({ className = "", darkMode = false }: PagBankLogoProps) {
  // Usando a URL do logo oficial do PagBank
  return (
    <img 
      src="https://assets.pagseguro.com.br/access-fe/v0.1/_next/static/media/logo-pagbank.11b4ead9.svg" 
      alt="PagBank" 
      className={className} 
    />
  );
}
