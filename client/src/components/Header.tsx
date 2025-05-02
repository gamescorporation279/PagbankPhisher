import PagBankLogo from "./PagBankLogo";

export default function Header() {
  return (
    <header className="py-4 px-6 border-b border-gray-200 sticky top-0 bg-white z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <PagBankLogo className="w-32" />
        </div>
        <div className="flex items-center">
          <button className="border border-primary rounded-full px-4 py-1 text-primary font-medium flex items-center">
            PT
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
