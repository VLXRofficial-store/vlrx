import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";
import { SizeGuideDialog } from "./SizeGuideDialog";
import { INSTAGRAM_URL } from "@/lib/products";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 py-14">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className="display text-gradient-chrome text-4xl">VLXR</span>
            <p className="mt-3 text-[0.6rem] tracking-brand text-muted-foreground">BORN RARE</p>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-3 text-[0.65rem] tracking-brand uppercase">
            <Link to="/shop" className="text-muted-foreground hover:text-gold">
              Shop
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-gold">
              About
            </Link>
            <SizeGuideDialog
              trigger={
                <button type="button" className="tracking-brand text-muted-foreground uppercase hover:text-gold">
                  Size Guide
                </button>
              }
            />
            <Link to="/contact" className="text-muted-foreground hover:text-gold">
              Contact
            </Link>
            <Link to="/return-policy" className="text-muted-foreground hover:text-gold">
              Return Policy
            </Link>
          </div>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-border text-chrome transition-colors hover:border-gold hover:text-gold"
          >
            <Instagram className="h-4 w-4" />
          </a>
        </div>

        <p className="mt-12 text-[0.6rem] tracking-brand text-muted-foreground">
          © 2025 VLXR. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}
