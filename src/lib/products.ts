export type Collection = "HERITAGE" | "STREET" | "GENESIS";

export type Product = {
  slug: string;
  name: string;
  collection: Collection;
  price: number;
  mrp: number;
  sizes: string[];
  stock: number;
  badge?: "LIMITED";
  description: string;
  badges?: string[];
  frontImage?: string;
  backImage?: string;
  extraImages?: string[];
};

export const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export const COLLECTIONS: { id: Collection; title: string; blurb: string }[] = [
  {
    id: "HERITAGE",
    title: "VLXR HERITAGE",
    blurb: "Crest work, archive cuts, built to outlive the season.",
  },
  {
    id: "STREET",
    title: "VLXR STREET",
    blurb: "Everyday armour. Heavy cotton, clean graphics.",
  },
  {
    id: "GENESIS",
    title: "VLXR GENESIS",
    blurb: "The first drop. Numbered, limited, never restocked.",
  },
];

export const PRODUCTS: Product[] = [
  {
    slug: "vlxr-heritage-crest-tee",
    name: "VLXR Heritage Crest Tee",
    collection: "HERITAGE",
    price: 1999,
    mrp: 2499,
    sizes: ["S", "M", "L", "XL", "XXL"],
    stock: 50,
    description:
      "The Heritage Crest Tee carries the VLXR emblem in a raised matte finish on 240GSM heavyweight cotton. Boxy oversized cut with a ribbed collar that holds its shape wash after wash.",
  },
  {
    slug: "vlxr-genesis-limited-drop",
    name: "VLXR Genesis Limited Drop",
    collection: "GENESIS",
    price: 1999,
    mrp: 2499,
    sizes: ["M", "L", "XL"],
    stock: 25,
    badge: "LIMITED",
    description:
      "Twenty-five pieces. The Genesis Limited Drop is our first release — numbered print, full back graphic, and a heavyweight 240GSM body. Once it's gone, it does not return.",
  },
  {
    slug: "vlxr-street-urban-tee",
    name: "VLXR Street Urban Tee",
    collection: "STREET",
    price: 1999,
    mrp: 2499,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    stock: 75,
    description:
      "Built for daily rotation. Minimal chest mark, bold back type, and the same 240GSM heavyweight cotton as the rest of the line. Oversized drop-shoulder fit.",
  },
];

export const SIZE_CHART = [
  { size: "XS", chest: '38"', length: '26"', shoulder: '16"' },
  { size: "S", chest: '40"', length: '27"', shoulder: '17"' },
  { size: "M", chest: '42"', length: '28"', shoulder: '18"' },
  { size: "L", chest: '44"', length: '29"', shoulder: '19"' },
  { size: "XL", chest: '46"', length: '30"', shoulder: '20"' },
  { size: "XXL", chest: '48"', length: '31"', shoulder: '21"' },
];

export const AGRA_PINCODES = [
  "282001",
  "282002",
  "282003",
  "282004",
  "282005",
  "282006",
  "282007",
  "282008",
  "282009",
  "282010",
];

export const WHATSAPP_NUMBER = "918817830829";
export const INSTAGRAM_URL = "https://instagram.com/vlxr";

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

export const formatINR = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
