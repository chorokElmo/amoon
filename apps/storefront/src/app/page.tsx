export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="bg-ink px-4 py-3 text-center text-xs tracking-widest text-cream">Livraison partout au Maroc</div>
      <header className="border-b border-ink/10 px-6 py-8 text-center">
        <span className="font-serif text-4xl tracking-[0.12em]">AMOON</span>
        <span className="mt-2 block text-[10px] tracking-[0.4em]">COLLECTION</span>
      </header>
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-taupe">Amoon Collection · Maroc</p>
        <h1 className="mt-7 font-serif text-4xl sm:text-5xl">Une nouvelle histoire se prépare.</h1>
        <p className="mt-6 max-w-sm text-sm leading-7 text-taupe">Notre boutique en ligne ouvrira bientôt. Retrouvez nos collections sur Instagram.</p>
        <a className="mt-9 border-b border-ink pb-2 text-xs tracking-widest" href="https://www.instagram.com/amoon.collection1/" target="_blank" rel="noopener noreferrer">DÉCOUVRIR AMOON</a>
      </section>
      <footer className="px-6 py-6 text-center text-xs text-taupe">© {new Date().getFullYear()} Amoon Collection</footer>
    </main>
  );
}
