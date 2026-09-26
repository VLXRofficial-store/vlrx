import { MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/products";

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 grid h-13 w-13 place-items-center rounded-full border border-gold bg-background/90 text-gold shadow-[0_0_28px_var(--gold-soft)] backdrop-blur transition-colors hover:bg-gold hover:text-primary-foreground"
      style={{ height: "3.25rem", width: "3.25rem" }}
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
