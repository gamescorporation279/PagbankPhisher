import PagBankLogo from "./PagBankLogo";

export default function Footer() {
  return (
    <footer className="bg-pagdark text-white py-6 mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center justify-center">
          <PagBankLogo className="w-32 mb-4" darkMode={true} />
          <p className="text-sm text-gray-300 text-center">
            © 1996-{new Date().getFullYear()} Todos os direitos reservados.<br />
            PAGSEGURO INTERNET INSTITUIÇÃO DE PAGAMENTO S/A - CNPJ/MF<br />
            08.561.701/0001-01<br />
            Av. Brigadeiro Faria Lima, 1.384, São Paulo - SP - CEP 01451-001
          </p>
        </div>
      </div>
    </footer>
  );
}
