import React, { useState, useEffect } from "react";
import { Icon } from "./Icons";
import { api, Conversation, MessageItem, User } from "../services/api";

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
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const loadConversations = async () => {
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
      } catch (err) {
        console.error("Failed to load chat data", err);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [isOpen, currentUser, initialListingId, initialSellerId]);

  const selectConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    try {
      const res = await api.messages.getThread(conv.id);
      setMessages(res.messages || []);
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

  const handleToggleSold = async () => {
    if (!selectedConv?.listingId || !currentUser) return;
    const currentStatus = selectedConv.listing?.status || "available";
    const nextStatus = currentStatus === "sold" ? "available" : "sold";

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

  if (!isOpen) return null;

  const isSeller =
    currentUser &&
    selectedConv &&
    (currentUser.id === selectedConv.sellerId ||
      currentUser.id === selectedConv.listing?.sellerId);

  const isSold = selectedConv?.listing?.status === "sold";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex h-[85vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-[#F3F3EE] text-[#556070] transition hover:bg-[#E8E8E3] hover:text-[#102033]"
        >
          <Icon name="x" size={18} />
        </button>

        {/* Sidebar Conversations */}
        <div className="hidden sm:flex w-72 flex-col border-r border-[#EAEAE3] bg-[#FAF9F5]">
          <div className="p-4 border-b border-[#EAEAE3]">
            <h3 className="text-base font-extrabold text-[#102033]">Messages</h3>
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
                const convSold = conv.listing?.status === "sold";
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
                        {convSold && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-black text-red-700">
                            SOLD
                          </span>
                        )}
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
        <div className="flex flex-1 flex-col">
          {selectedConv ? (
            <>
              {/* Thread Header with Item & Mark as Sold button */}
              <div className="flex items-center gap-3 border-b border-[#EAEAE3] p-4 sm:px-6">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E8E1FF] text-sm font-extrabold text-[#6D45D8]">
                  {selectedConv.partner?.name ? selectedConv.partner.name[0] : "S"}
                </span>
                <div className="min-w-0">
                  <h4 className="text-sm font-extrabold text-[#102033] truncate">
                    {selectedConv.partner?.name || "Campus Student"}
                  </h4>
                  <p className="text-[11px] text-[#6B7582] truncate">
                    {selectedConv.listing?.title} ·{" "}
                    <span
                      className={`font-bold ${
                        isSold ? "line-through text-gray-400" : "text-[#102033]"
                      }`}
                    >
                      {selectedConv.listing?.price}
                    </span>
                  </p>
                </div>

                {/* Seller "Mark as Sold" Control in Header */}
                <div className="ml-auto flex items-center gap-2 pr-8">
                  {isSold ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-red-100 border border-red-200 px-3 py-1 text-xs font-black tracking-wide text-red-700">
                        <Icon name="check" size={13} /> SOLD
                      </span>
                      {isSeller && (
                        <button
                          onClick={handleToggleSold}
                          disabled={updatingStatus}
                          className="text-[11px] font-bold text-[#6B7582] underline hover:text-[#102033] transition"
                          title="Re-open if deal fell through"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {isSeller ? (
                        <button
                          onClick={handleToggleSold}
                          disabled={updatingStatus}
                          className="flex items-center gap-1.5 rounded-xl bg-[#102033] px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#5ECC70] hover:text-[#102033] disabled:opacity-50"
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

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-xs text-[#8A939E] py-10">
                    Send a message to start bargaining and arranging pickup!
                  </p>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === currentUser?.id;
                    const isDealMessage = m.text.includes("SOLD") || m.text.includes("Deal");
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

              {/* Chat Input */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-[#EAEAE3] p-3 sm:p-4 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Type a message or offer..."
                  className="flex-1 rounded-xl bg-[#F4F4F0] px-4 py-3 text-xs text-[#102033] outline-none placeholder:text-[#9299A2] focus:bg-[#EFEFEA]"
                />
                <button
                  type="submit"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#102033] text-white transition hover:bg-[#6D45D8]"
                >
                  <Icon name="send" size={17} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-[#7B8592]">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
