import { FormEvent, useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { Icon, IconName } from "./components/Icons";
import { api, ListingItem, User } from "./services/api";

const AuthModal = lazy(() => import("./components/AuthModal"));
const SellModal = lazy(() => import("./components/SellModal"));
const ListingDetailModal = lazy(() => import("./components/ListingDetailModal"));
const ChatModal = lazy(() => import("./components/ChatModal"));

const initialCategories: {
  label: string;
  icon: IconName;
  count: string;
  color: string;
}[] = [
  { label: "Books", icon: "book", count: "240+ items", color: "bg-[#EEE9FF]" },
  {
    label: "Electronics",
    icon: "laptop",
    count: "180+ items",
    color: "bg-[#E0F1FF]",
  },
  {
    label: "Hostel Items",
    icon: "home",
    count: "130+ items",
    color: "bg-[#FFF0D9]",
  },
  { label: "Sports", icon: "ball", count: "90+ items", color: "bg-[#E6F8E9]" },
  {
    label: "Clothing",
    icon: "shirt",
    count: "160+ items",
    color: "bg-[#FFE8EA]",
  },
  {
    label: "Accessories",
    icon: "bag",
    count: "110+ items",
    color: "bg-[#F1ECDF]",
  },
  {
    label: "Vehicles",
    icon: "vehicle",
    count: "50+ items",
    color: "bg-[#E0F4FF]",
  },
  { label: "Other", icon: "more", count: "Browse all", color: "bg-[#E9EDF1]" },
];

function Logo({ className = "" }: { className?: string }) {
  return (
    <button
      className={`group flex items-center gap-2.5 text-left ${className}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="CampusCart home"
    >
      <div className="relative">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-[#6D45D8] to-[#9265FF] text-white shadow-md shadow-[#6D45D8]/30 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-4deg]">
          {/* Custom Shopping Cart Icon */}
          <svg
            className="h-5 w-5 fill-none stroke-current stroke-[2.2]"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="20" r="1.5" fill="currentColor" />
            <circle cx="18" cy="20" r="1.5" fill="currentColor" />
            <path d="M2.5 3.5h3.2l2.3 11.2a1.8 1.8 0 0 0 1.8 1.4h8.8a1.8 1.8 0 0 0 1.8-1.4l1.6-7.2H6.6" />
          </svg>
        </div>
        {/* Neon Lime Campus Sparkle */}
        <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-[#C8FF35] text-[#102033] ring-2 ring-white shadow-sm transition-transform group-hover:rotate-12">
          <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2L14.8 8.6L22 9.4L16.7 14.1L18.2 21.2L12 17.5L5.8 21.2L7.3 14.1L2 9.4L9.2 8.6L12 2Z" />
          </svg>
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-[20px] font-black tracking-[-0.035em] leading-tight text-[#102033]">
          Campus<span className="text-[#6D45D8]">Cart</span>
        </span>
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#7B8594]">
          Student Marketplace
        </span>
      </div>
    </button>
  );
}

function ListingCard({
  item,
  onOpenDetails,
  onToggleSave,
}: {
  item: ListingItem;
  onOpenDetails: (item: ListingItem) => void;
  onToggleSave: (id: number) => void;
}) {
  const isSold = item.status === "sold";
  const isProcessing = item.status === "processing" || item.status === "reserved";

  return (
    <article className="group min-w-0 cursor-pointer">
      <div
        onClick={() => onOpenDetails(item)}
        className="relative mb-4 aspect-[1.08] overflow-hidden rounded-[22px] bg-[#ECEBE7]"
      >
        <img
          className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.035] ${
            isSold ? "grayscale-[40%] contrast-90" : isProcessing ? "contrast-95" : ""
          }`}
          src={item.image}
          alt={item.title}
          loading="lazy"
          decoding="async"
        />
        {isSold ? (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
            <span className="rounded-xl bg-red-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-xl rotate-[-6deg] border border-white">
              SOLD
            </span>
          </div>
        ) : isProcessing ? (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500/95 px-3 py-1.5 text-[11px] font-black tracking-wide text-white shadow-md backdrop-blur flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-white animate-pulse" />
            PROCESSING
          </span>
        ) : (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-[#314055] backdrop-blur">
            {item.tag || item.condition}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(item.id);
          }}
          aria-label={item.isSaved ? "Remove from saved" : "Save listing"}
          className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full backdrop-blur transition ${
            item.isSaved
              ? "bg-[#6D45D8] text-white"
              : "bg-white/90 text-[#102033] hover:bg-white"
          }`}
        >
          <Icon
            name="heart"
            size={18}
            className={item.isSaved ? "fill-current" : ""}
          />
        </button>
      </div>

      <div
        onClick={() => onOpenDetails(item)}
        className="flex items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-bold tracking-[-0.02em] text-[#102033] group-hover:text-[#6D45D8] transition">
            {item.title}
          </h3>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#667085]">
            <Icon name="map" size={14} />
            <span>{item.place}</span>
            <span className="text-[#C1C7CF]">·</span>
            <span>{item.time}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p
            className={`text-[17px] font-extrabold tracking-[-0.03em] ${
              isSold ? "line-through text-gray-400" : isProcessing ? "text-amber-600" : "text-[#102033]"
            }`}
          >
            {item.price}
          </p>
          {isSold ? (
            <span className="text-[10px] font-extrabold text-red-600 uppercase">
              SOLD
            </span>
          ) : isProcessing ? (
            <span className="text-[10px] font-extrabold text-amber-600 uppercase">
              PROCESSING
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-[#E8E8E3] pt-3">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[#E8E1FF] text-[9px] font-extrabold text-[#6543BF]">
          {item.seller ? item.seller[0] : "S"}
        </span>
        <span className="text-xs font-semibold text-[#5E6875]">
          Listed by {item.seller}
        </span>
        {isSold ? (
          <span className="ml-auto rounded bg-red-100 px-2 py-0.5 text-[9px] font-black text-red-700">
            SOLD
          </span>
        ) : isProcessing ? (
          <span className="ml-auto rounded bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800">
            ⏳ IN PROCESS
          </span>
        ) : (
          <span
            className="ml-auto h-1.5 w-1.5 rounded-full bg-[#5ECC70]"
            title="Verified student"
          />
        )}
      </div>
    </article>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    api.auth.getStoredUser()
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTab, setSelectedTab] = useState<"All" | "Near you" | "Newest" | "Saved">("All");
  const [notice, setNotice] = useState("");
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [categories, setCategories] = useState(initialCategories);
  const [loading, setLoading] = useState(false);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatListingId, setChatListingId] = useState<number | null>(null);
  const [chatSellerId, setChatSellerId] = useState<string | null>(null);

  // Notice toast
  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3500);
  };

  // Fetch initial profile and categories
  useEffect(() => {
    const fetchMetaAndUser = async () => {
      try {
        if (localStorage.getItem("unideal_token")) {
          const userRes = await api.auth.getMe();
          if (userRes.success) setCurrentUser(userRes.user);
        }
      } catch {
        api.auth.logout();
        setCurrentUser(null);
      }

      try {
        const metaRes = await api.meta.getMeta();
        if (metaRes.success && metaRes.categories) {
          const mapped = metaRes.categories.map((c) => ({
            label: c.label,
            icon: (c.icon as IconName) || "more",
            count: c.count,
            color: c.color,
          }));
          setCategories(mapped);
        }
      } catch (err) {
        console.warn("Could not load backend metadata, using defaults.", err);
      }
    };

    fetchMetaAndUser();
  }, []);

  // Fetch live listings whenever category, active query, or tab changes
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        if (selectedTab === "Saved") {
          if (!currentUser) {
            setListings([]);
            setLoading(false);
            return;
          }
          const res = await api.listings.getSaved();
          setListings(res.listings || []);
        } else {
          const res = await api.listings.getAll({
            q: activeQuery,
            category: selectedCategory,
            tab: selectedTab,
          });
          setListings(res.listings || []);
        }
      } catch (err) {
        console.error("Failed to fetch listings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [selectedCategory, activeQuery, selectedTab, currentUser]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setActiveQuery(query.trim());
    if (query.trim()) {
      showNotice(`Searching campus for “${query.trim()}”`);
    } else {
      showNotice("Showing all available campus items");
    }
    document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleToggleSave = async (id: number) => {
    if (!currentUser) {
      showNotice("Please log in to save items to your wishlist");
      setAuthModalOpen(true);
      return;
    }

    try {
      const res = await api.listings.toggleSave(id);
      showNotice(res.message);
      setListings((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, isSaved: res.saved, savesCount: res.savesCount }
            : item
        )
      );
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem((prev) =>
          prev ? { ...prev, isSaved: res.saved, savesCount: res.savesCount } : null
        );
      }
    } catch (err: any) {
      showNotice(err.message || "Failed to update saved item");
    }
  };

  const handleOpenChat = (listingId: number, sellerId?: string) => {
    if (!currentUser) {
      showNotice("Please log in to chat with sellers");
      setAuthModalOpen(true);
      return;
    }
    setChatListingId(listingId);
    setChatSellerId(sellerId || null);
    setChatModalOpen(true);
  };

  const handleListingUpdated = (listingId: number, newStatus: string) => {
    if (newStatus === "deleted") {
      setListings((prev) => prev.filter((item) => item.id !== listingId));
      if (selectedItem?.id === listingId) setSelectedItem(null);
    } else {
      setListings((prev) =>
        prev.map((item) =>
          item.id === listingId ? { ...item, status: newStatus as any } : item
        )
      );
      if (selectedItem?.id === listingId) {
        setSelectedItem((prev) =>
          prev ? { ...prev, status: newStatus as any } : null
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F4] text-[#102033]">
      {notice && (
        <div className="fixed left-1/2 top-5 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#102033] px-5 py-3 text-sm font-semibold text-white shadow-xl animate-in fade-in duration-150">
          <Icon name="spark" size={16} className="text-[#C8FF35]" />
          {notice}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#E8E8E3] bg-[#F8F8F4]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center px-5 lg:px-8">
          <Logo />
          <nav className="ml-14 hidden items-center gap-8 md:flex">
            <button
              onClick={() =>
                document
                  .getElementById("marketplace")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="nav-link"
            >
              Browse
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("categories")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="nav-link"
            >
              Categories
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("how")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="nav-link"
            >
              How it works
            </button>
          </nav>

          <div className="ml-auto hidden items-center gap-3 md:flex">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setChatListingId(null);
                    setChatModalOpen(true);
                  }}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-white border border-[#E0E0D8] text-[#102033] hover:border-[#6D45D8] transition"
                  title="Messages"
                >
                  <Icon name="message" size={18} />
                </button>
                <div className="flex items-center gap-2 rounded-xl border border-[#DFDFD8] bg-white px-3 py-1.5 shadow-sm">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#E5F8D2] text-xs font-black text-[#2B560C]">
                    {currentUser.name[0]}
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-[#102033] leading-none">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-[#717A88]">
                      {currentUser.campusLocation || "Campus"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      api.auth.logout();
                      setCurrentUser(null);
                      showNotice("Signed out successfully");
                    }}
                    className="ml-2 text-[11px] font-bold text-red-500 hover:text-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#102033] hover:bg-white transition"
              >
                Log in
              </button>
            )}

            <button
              onClick={() => {
                if (!currentUser) {
                  showNotice("Please sign in or select a demo account to post");
                  setAuthModalOpen(true);
                } else {
                  setSellModalOpen(true);
                }
              }}
              className="flex items-center gap-2 rounded-xl bg-[#102033] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#6D45D8]"
            >
              <Icon name="plus" size={17} /> Sell something
            </button>
          </div>

          <button
            className="ml-auto grid h-10 w-10 place-items-center rounded-xl bg-white md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <Icon name={menuOpen ? "x" : "menu"} />
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[#E8E8E3] bg-[#F8F8F4] px-5 py-5 md:hidden">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-xl px-4 py-3 text-left text-sm font-bold hover:bg-white"
              >
                Browse
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-xl px-4 py-3 text-left text-sm font-bold hover:bg-white"
              >
                Categories
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  document.getElementById("how")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-xl px-4 py-3 text-left text-sm font-bold hover:bg-white"
              >
                How it works
              </button>
              {currentUser ? (
                <button
                  onClick={() => {
                    api.auth.logout();
                    setCurrentUser(null);
                    setMenuOpen(false);
                  }}
                  className="rounded-xl px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-white"
                >
                  Log out ({currentUser.name})
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="rounded-xl px-4 py-3 text-left text-sm font-bold hover:bg-white"
                >
                  Log in
                </button>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  if (!currentUser) setAuthModalOpen(true);
                  else setSellModalOpen(true);
                }}
                className="mt-2 rounded-xl bg-[#102033] px-4 py-3 text-sm font-bold text-white"
              >
                Sell something
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-28 top-20 h-72 w-72 rounded-full bg-[#EAE2FF]" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-[#E8FFAA]" />
          <div className="relative mx-auto grid min-h-[650px] max-w-[1240px] items-center gap-12 px-5 py-16 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-20">
            <div className="max-w-[680px]">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D8D8D0] bg-white px-3 py-2 text-xs font-bold text-[#4B5563] shadow-sm">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#C8FF35]">
                  <Icon name="shield" size={13} />
                </span>
                Your campus. Your community.
              </div>
              <h1 className="text-[48px] font-extrabold leading-[.98] tracking-[-0.06em] text-[#102033] sm:text-[64px] lg:text-[76px]">
                Good stuff,
                <br />
                <span className="relative text-[#6D45D8]">closer than</span>
                <br />
                you think.
              </h1>
              <p className="mt-7 max-w-[570px] text-[17px] leading-7 text-[#5E6875] sm:text-lg">
                Buy and sell books, tech, hostel essentials and more with
                verified students right on your campus.
              </p>

              {/* Search Form */}
              <form
                onSubmit={submitSearch}
                className="mt-9 flex max-w-[650px] items-center rounded-2xl border border-[#D8D8D0] bg-white p-2 shadow-[0_16px_45px_rgba(16,32,51,.10)]"
              >
                <Icon name="search" className="ml-3 shrink-0 text-[#7B8490]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-medium outline-none placeholder:text-[#9AA1AA]"
                  placeholder="Search books, calculators, hostel items..."
                  aria-label="Search marketplace"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[#C8FF35] px-5 py-3 text-sm font-extrabold text-[#102033] transition hover:bg-[#B8F022]"
                >
                  Search
                </button>
              </form>

              {/* Trending tags */}
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#667085]">
                <span>Trending:</span>
                {["Calculators", "Cycles", "Textbooks", "Headphones"].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      setActiveQuery(term);
                      document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="rounded-full border border-[#DFDFD8] bg-white px-3 py-1.5 hover:border-[#6D45D8] hover:text-[#6D45D8] transition"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Hero Mockups */}
            <div className="relative mx-auto hidden h-[500px] w-full max-w-[480px] lg:block">
              <div className="absolute right-0 top-6 h-[380px] w-[365px] rotate-[2deg] overflow-hidden rounded-[36px] bg-[#DCD8D0] shadow-[0_25px_80px_rgba(16,32,51,.16)]">
                <img
                  src="https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?auto=format&fit=crop&w=900&q=85"
                  alt="Student essentials arranged with a backpack and laptop"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute bottom-5 left-0 w-[245px] -rotate-[3deg] rounded-[24px] bg-white p-3 shadow-[0_18px_50px_rgba(16,32,51,.18)]">
                <div className="h-32 overflow-hidden rounded-[16px]">
                  <img
                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85"
                    alt="Headphones listing"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="px-1 pb-1 pt-3">
                  <p className="text-[13px] font-bold">Sony Headphones</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-lg font-extrabold">₹8,500</p>
                    <span className="rounded-full bg-[#E9FAD0] px-2 py-1 text-[10px] font-bold text-[#3F6723]">
                      Like new
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute left-2 top-10 rotate-[-5deg] rounded-2xl bg-[#C8FF35] px-4 py-3 shadow-lg">
                <p className="text-[11px] font-bold uppercase tracking-wider">
                  Campus deals
                </p>
                <p className="mt-1 text-2xl font-extrabold">1,240+</p>
              </div>
              <div
                onClick={() => {
                  if (currentUser) setChatModalOpen(true);
                  else setAuthModalOpen(true);
                }}
                className="cursor-pointer absolute bottom-14 right-0 flex items-center gap-3 rounded-2xl bg-[#102033] p-3 pr-5 text-white shadow-xl hover:bg-[#6D45D8] transition"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#6D45D8]">
                  <Icon name="message" size={17} />
                </span>
                <div>
                  <p className="text-[10px] text-[#C8FF35] font-extrabold uppercase tracking-wider">Live Status Engine</p>
                  <p className="text-xs font-bold">Never ask "Is this still available?"</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section
          id="categories"
          className="border-y border-[#E5E5DF] bg-white py-16"
        >
          <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="eyebrow">Find your thing</p>
                <h2 className="section-title">Browse by category</h2>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="hidden items-center gap-2 text-sm font-bold text-[#6D45D8] sm:flex"
              >
                View everything <Icon name="arrow" size={17} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {categories.map((category) => (
                <button
                  key={category.label}
                  onClick={() => {
                    setSelectedCategory(category.label);
                    document
                      .getElementById("marketplace")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`group rounded-[20px] border p-3 text-left transition hover:-translate-y-1 hover:shadow-lg ${
                    selectedCategory === category.label
                      ? "border-[#6D45D8] bg-[#F7F4FF] shadow-sm"
                      : "border-[#E8E8E3] bg-[#FCFCF9] hover:border-[#CACAC2]"
                  }`}
                >
                  <span
                    className={`mb-5 grid h-11 w-11 place-items-center rounded-[14px] ${category.color} transition group-hover:scale-105`}
                  >
                    <Icon name={category.icon} size={21} />
                  </span>
                  <span className="block text-sm font-extrabold text-[#102033]">
                    {category.label}
                  </span>
                  <span className="mt-1 block text-[11px] font-medium text-[#7A838E]">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Marketplace Grid Section */}
        <section id="marketplace" className="py-20">
          <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
            <div className="mb-9 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">Fresh finds</p>
                <div className="flex items-center gap-3">
                  <h2 className="section-title">
                    {selectedCategory === "All"
                      ? "Latest on campus"
                      : selectedCategory}
                  </h2>
                  {activeQuery && (
                    <span className="rounded-full bg-[#E5F8D2] px-3 py-1 text-xs font-bold text-[#2C560E]">
                      Search: “{activeQuery}”
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-[#6C7580]">
                  Picked up by students near you
                </p>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 rounded-xl border border-[#DEDED8] bg-white p-1">
                {(["All", "Near you", "Newest", "Saved"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      if (tab === "Saved" && !currentUser) {
                        showNotice("Sign in to see your saved wishlist");
                        setAuthModalOpen(true);
                        return;
                      }
                      setSelectedTab(tab);
                    }}
                    className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                      selectedTab === tab
                        ? "bg-[#102033] text-white"
                        : "text-[#69727E] hover:bg-[#F3F3EE]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Active filters pill */}
            {(selectedCategory !== "All" || activeQuery || selectedTab !== "All") && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#76808D]">Active filters:</span>
                {selectedCategory !== "All" && (
                  <button
                    onClick={() => setSelectedCategory("All")}
                    className="flex items-center gap-1.5 rounded-full bg-[#EDE7FF] px-3 py-1 text-xs font-bold text-[#6D45D8] hover:bg-[#DFD4FF]"
                  >
                    Category: {selectedCategory} <Icon name="x" size={12} />
                  </button>
                )}
                {activeQuery && (
                  <button
                    onClick={() => {
                      setActiveQuery("");
                      setQuery("");
                    }}
                    className="flex items-center gap-1.5 rounded-full bg-[#EDE7FF] px-3 py-1 text-xs font-bold text-[#6D45D8] hover:bg-[#DFD4FF]"
                  >
                    Query: {activeQuery} <Icon name="x" size={12} />
                  </button>
                )}
                {selectedTab !== "All" && (
                  <button
                    onClick={() => setSelectedTab("All")}
                    className="flex items-center gap-1.5 rounded-full bg-[#EDE7FF] px-3 py-1 text-xs font-bold text-[#6D45D8] hover:bg-[#DFD4FF]"
                  >
                    Sort: {selectedTab} <Icon name="x" size={12} />
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setActiveQuery("");
                    setQuery("");
                    setSelectedTab("All");
                  }}
                  className="text-xs font-bold text-[#9099A4] underline hover:text-[#102033]"
                >
                  Reset all
                </button>
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div className="py-24 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#6D45D8] border-t-transparent" />
                <p className="mt-4 text-xs font-bold text-[#717A88]">
                  Loading campus listings...
                </p>
              </div>
            ) : listings.length ? (
              <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {listings.map((item) => (
                  <ListingCard
                    key={item.id}
                    item={item}
                    onOpenDetails={(it) => setSelectedItem(it)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-[#CFCFC8] bg-white py-16 text-center">
                <Icon
                  name="search"
                  size={28}
                  className="mx-auto text-[#8A939E]"
                />
                <h3 className="mt-4 text-lg font-bold">No listings found</h3>
                <p className="mt-2 text-sm text-[#747D87]">
                  {selectedTab === "Saved"
                    ? "You haven't saved any listings yet. Tap the heart icon on any item!"
                    : "Try adjusting your filters or be the first student to post this item."}
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setActiveQuery("");
                    setSelectedTab("All");
                  }}
                  className="mt-5 rounded-xl bg-[#102033] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#6D45D8]"
                >
                  Clear search filters
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setSelectedCategory("All");
                setActiveQuery("");
                setSelectedTab("All");
                showNotice("Displaying complete campus inventory");
              }}
              className="mx-auto mt-12 flex items-center gap-2 rounded-xl border border-[#CDD0D2] bg-white px-6 py-3 text-sm font-bold transition hover:border-[#102033]"
            >
              Explore all listings <Icon name="arrow" size={17} />
            </button>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how" className="px-5 pb-20 lg:px-8">
          <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[32px] bg-[#102033] px-6 py-14 text-white sm:px-10 lg:px-14 lg:py-16">
            <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border-[42px] border-[#C8FF35]/10" />
            <div className="relative mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#C8FF35]">
                  From scroll to sold
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">
                  Campus deals, minus the chaos.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-white/60">
                No buried group messages. Just simple, student-to-student buying
                and selling.
              </p>
            </div>
            <div className="relative grid gap-8 md:grid-cols-4">
              {[
                {
                  n: "01",
                  icon: "plus" as IconName,
                  title: "Post your item",
                  body: "Add photos, details and your asking price.",
                },
                {
                  n: "02",
                  icon: "search" as IconName,
                  title: "Get discovered",
                  body: "Students nearby find exactly what they need.",
                },
                {
                  n: "03",
                  icon: "chat" as IconName,
                  title: "Chat & bargain",
                  body: "Talk directly and settle on a fair price.",
                },
                {
                  n: "04",
                  icon: "handshake" as IconName,
                  title: "Make the deal",
                  body: "Meet safely on campus and mark it sold.",
                },
              ].map((step) => (
                <div key={step.n} className="border-t border-white/15 pt-5">
                  <div className="mb-7 flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-white/10 text-[#C8FF35]">
                      <Icon name={step.icon} size={20} />
                    </span>
                    <span className="text-xs font-bold text-white/30">
                      {step.n}
                    </span>
                  </div>
                  <h3 className="text-base font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live Interactive Campus Bargaining Showcase */}
        <section className="border-t border-[#E5E5DF] bg-white py-20">
          <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="eyebrow">Made for campus life</p>
              <h2 className="section-title max-w-lg">
                Less scrolling. More good deals.
              </h2>
              <p className="mt-5 max-w-lg text-[15px] leading-7 text-[#68727E]">
                A trusted space where your old textbook becomes someone else's
                semester saver, and the things you need are already a short walk
                away.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#F5F4EF] p-5">
                  <Icon name="shield" className="text-[#6D45D8]" />
                  <h3 className="mt-5 font-bold">Students only</h3>
                  <p className="mt-2 text-xs leading-5 text-[#6D7681]">
                    Campus-verified profiles create a safer community.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F5F4EF] p-5">
                  <Icon name="message" className="text-[#6D45D8]" />
                  <h3 className="mt-5 font-bold">Bargain built in</h3>
                  <p className="mt-2 text-xs leading-5 text-[#6D7681]">
                    Chat, make offers and agree on a price directly.
                  </p>
                </div>
              </div>
            </div>

            {/* Campus Bargaining & Deal Flow Showcase */}
            <div className="rounded-[28px] bg-[#EDE7FF] p-6 sm:p-8">
              <div className="rounded-[22px] bg-white p-6 shadow-[0_16px_50px_rgba(52,36,91,.12)] space-y-4">
                <div className="flex items-center justify-between border-b border-[#EEEDE9] pb-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6D45D8]">
                      Campus Peer Negotiation
                    </span>
                    <h3 className="text-base font-extrabold text-[#102033]">
                      How Bargaining & Deals Work
                    </h3>
                  </div>
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#C8FF35] text-[#102033] font-bold">
                    <Icon name="handshake" size={16} />
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3 rounded-xl bg-[#FAF8FF] border border-[#E9E2FF] p-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#6D45D8] text-[11px] font-bold text-white">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-[#102033]">Propose Your Negotiated Price</p>
                      <p className="mt-0.5 text-[#657181] leading-4">
                        Buyers can submit custom offers directly on any product or during student chat.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-[#FAF8FF] border border-[#E9E2FF] p-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#6D45D8] text-[11px] font-bold text-white">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-[#102033]">Seller Acceptance Option</p>
                      <p className="mt-0.5 text-[#657181] leading-4">
                        Sellers receive a one-click "Accept Offer" option in chat to lock in the price.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-[#FFF8EE] border border-[#FFE8C2] p-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-500 text-[11px] font-bold text-white">
                      3
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#102033]">Item Enters "PROCESSING"</p>
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black text-white">
                          ⏳ PROCESSING
                        </span>
                      </div>
                      <p className="mt-0.5 text-[#885B12] leading-4">
                        The item is reserved while buyer and seller arrange campus meetup and payment.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] p-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                      4
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#102033]">Meetup & Mark as Sold</p>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">
                          ✓ SOLD
                        </span>
                      </div>
                      <p className="mt-0.5 text-[#166534] leading-4">
                        Meet safely on campus, verify the item, and seller marks deal finalized.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full rounded-xl bg-[#102033] py-2.5 text-center text-xs font-bold text-white transition hover:bg-[#6D45D8]"
                >
                  Explore Campus Deals →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Hackathon Problem Statement Showcase: Why Campus WhatsApp Groups Break Down vs. CampusCart */}
        <section className="border-t border-[#E5E5DF] bg-[#FAF9F5] py-20">
          <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#DCD1F7] bg-[#F3EFFF] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#6D45D8]">
                <span>💬</span> Built to Replace Chaotic WhatsApp Groups
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.03em] text-[#102033] sm:text-4xl">
                Why Campus WhatsApp Groups Break Down
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#5A6573]">
                Campus life shouldn't rely on buried chat messages, lost prices, and endless
                <span className="font-bold text-[#102033]"> "Is this still available?"</span> loops.
                Here is why CampusCart gives campus commerce a proper home on the web.
              </p>
            </div>

            {/* Comparison Grid */}
            <div className="mt-14 grid gap-8 md:grid-cols-2">
              {/* WhatsApp Breakdown Card */}
              <div className="rounded-3xl border border-red-200 bg-white p-7 shadow-sm">
                <div className="flex items-center justify-between pb-5 border-b border-red-100">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-red-100 text-red-600 font-extrabold text-lg">
                      ✕
                    </span>
                    <div>
                      <h3 className="text-base font-extrabold text-[#102033]">The WhatsApp Group Chaos</h3>
                      <p className="text-xs text-[#717B87]">What goes wrong on 500+ student group chats</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-red-50 border border-red-200 px-3 py-1 text-[11px] font-bold text-red-700">
                    Broken Flow
                  </span>
                </div>

                <div className="mt-6 space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <span className="font-black text-red-500 text-sm leading-none mt-0.5">✕</span>
                    <div>
                      <strong className="text-[#102033]">Messages Get Buried Instantly:</strong>
                      <p className="text-[#647080] mt-0.5 leading-5">
                        Your textbook or bicycle listing gets pushed up by 250+ new messages, memes, and club announcements within 30 minutes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="font-black text-red-500 text-sm leading-none mt-0.5">✕</span>
                    <div>
                      <strong className="text-[#102033]">Prices Get Lost in Haggling:</strong>
                      <p className="text-[#647080] mt-0.5 leading-5">
                        Bargaining happens across messy DMs, screenshots, and audio notes. There is zero price commitment when meeting at the hostel gate.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="font-black text-red-500 text-sm leading-none mt-0.5">✕</span>
                    <div>
                      <strong className="text-[#102033]">The "Is this still available?" Ping-Pong:</strong>
                      <p className="text-[#647080] mt-0.5 leading-5">
                        Sellers receive dozens of repetitive pings days after the item was already sold, because WhatsApp has no live inventory status.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="font-black text-red-500 text-sm leading-none mt-0.5">✕</span>
                    <div>
                      <strong className="text-[#102033]">Zero Trust & Frequent Ghosting:</strong>
                      <p className="text-[#647080] mt-0.5 leading-5">
                        Random phone numbers without college verification. Buyers promise to meet and ghost without any campus reputation or accountability.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CampusCart Web Home Card */}
              <div className="rounded-3xl border border-emerald-300 bg-white p-7 shadow-sm ring-1 ring-emerald-500/10">
                <div className="flex items-center justify-between pb-5 border-b border-emerald-100">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 font-extrabold text-lg">
                      ✓
                    </span>
                    <div>
                      <h3 className="text-base font-extrabold text-[#102033]">The CampusCart Web Marketplace</h3>
                      <p className="text-xs text-[#717B87]">Purpose-built for campus buying, selling & bargaining</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-700">
                    Proper Home
                  </span>
                </div>

                <div className="mt-6 space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <span className="font-black text-emerald-600 text-sm leading-none mt-0.5">✓</span>
                    <div>
                      <strong className="text-[#102033]">Permanent, Categorized Web Catalog:</strong>
                      <p className="text-[#647080] mt-0.5 leading-5">
                        8 clean categories, instant keyword search, and filters by hostel block. Your listings stay discoverable until marked sold.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="font-black text-emerald-600 text-sm leading-none mt-0.5">✓</span>
                    <div>
                      <strong className="text-[#102033]">One-Click Offer & Price Lock-In:</strong>
                      <p className="text-[#647080] mt-0.5 leading-5">
                        Buyers propose a custom ₹ bargain offer directly in chat; sellers accept with 1 click, locking the agreed price into the deal.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="font-black text-emerald-600 text-sm leading-none mt-0.5">✓</span>
                    <div>
                      <strong className="text-[#102033]">Live Lifecycle Eliminates Guesswork:</strong>
                      <p className="text-[#647080] mt-0.5 leading-5">
                        Listings shift from <span className="font-bold text-emerald-700">Available</span> to <span className="font-bold text-amber-700">⏳ Processing</span> (hold) to <span className="font-bold text-red-700">Sold</span> automatically.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="font-black text-emerald-600 text-sm leading-none mt-0.5">✓</span>
                    <div>
                      <strong className="text-[#102033]">Campus-Verified Student Trust:</strong>
                      <p className="text-[#647080] mt-0.5 leading-5">
                        Students login with campus profiles, verified hostel locations, and transparent meetup spots across campus.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Persona Callout: The Real Business Owner */}
            <div className="mt-10 rounded-3xl bg-[#102033] p-7 sm:p-9 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#6D45D8]/20 blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-[#C8FF35] mb-3">
                    <span>🎓</span> The Real Owner: Graduating Senior & Hostel Room Reseller
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    "Why I Stopped Selling on WhatsApp Groups"
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm text-white/70 leading-6 italic">
                    "When clearing out my hostel room before graduation, I had a bicycle, electric kettle, and 8 textbooks.
                    Posting on WhatsApp got me 45 random DMs asking 'available?', buyers who agreed on ₹600 then showed up at the gate offering ₹350,
                    and messages buried by lunch. CampusCart gave me one clean link, locked-in bargaining, and peace of mind."
                  </p>
                  <p className="mt-3 text-xs font-bold text-[#C8FF35]">
                    — Rohan Sharma, Final Year Hostel 7 resident & Campus Seller
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser) setSellModalOpen(true);
                    else setAuthModalOpen(true);
                  }}
                  className="rounded-2xl bg-[#C8FF35] px-6 py-3.5 text-xs font-black text-[#102033] shadow-md transition hover:bg-[#B8F022] shrink-0"
                >
                  Post Your Campus Listing →
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#F8F8F4] pb-28 pt-14 md:pb-10">
        <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
          <div className="flex flex-col justify-between gap-10 border-b border-[#DCDCD6] pb-12 sm:flex-row">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-sm leading-6 text-[#6B7480]">
                Buy. Sell. Bargain. Campus.
                <br />
                Made for students, by students.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-16 gap-y-4 text-sm">
              <div>
                <p className="mb-4 font-extrabold">Marketplace</p>
                <p
                  onClick={() => document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" })}
                  className="mb-3 text-[#6B7480] cursor-pointer hover:text-[#102033]"
                >
                  Browse
                </p>
                <p
                  onClick={() => {
                    if (!currentUser) setAuthModalOpen(true);
                    else setSellModalOpen(true);
                  }}
                  className="mb-3 text-[#6B7480] cursor-pointer hover:text-[#102033]"
                >
                  Sell an item
                </p>
                <p
                  onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-[#6B7480] cursor-pointer hover:text-[#102033]"
                >
                  Categories
                </p>
              </div>
              <div>
                <p className="mb-4 font-extrabold">CampusCart</p>
                <p
                  onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
                  className="mb-3 text-[#6B7480] cursor-pointer hover:text-[#102033]"
                >
                  How it works
                </p>
                <p className="mb-3 text-[#6B7480]">Safety & Verification</p>
                <p className="text-[#6B7480]">Campus Support</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-6 text-xs text-[#858C95] sm:flex-row sm:justify-between">
            <p>© 2025 CampusCart. Made with care for campus communities.</p>
            <p>Privacy · Terms · Community guidelines · Cloud Ready API</p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-[#E2E2DC] bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        {[
          ["home", "Home"],
          ["search", "Browse"],
          ["plus", "Sell"],
          ["message", "Messages"],
          ["user", "Profile"],
        ].map(([icon, label]) => (
          <button
            key={label}
            onClick={() => {
              if (label === "Home") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else if (label === "Browse") {
                document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" });
              } else if (label === "Sell") {
                if (!currentUser) setAuthModalOpen(true);
                else setSellModalOpen(true);
              } else if (label === "Messages") {
                if (!currentUser) setAuthModalOpen(true);
                else {
                  setChatListingId(null);
                  setChatModalOpen(true);
                }
              } else if (label === "Profile") {
                setAuthModalOpen(true);
              }
            }}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
              label === "Home" ? "text-[#6D45D8]" : "text-[#77808B]"
            }`}
          >
            <span
              className={
                label === "Sell"
                  ? "grid h-9 w-12 place-items-center rounded-xl bg-[#C8FF35] text-[#102033]"
                  : ""
              }
            >
              <Icon name={icon as IconName} size={19} />
            </span>
            {label}
          </button>
        ))}
      </nav>

      {/* Modals with Code-Splitting Suspense */}
      <Suspense fallback={null}>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            showNotice(`Signed in as ${user.name}`);
          }}
          onNotify={showNotice}
        />

        <SellModal
          isOpen={sellModalOpen}
          onClose={() => setSellModalOpen(false)}
          currentUser={currentUser}
          onRequireAuth={() => setAuthModalOpen(true)}
          onSuccess={(newListing) => {
            setListings((prev) => [newListing, ...prev]);
            document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" });
          }}
          onNotify={showNotice}
        />

        <ListingDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          currentUser={currentUser}
          onRequireAuth={() => setAuthModalOpen(true)}
          onToggleSave={handleToggleSave}
          onOpenChat={handleOpenChat}
          onNotify={showNotice}
          onListingUpdated={handleListingUpdated}
        />

        <ChatModal
          isOpen={chatModalOpen}
          onClose={() => {
            setChatModalOpen(false);
            setChatListingId(null);
            setChatSellerId(null);
          }}
          currentUser={currentUser}
          initialListingId={chatListingId}
          initialSellerId={chatSellerId}
          onListingUpdated={handleListingUpdated}
        />
      </Suspense>
    </div>
  );
}
