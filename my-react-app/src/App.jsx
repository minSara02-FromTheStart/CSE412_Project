import { useState, useMemo } from "react";
import { ChevronDown, ArrowUpDown, Check } from "lucide-react";

// Same product data as your products section — no backend/database involved.
const PRODUCTS = [
  { name: "Almonds", price: 1200, img: "https://i1-c.pinimg.com/1200x/6f/55/82/6f558209bca8c009629e9ebb40fa8633.jpg", desc: "Fresh and healthy premium almonds." },
  { name: "Cashew", price: 1500, img: "https://i1-c.pinimg.com/1200x/1e/e9/29/1ee9291e3ad643e80e08b03112e2d3c9.jpg", desc: "Organic and crunchy cashew nuts." },
  { name: "Pistachio", price: 1800, img: "https://i1-c.pinimg.com/736x/14/92/75/149275669c5e1822264c94ec1920d694.jpg", desc: "High quality pistachios full of nutrition." },
  { name: "Dates", price: 1000, img: "https://i.pinimg.com/736x/a9/a6/e1/a9a6e1d15fe059fe44d216ae97c383ec.jpg", desc: "Sweet and delicious dates packed with nutrients." },
  { name: "Walnuts", price: 2200, img: "https://i.pinimg.com/736x/66/7d/d2/667dd27b774d8f7b6a6757a89cf83530.jpg", desc: "Sweet and delicious walnuts packed with nutrients." },
  { name: "Dry Mangoes", price: 1200, img: "https://i.pinimg.com/736x/e6/67/5e/e6675e4c102e8b997f453732135011be.jpg", desc: "Flavorful dry mangoes, perfect for snacking." },
  { name: "Dry Apricots", price: 1400, img: "https://i.pinimg.com/736x/cd/0d/27/cd0d27f24c8d4ca872a337d998b1b904.jpg", desc: "Sweet and tangy dry apricots, packed with nutrients." },
  { name: "Dry kiwi", price: 1400, img: "https://i.pinimg.com/736x/0c/44/4b/0c444b2fa3841e5d125085bac2db7891.jpg", desc: "Sweet and tangy dry kiwi, packed with nutrients." },
  { name: "Raisins", price: 800, img: "https://i1-c.pinimg.com/1200x/c5/9f/30/c59f301e2423b6ba3d917a9707ff413c.jpg", desc: "Juicy and flavorful raisins, perfect for snacking." },
];

const FILTER_OPTIONS = [
  { id: "default", label: "Default" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "name-asc", label: "Name: A to Z" },
  { id: "name-desc", label: "Name: Z to A" },
];

export default function ProductFilter() {
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("default");

  const sortedProducts = useMemo(() => {
    const list = [...PRODUCTS];
    switch (activeFilter) {
      case "price-asc":
        return list.sort((a, b) => a.price - b.price);
      case "price-desc":
        return list.sort((a, b) => b.price - a.price);
      case "name-asc":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return list.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return list;
    }
  }, [activeFilter]);

  const activeLabel = FILTER_OPTIONS.find((o) => o.id === activeFilter).label;

  return (
    <section className="bg-[#FAF8F2] min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#2F4F3F]">Our Products</h1>

          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 bg-white border border-[#2F4F3F]/20 rounded-full px-4 py-2 text-sm font-medium text-[#2F4F3F] hover:border-[#2F4F3F]/50 transition-colors shadow-sm"
            >
              <ArrowUpDown size={16} />
              Filter: {activeLabel}
              <ChevronDown
                size={16}
                className={`transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              <>
                {/* click-away layer */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#2F4F3F]/15 rounded-xl shadow-lg z-20 overflow-hidden">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setActiveFilter(opt.id);
                        setOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left text-[#2F4F3F] hover:bg-[#F4F1EA] transition-colors"
                    >
                      {opt.label}
                      {activeFilter === opt.id && <Check size={15} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedProducts.map((p) => (
            <div
              key={p.name}
              className="bg-white rounded-2xl shadow-sm border border-[#2F4F3F]/10 overflow-hidden hover:shadow-md transition-shadow"
            >
              <img src={p.img} alt={p.name} className="w-full h-40 object-cover" />
              <div className="p-4">
                <h2 className="font-semibold text-[#2F4F3F]">{p.name}</h2>
                <h3 className="text-[#A0522D] font-bold mt-1">৳{p.price} / KG</h3>
                <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
                <button className="mt-3 w-full bg-[#2F4F3F] text-white text-sm py-2 rounded-full hover:bg-[#26402F] transition-colors">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
