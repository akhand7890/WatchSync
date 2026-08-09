/**
 * Footer — matches the Stitch landing page footer.
 */
export default function Footer() {
  return (
    <footer className="w-full py-10 px-6 flex flex-col md:flex-row justify-between items-center bg-[#0e0e10] border-t border-[#5b403e]/10">
      <div className="flex flex-col md:flex-row items-center gap-3 mb-6 md:mb-0">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="WatchSync Logo" className="w-5 h-5" />
          <span className="font-[Geist,sans-serif] font-bold text-[#e5e1e4] text-[14px]">WatchSync</span>
        </div>
        <span className="text-[#e4beba] hidden md:inline text-sm">|</span>
        <span className="text-[#e4beba] text-[14px] text-center md:text-left">
          Crafted with ❤️ by <span className="font-semibold text-[#ffb3ad]">Akhand</span>. © {new Date().getFullYear()} All rights reserved.
        </span>
      </div>
      <div className="flex flex-wrap justify-center gap-4 md:gap-6">
        {['Terms', 'Privacy', 'Tech Stack', 'GitHub'].map(link => {
          const isGitHub = link === 'GitHub'
          return (
            <a
              key={link}
              href={isGitHub ? "https://github.com" : "#"}
              target={isGitHub ? "_blank" : undefined}
              rel={isGitHub ? "noopener noreferrer" : undefined}
              className="text-[14px] text-[#e4beba] hover:text-[#ffb3ad] transition-colors opacity-80 hover:opacity-100"
            >
              {link}
            </a>
          )
        })}
      </div>
    </footer>
  )
}
