import React, { useState, useEffect } from "react";
import { Icon } from "./Icons";
import { api, Conversation, MessageItem, Offer, User } from "../services/api";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  initialListingId?: number | null;
  initialSellerId?: string | null;
  onListingUpdated?: (listingId: number, newStatus: string) => void;
}

export default function ChatModal({
  isOpen,
  onClose,
  currentUser,
  initialListingId,
  initialSellerId,
  onListingUpdated,
}: ChatModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Quick Bargain / Offer in chat
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerNote, setOfferNote] = useState("");
  const [offerLoading, setOfferLoading] = useState(false);

  // Mobile responsiveness tab: switch between list of chats and active thread on phones
  const [mobileTab, setMobileTab] = useState<"conversations" | "thread">(
    initialListingId ? "thread" : "conversations"
  );

  const loadOffers = async () => {
    try {
      const res = await api.offers.getAll();
      const all = [...(res.incoming || []), ...(res.outgoing || [])];
      const unique = Array.from(new Map(all.map((o) => [o.id, o])).values());
      setOffers(unique);
    } catch (err) {
      console.error("Failed to load offers", err);
    }
  };

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const loadChatData = async () => {
      try {
        setLoading(true);
        if (initialListingId) {
          const res = await api.messages.start(initialListingId, initialSellerId || undefined);
          setSelectedConv(res.conversation);
          setMessages(res.messages || []);
        }

        const convsRes = await api.messages.getConversations();
        setConversations(convsRes.conversations || []);

        if (!initialListingId && convsRes.conversations?.length > 0) {
          setSelectedConv(convsRes.conversations[0]);
          const threadRes = await api.messages.getThread(convsRes.conversations[0].id);
          setMessages(threadRes.messages || []);
        }

        await loadOffers();
      } catch (err) {
        console.error("Failed to load chat data", err);
      } finally {
        setLoading(false);
      }
    };

    loadChatData();
  }, [isOpen, currentUser, initialListingId, initialSellerId]);

  const selectConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    setMobileTab("thread");
    try {
      const res = await api.messages.getThread(conv.id);
      setMessages(res.messages || []);
      await loadOffers();
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !selectedConv || !currentUser) return;

    const textToSend = newText.trim();
    setNewText("");

    try {
      const partnerId =
        selectedConv.buyerId === currentUser.id
          ? selectedConv.sellerId
          : selectedConv.buyerId;

      const res = await api.messages.send({
        conversationId: selectedConv.id,
        listingId: selectedConv.listingId,
        receiverId: partnerId,
        text: textToSend,
      });

      setMessages((prev) => [...prev, res.message]);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleUpdateListingStatus = async (nextStatus: "available" | "processing" | "sold") => {
    if (!selectedConv?.listingId || !currentUser) return;

    setUpdatingStatus(true);
    try {
      await api.listings.update(selectedConv.listingId, {
        status: nextStatus as any,
      });

      // Update local state in conversation
      setSelectedConv((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          listing: prev.listing ? { ...prev.listing, status: nextStatus as any } : undefined,
        };
      });

      if (onListingUpdated) {
        onListingUpdated(selectedConv.listingId, nextStatus);
      }

      // Automatically post deal status message in thread
      const statusNote =
        nextStatus === "sold"
          ? "🎉 Deal finalized! Item has been marked as SOLD."
          : nextStatus === "processing"
          ? "⏳ Transaction is now PROCESSING. Campus meetup arranged."
          : "Item listing has been marked back as Available.";

      const partnerId =
        selectedConv.buyerId === currentUser.id
          ? selectedConv.sellerId
          : selectedConv.buyerId;

      const res = await api.messages.send({
        conversationId: selectedConv.id,
        listingId: selectedConv.listingId,
        receiverId: partnerId,
        text: statusNote,
      });

      setMessages((prev) => [...prev, res.message]);
    } catch (err) {
      console.error("Failed to update listing status", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Seller accepts buyer's negotiation offer
  const handleAcceptOffer = async (offer: Offer) => {
    if (!currentUser || !selectedConv) return;
    setUpdatingStatus(true);
    try {
      await api.offers.updateStatus(offer.id, "accepted");

      // Mark listing as processing
      setSelectedConv((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          listing: prev.listing ? { ...prev.listing, status: "processing" as any } : undefined,
        };
      });

      if (onListingUpdated) {
        onListingUpdated(selectedConv.listingId, "processing");
      }

      const dealNote = `🤝 Offer of ₹${offer.offerAmount.toLocaleString("en-IN")} ACCEPTED! The item is now marked as ⏳ PROCESSING. Please arrange campus pickup and payment.`;
      const partnerId =
        selectedConv.buyerId === currentUser.id
          ? selectedConv.sellerId
          : selectedConv.buyerId;

      const res = await api.messages.send({
        conversationId: selectedConv.id,
        listingId: selectedConv.listingId,
        receiverId: partnerId,
        text: dealNote,
      });

      setMessages((prev) => [...prev, res.message]);
      await loadOffers();
    } catch (err: any) {
      console.error("Failed to accept offer", err);
      alert(err.message || "Failed to accept offer");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Seller declines buyer's negotiation offer
  const handleDeclineOffer = async (offer: Offer) => {
    if (!currentUser || !selectedConv) return;
    setUpdatingStatus(true);
    try {
      await api.offers.updateStatus(offer.id, "rejected");

      const note = `❌ Offer of ₹${offer.offerAmount.toLocaleString("en-IN")} was declined.`;
      const partnerId =
        selectedConv.buyerId === currentUser.id
          ? selectedConv.sellerId
          : selectedConv.buyerId;

      const res = await api.messages.send({
        conversationId: selectedConv.id,
        listingId: selectedConv.listingId,
        receiverId: partnerId,
        text: note,
      });

      setMessages((prev) => [...prev, res.message]);
      await loadOffers();
    } catch (err: any) {
      console.error("Failed to decline offer", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Buyer proposes bargain offer directly in chat
  const handleProposeOfferInChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !currentUser) return;

    const num = parseFloat(offerPrice.replace(/[^0-9.]/g, ""));
    if (isNaN(num) || num <= 0) {
      alert("Please enter a valid offer price in ₹");
      return;
    }

    setOfferLoading(true);
    try {
      await api.offers.create({
        listingId: selectedConv.listingId,
        offerAmount: num,
        message: offerNote.trim() || undefined,
      });

      const offerMsg = `🏷️ Proposed Bargain Offer: ₹${num.toLocaleString("en-IN")}${
        offerNote.trim() ? ` — "${offerNote.trim()}"` : ""
      }`;

      const partnerId =
        selectedConv.buyerId === currentUser.id
          ? selectedConv.sellerId
          : selectedConv.buyerId;

      const res = await api.messages.send({
        conversationId: selectedConv.id,
        listingId: selectedConv.listingId,
        receiverId: partnerId,
        text: offerMsg,
      });

      setMessages((prev) => [...prev, res.message]);
      setShowOfferForm(false);
      setOfferPrice("");
      setOfferNote("");
      await loadOffers();
    } catch (err: any) {
      console.error("Failed to propose offer", err);
      alert(err.message || "Failed to submit offer");
    } finally {
      setOfferLoading(false);
    }
  };

  if (!isOpen) return null;

  const isSeller =
    currentUser &&
    selectedConv &&
    (currentUser.id === selectedConv.sellerId ||
      currentUser.id === selectedConv.listing?.sellerId);

  const listingStatus = selectedConv?.listing?.status || "available";
  const isSold = listingStatus === "sold";
  const isProcessing = listingStatus === "processing" || listingStatus === "reserved";

  // Find relevant active offer for this listing
  const activeOffer = selectedConv
    ? offers.find(
        (o) =>
          o.listingId === selectedConv.listingId &&
          (o.status === "pending" || o.status === "accepted")
      )
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative flex h-[85vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close message window"
          className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-[#F3F3EE] text-[#556070] transition hover:bg-[#E8E8E3] hover:text-[#102033]"
        >
          <Icon name="x" size={18} />
        </button>

        {/* Sidebar Conversations */}
        <div
          className={`${
            mobileTab === "conversations" ? "flex w-full" : "hidden"
          } sm:flex sm:w-72 flex-col border-r border-[#EAEAE3] bg-[#FAF9F5] h-full`}
        >
          <div className="p-4 border-b border-[#EAEAE3]">
            <h3 id="chat-modal-title" className="text-base font-extrabold text-[#102033]">Messages</h3>
            <p className="text-[11px] text-[#69727E]">Campus chats & deals</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <p className="p-4 text-center text-xs text-[#828C98]">
                No active conversations yet
              </p>
            ) : (
              conversations.map((conv) => {
                const partnerName = conv.partner?.name || "Student";
                const isSelected = selectedConv?.id === conv.id;
                const convStatus = conv.listing?.status;
                const convSold = convStatus === "sold";
                const convProcessing = convStatus === "processing" || convStatus === "reserved";

                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full rounded-2xl p-3 text-left transition flex items-center gap-3 ${
                      isSelected
                        ? "bg-white shadow-sm ring-1 ring-black/5"
                        : "hover:bg-[#F2F1EC]"
                    }`}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E5F8D2] text-sm font-extrabold text-[#2F5B10]">
                      {partnerName[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-xs font-bold text-[#102033]">
                          {partnerName}
                        </p>
                        {convSold ? (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-black text-red-700">
                            SOLD
                          </span>
                        ) : convProcessing ? (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-700">
                            ⏳ PROCESS
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-[11px] text-[#717A86]">
                        {conv.listing?.title || "Item deal"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message Thread Area */}
        <div
          className={`${
            mobileTab === "thread" ? "flex" : "hidden"
          } sm:flex flex-1 flex-col h-full overflow-hidden`}
        >
          {selectedConv ? (
            <>
              {/* Thread Header with Item & Status Controls */}
              <div className="flex items-center gap-2 sm:gap-3 border-b border-[#EAEAE3] p-3 sm:p-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setMobileTab("conversations")}
                  className="sm:hidden grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#F0EFEA] text-[#102033] hover:bg-[#E5E5DF] transition"
                  title="Back to all chats"
                >
                  <Icon name="arrow" size={14} className="rotate-180" />
                </button>
                <span className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-full bg-[#E8E1FF] text-xs sm:text-sm font-extrabold text-[#6D45D8]">
                  {selectedConv.partner?.name ? selectedConv.partner.name[0] : "S"}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#102033] truncate">
                    {selectedConv.partner?.name || "Campus Student"}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#6B7582] truncate">
                    <span className="truncate">{selectedConv.listing?.title}</span>
                    <span>·</span>
                    <span
                      className={`font-black shrink-0 ${
                        isSold
                          ? "line-through text-gray-400"
                          : isProcessing
                          ? "text-amber-600"
                          : "text-[#102033]"
                      }`}
                    >
                      {selectedConv.listing?.price}
                    </span>
                    {isProcessing && (
                      <span className="rounded bg-amber-100 border border-amber-300 px-1 py-0.2 text-[8px] sm:text-[9px] font-black uppercase text-amber-800 shrink-0">
                        ⏳ Processing
                      </span>
                    )}
                  </div>
                </div>

                {/* Seller Controls in Header */}
                <div className="ml-auto flex items-center gap-1.5 sm:gap-2 pr-7 sm:pr-8 shrink-0">
                  {isSold ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-red-100 border border-red-200 px-3 py-1 text-xs font-black tracking-wide text-red-700">
                        <Icon name="check" size={13} /> SOLD
                      </span>
                      {isSeller && (
                        <button
                          onClick={() => handleUpdateListingStatus("available")}
                          disabled={updatingStatus}
                          className="text-[11px] font-bold text-[#6B7582] underline hover:text-[#102033] transition"
                          title="Re-open if deal fell through"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  ) : isProcessing ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-black tracking-wide text-amber-800">
                        ⏳ PROCESSING
                      </span>
                      {isSeller && (
                        <>
                          <button
                            onClick={() => handleUpdateListingStatus("sold")}
                            disabled={updatingStatus}
                            className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <Icon name="check" size={13} /> Mark Sold
                          </button>
                          <button
                            onClick={() => handleUpdateListingStatus("available")}
                            disabled={updatingStatus}
                            className="text-[11px] font-bold text-[#6B7582] underline hover:text-[#102033] transition"
                            title="Cancel transaction and reopen"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      {isSeller ? (
                        <button
                          onClick={() => handleUpdateListingStatus("sold")}
                          disabled={updatingStatus}
                          className="flex items-center gap-1.5 rounded-xl bg-[#102033] px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50"
                        >
                          <Icon name="check" size={14} /> Mark as Sold
                        </button>
                      ) : (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                          Available
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Active Offer Negotiation Banner */}
              {activeOffer && activeOffer.status === "pending" && (
                <div className="bg-[#FAF7FF] border-b border-[#E3D9FC] px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#6D45D8] text-white font-black text-xs">
                      ₹
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#102033]">
                        {isSeller ? (
                          <>
                            <span className="font-extrabold text-[#6D45D8]">{activeOffer.buyerName}</span> offered{" "}
                            <span className="font-black text-sm text-[#102033]">
                              ₹{activeOffer.offerAmount.toLocaleString("en-IN")}
                            </span>
                          </>
                        ) : (
                          <>
                            You offered{" "}
                            <span className="font-black text-sm text-[#102033]">
                              ₹{activeOffer.offerAmount.toLocaleString("en-IN")}
                            </span>{" "}
                            (Waiting for seller approval)
                          </>
                        )}
                      </p>
                      {activeOffer.message && (
                        <p className="text-[11px] text-[#636E7B] italic">"{activeOffer.message}"</p>
                      )}
                    </div>
                  </div>

                  {/* Accept / Decline buttons for seller */}
                  {isSeller ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptOffer(activeOffer)}
                        disabled={updatingStatus}
                        className="flex items-center gap-1.5 rounded-xl bg-[#6D45D8] hover:bg-[#5833B8] px-4 py-1.5 text-xs font-black text-white shadow-sm transition disabled:opacity-50"
                      >
                        <Icon name="check" size={14} /> Accept Offer (₹{activeOffer.offerAmount})
                      </button>
                      <button
                        onClick={() => handleDeclineOffer(activeOffer)}
                        disabled={updatingStatus}
                        className="rounded-xl border border-gray-300 bg-white hover:bg-gray-100 px-3 py-1.5 text-xs font-bold text-[#556070] transition"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <span className="rounded-full bg-purple-100 border border-purple-200 px-2.5 py-0.5 text-[10px] font-black text-purple-700 uppercase">
                      Pending Acceptance
                    </span>
                  )}
                </div>
              )}

              {/* Transaction Processing Alert Banner */}
              {isProcessing && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 sm:px-6 flex items-center justify-between text-xs text-amber-900 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⏳</span>
                    <span>
                      <strong>Deal Accepted & Processing:</strong> Discuss meeting point and payment on campus!
                    </span>
                  </div>
                  {isSeller && (
                    <button
                      onClick={() => handleUpdateListingStatus("sold")}
                      disabled={updatingStatus}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1 text-[11px] font-black text-white transition shadow-sm"
                    >
                      Finalize Deal (Sold) ✓
                    </button>
                  )}
                </div>
              )}

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-xs text-[#8A939E] py-10">
                    Send a message to start bargaining and arranging pickup!
                  </p>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === currentUser?.id;
                    const isDealMessage =
                      m.text.includes("SOLD") ||
                      m.text.includes("Deal") ||
                      m.text.includes("ACCEPTED") ||
                      m.text.includes("PROCESSING");

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-5 ${
                            isDealMessage
                              ? "bg-[#E5F8D2] text-[#24490C] font-semibold border border-[#D0EEAF]"
                              : isMe
                              ? "bg-[#6D45D8] text-white rounded-br-sm"
                              : "bg-[#F1F1ED] text-[#102033] rounded-bl-sm"
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="mt-1 px-1 text-[10px] text-[#939BA5]">
                          {m.senderName}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Offer Popup / Drawer (for Buyer) */}
              {showOfferForm && !isSeller && !isSold && !isProcessing && (
                <form
                  onSubmit={handleProposeOfferInChat}
                  className="border-t border-[#EAEAE3] bg-[#FAF9FF] p-3 sm:px-6 flex items-center gap-2 animate-in slide-in-from-bottom-2"
                >
                  <span className="text-xs font-bold text-[#6D45D8] shrink-0">
                    Bargain Price:
                  </span>
                  <input
                    type="number"
                    required
                    placeholder="Offer ₹"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-28 rounded-xl border border-[#D8CEF5] bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#6D45D8]"
                  />
                  <input
                    type="text"
                    placeholder="Quick note (e.g. Can pick up today at hostel)"
                    value={offerNote}
                    onChange={(e) => setOfferNote(e.target.value)}
                    className="flex-1 rounded-xl border border-[#D8CEF5] bg-white px-3 py-2 text-xs outline-none focus:border-[#6D45D8]"
                  />
                  <button
                    type="submit"
                    disabled={offerLoading}
                    className="rounded-xl bg-[#6D45D8] px-3.5 py-2 text-xs font-black text-white transition hover:bg-[#5833B8] disabled:opacity-50 shrink-0"
                  >
                    {offerLoading ? "Sending..." : "Submit Offer"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOfferForm(false)}
                    className="rounded-xl bg-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {/* Quick Bargaining & Meetup Preset Chips */}
              {!isSold && !isProcessing && (
                <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-[#FAFAF8] border-t border-[#ECECE6]">
                  <span className="text-[10px] font-extrabold text-[#757F8C] uppercase tracking-wider mr-1">
                    Quick Bargain:
                  </span>
                  {[
                    "Can pick up today at hostel",
                    "Is the price negotiable?",
                    "Can we meet at the campus library / canteen?",
                    "Ready to buy if you can reduce slightly",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewText(preset)}
                      className="rounded-full bg-white border border-[#DCDCD4] px-2.5 py-1 text-[11px] font-medium text-[#2E3847] hover:border-[#6D45D8] hover:text-[#6D45D8] hover:bg-[#F8F6FF] transition shrink-0"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input & Offer trigger */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-[#EAEAE3] p-3 sm:p-4 bg-white flex items-center gap-2"
              >
                {!isSeller && !isSold && !isProcessing && !showOfferForm && (
                  <button
                    type="button"
                    onClick={() => setShowOfferForm(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-[#FAF8FF] border border-[#D5CDF0] px-3 py-2.5 text-xs font-bold text-[#6D45D8] transition hover:bg-[#F2EDFF] shrink-0"
                    title="Make a negotiated price offer"
                  >
                    <Icon name="tag" size={14} /> Offer ₹
                  </button>
                )}

                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Type a message to discuss deal..."
                  aria-label="Message to negotiate or discuss deal"
                  className="flex-1 rounded-xl bg-[#F4F4F0] px-4 py-3 text-xs text-[#102033] outline-none placeholder:text-[#9299A2] focus:bg-[#EFEFEA]"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#102033] text-white transition hover:bg-[#6D45D8]"
                >
                  <Icon name="send" size={17} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-xs text-[#7B8592]">
              <span className="text-3xl mb-2">💬</span>
              <p className="font-semibold text-[#102033]">Select a conversation to start chatting</p>
              <button
                type="button"
                onClick={() => setMobileTab("conversations")}
                className="mt-3 sm:hidden rounded-xl bg-[#102033] px-4 py-2 text-xs font-bold text-white shadow-sm"
              >
                View All Conversations
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
