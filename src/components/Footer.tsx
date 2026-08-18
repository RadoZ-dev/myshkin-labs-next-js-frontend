// Server component — the year is resolved at build/request time, so there is
// no client/server mismatch to hydrate around.
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="myshkin-labs-footer">
      <div className="myshkin-labs-footer__inner max-w-7xl">
        <p className="myshkin-labs-footer__copyright">
          © {year} Myshkin Labs. Sound. Code. Experiments.
        </p>
      </div>
    </footer>
  );
}
