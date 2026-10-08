import React, { useState } from "react";
import { Icon } from "./Icons";
import { api, ListingItem, User } from "../services/api";

interface ListingDetailModalProps {
  item: ListingItem | null;
  onClose: () => void;
  currentUser: User | null;
  onRequireAuth: () => void;
  onToggleSave: (id: number) => void;
  onOpenChat: (listingId: number, sellerId?: string) => void;
  onNotify: (msg: string) => void;
  onListingUpdated?: (listingId: number, newStatus: string) => void;
}

export default function ListingDetailModal({
  item,
  onClose,
  currentUser,
  onRequireAuth,
  onToggleSave,
  onOpenChat,
  onNotify,
  onListingUpdated,
}: ListingDetailModalProps) {
  const [offerMode, setOfferMode] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState("");

  if (!item) return null;

  const isOwner = currentUser?.id === item.sellerId;
  const isSold = item.status === "sold";
  const isProcessing = item.status === "processing" || item.status === "reserved";

  const handleMakeOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    const numOffer = parseFloat(offerPrice.replace(/[^0-9.]/g, ""));
    if (isNaN(numOffer) || numOffer <= 0) {
      setError("Please enter a valid offer amount in ₹");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await api.offers.create({
        listingId: item.id,
        offerAmount: numOffer,
        message: offerMessage,
      });

      onNotify(`🎉 Offer of ₹${numOffer.toLocaleString("en-IN")} submitted to ${item.seller}!`);
      setOfferMode(false);
      setOfferPrice("");
      setOfferMessage("");
    } catch (err: any) {
      setError(err.message || "Failed to submit offer.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (nextStatus: "available" | "processing" | "sold") => {
    if (!currentUser || !isOwner) return;

    setUpdatingStatus(true);
    try {
      await api.listings.update(item.id, { status: nextStatus as any });
      const msg =
        nextStatus === "sold"
          ? `🎉 "${item.title}" marked as SOLD!`
          : nextStatus === "processing"
          ? `⏳ "${item.title}" marked as PROCESSING (Transaction in progress)`
          : `"${item.title}" is back on the market as Available!`;
      onNotify(msg);
      if (onListingUpdated) {
        onListingUpdated(item.id, nextStatus);
      }
      onClose();
    } catch (err: any) {
      onNotify(err.message || "Failed to update listing status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!currentUser || !isOwner) return;
    if (!window.confirm("Are you sure you want to delete this listing from the marketplace?")) {
      return;
    }

    setUpdatingStatus(true);
    try {
      await api.listings.delete(item.id);
      onNotify(`Listing "${item.title}" removed.`);
      if (onListingUpdated) {
        onListingUpdated(item.id, "deleted");
      }
      onClose();
    } catch (err: any) {
      onNotify(err.message || "Failed to delete listing");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative my-8 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-[#102033] shadow-md backdrop-blur transition hover:bg-white"
        >
          <Icon name="x" size={18} />
        </button>

        <div className="grid md:grid-cols-[1.1fr_1fr]">
          {/* Image Column */}
          <div className="relative aspect-[1.1] md:aspect-auto md:h-full bg-[#ECEBE7]">
            <img
              src={item.image}
              alt={item.title}
              className="h-full w-full object-cover"
            />
            {isSold ? (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                <span className="rounded-2xl bg-red-600 px-5 py-2 text-sm font-black uppercase tracking-widest text-white shadow-2xl border-2 border-white rotate-[-6deg]">
                  SOLD OUT
                </span>
              </div>
            ) : isProcessing ? (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-amber-500/95 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-md backdrop-blur">
                <span>⏳</span>
                <span>PROCESSING</span>
              </div>
            ) : (
              <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#314055] shadow-sm backdrop-blur">
                {item.tag || item.condition}
              </span>
            )}
          </div>

          {/* Details Column */}
          <div className="flex flex-col p-6 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6D45D8]">
                  {item.category}
                </span>
                <h2 className="mt-1 text-xl font-extrabold tracking-[-0.02em] text-[#102033]">
                  {item.title}
                </h2>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-2xl font-black ${
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
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    ⏳ Processing
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-[#667085]">
              <Icon name="map" size={15} />
              <span>{item.place}</span>
              <span className="text-[#C1C7CF]">·</span>
              <Icon name="clock" size={13} />
              <span>{item.time}</span>
            </div>

            {/* Processing banner if item transaction is underway */}
            {isProcessing && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <span className="text-base leading-none">⏳</span>
                <div>
                  <p className="font-extrabold text-amber-900">Transaction in Progress</p>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-4">
                    An offer has been accepted and this item is currently being processed between the campus buyer and seller.
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mt-4 rounded-2xl bg-[#F8F8F5] p-4 text-xs leading-5 text-[#505A69]">
              {item.description || "Student seller has not provided extra notes for this item."}
            </div>

            {/* Seller profile pill */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#EAEAE3] p-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E8E1FF] text-sm font-extrabold text-[#6543BF]">
                {item.seller ? item.seller[0] : "S"}
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#102033]">
                    {item.seller}
                  </span>
                  <span
                    className="h-2 w-2 rounded-full bg-[#5ECC70]"
                    title="Verified Student"
                  />
                </div>
                <p className="text-[10px] text-[#788290]">
                  Campus-verified student seller
                </p>
              </div>
              <button
                onClick={() => onToggleSave(item.id)}
                className={`ml-auto grid h-9 w-9 place-items-center rounded-full transition ${
                  item.isSaved
                    ? "bg-[#6D45D8] text-white"
                    : "bg-[#F4F4EF] text-[#334155] hover:bg-[#EAEAE5]"
                }`}
                title={item.isSaved ? "Saved" : "Save item"}
              >
                <Icon
                  name="heart"
                  size={16}
                  className={item.isSaved ? "fill-current" : ""}
                />
              </button>
            </div>

            {/* Offer / Bargain Box */}
            {offerMode && !isSold && !isProcessing ? (
              <form
                onSubmit={handleMakeOffer}
                className="mt-4 rounded-2xl border border-[#D9D1F3] bg-[#FAF8FF] p-4 animate-in fade-in duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-[#6D45D8]">
                    Propose Bargain Price
                  </span>
                  <button
                    type="button"
                    onClick={() => setOfferMode(false)}
                    className="text-[11px] font-bold text-[#8A93A0] hover:text-[#102033]"
                  >
                    Cancel
                  </button>
                </div>

                {error && (
                  <p className="mb-2 text-[11px] font-semibold text-red-600">
                    {error}
                  </p>
                )}

                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    required
                    placeholder="Your offer in ₹"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-32 rounded-xl border border-[#D5CDF0] bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#6D45D8]"
                  />
                  <input
                    type="text"
                    placeholder="Add a quick note..."
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    className="flex-1 rounded-xl border border-[#D5CDF0] bg-white px-3 py-2 text-xs outline-none focus:border-[#6D45D8]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#C8FF35] py-2.5 text-xs font-extrabold text-[#102033] shadow-sm transition hover:bg-[#B8F022] disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Send Offer to Seller"}
                </button>
              </form>
            ) : null}

            {/* Action buttons */}
            <div className="mt-auto pt-6">
              {isOwner ? (
                /* Seller Controls */
                <div className="space-y-2">
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus("sold")}
                        disabled={updatingStatus}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Icon name="check" size={16} /> Finalize as Sold
                      </button>
                      <button
                        onClick={() => handleUpdateStatus("available")}
                        disabled={updatingStatus}
                        className="rounded-xl border border-gray-300 bg-gray-100 px-3 py-3 text-xs font-bold text-[#102033] transition hover:bg-gray-200"
                        title="Reopen listing"
                      >
                        Cancel & Reopen
                      </button>
                      <button
                        onClick={handleDeleteListing}
                        disabled={updatingStatus}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-bold text-red-600 transition hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  ) : isSold ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus("available")}
                        disabled={updatingStatus}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#102033] py-3 text-xs font-black text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
                      >
                        Reopen Listing (Mark Available)
                      </button>
                      <button
                        onClick={handleDeleteListing}
                        disabled={updatingStatus}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-600 transition hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus("sold")}
                        disabled={updatingStatus}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#102033] py-3 text-xs font-black text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50"
                      >
                        <Icon name="check" size={16} /> Mark as Sold
                      </button>
                      <button
                        onClick={handleDeleteListing}
                        disabled={updatingStatus}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-600 transition hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  <p className="text-center text-[10px] text-[#717B87]">
                    You are the seller of this listing. Manage listing lifecycle here.
                  </p>
                </div>
              ) : isSold ? (
                /* Item is Sold for Buyers */
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-center">
                  <p className="text-xs font-extrabold text-red-700">
                    ✓ This item has been sold to a fellow student
                  </p>
                  <p className="mt-1 text-[11px] text-red-600">
                    Deal finalized on campus. Browse other listings or categories!
                  </p>
                </div>
              ) : isProcessing ? (
                /* Item is Processing for Buyers */
                <div className="space-y-2">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-center">
                    <p className="text-xs font-extrabold text-amber-800">
                      ⏳ Transaction Currently In Progress
                    </p>
                    <p className="mt-0.5 text-[11px] text-amber-700">
                      An offer is currently accepted. You can still message the seller in case the deal falls through.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        onRequireAuth();
                      } else {
                        onClose();
                        onOpenChat(item.id, item.sellerId);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#102033] py-3 text-xs font-bold text-white transition hover:bg-[#6D45D8]"
                  >
                    <Icon name="chat" size={16} /> Chat with Seller ({item.seller})
                  </button>
                </div>
              ) : (
                /* Regular Buyer Actions */
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!currentUser) onRequireAuth();
                      else setOfferMode(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#C8FF35] py-3 text-xs font-extrabold text-[#102033] shadow-sm transition hover:bg-[#B8F022]"
                  >
                    <Icon name="tag" size={16} /> Bargain / Offer
                  </button>
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        onRequireAuth();
                      } else {
                        onClose();
                        onOpenChat(item.id, item.sellerId);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#102033] py-3 text-xs font-bold text-white transition hover:bg-[#6D45D8]"
                  >
                    <Icon name="chat" size={16} /> Chat with {item.seller}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
