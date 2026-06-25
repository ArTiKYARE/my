interface FooterProps {
  name: string;
}

export default function Footer({ name }: FooterProps) {
  return (
    <footer className="py-8 bg-background border-t border-border">
      <div className="container-main px-4 md:px-6">
        <p className="text-sm text-muted text-center md:text-left">
          © {new Date().getFullYear()} {name}. Все права защищены.
        </p>
      </div>
    </footer>
  );
}
