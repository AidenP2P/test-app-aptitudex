import logo from '@/assets/aptitudex-logo.png';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header = ({ title = 'AptitudeX', subtitle }: HeaderProps) => {
  return (
    <header className="px-6 pt-8 pb-6">
      <div className="flex items-center gap-3 mb-2">
        <a 
          href="https://aptitudex.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
        >
          <img src={logo} alt="AptitudeX" className="w-full h-full object-cover" />
        </a>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>
      {subtitle && (
        <p className="text-sm text-muted-foreground ml-[52px]">{subtitle}</p>
      )}
    </header>
  );
};
