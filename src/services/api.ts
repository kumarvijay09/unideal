const API_BASE = import.meta.env.VITE_API_URL || "/api";

export interface User {
  id: string;
  name: string;
  email: string;
  university?: string;
  campusLocation?: string;
  hostel?: string;
  phone?: string;
  avatar?: string;
  verified?: boolean;
  stats?: {
    savedCount: number;
    myListingsCount: number;
    activeOffersCount: number;
  };
}

export interface ListingItem {
  id: number;
  title: string;
  price: string;
  numericPrice?: number;
  tag: string;
  condition: string;
  place: string;
  time: string;
  seller: string;
  sellerId?: string;
  category: string;
  description?: string;
  image: string;
  status?: "available" | "reserved" | "sold";
  savesCount?: number;
  viewsCount?: number;
  isSaved?: boolean;
  sellerProfile?: User | null;
}

export interface Offer {
  id: string;
  listingId: number;
  listingTitle: string;
  originalPrice: number;
  offerAmount: number;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  message: string;
  createdAt: string;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  listingId: number;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  text: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  listingId: number;
  buyerId: string;
  sellerId: string;
  lastMessage: string;
  lastMessageAt: string;
  partner?: User;
  listing?: ListingItem;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("campuscart_token") || localStorage.getItem("unideal_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...options.headers,
  };

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  auth: {
    getStoredUser(): User | null {
      try {
        const raw = localStorage.getItem("campuscart_user") || localStorage.getItem("unideal_user");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    setSession(token: string, user: User) {
      localStorage.setItem("campuscart_token", token);
      localStorage.setItem("campuscart_user", JSON.stringify(user));
    },
    logout() {
      localStorage.removeItem("campuscart_token");
      localStorage.removeItem("campuscart_user");
      localStorage.removeItem("unideal_token");
      localStorage.removeItem("unideal_user");
    },
    async getMe(): Promise<{ success: boolean; user: User }> {
      return request("/auth/me");
    },
    async login(email: string, password: string): Promise<{ success: boolean; token: string; user: User; message: string }> {
      const res = await request<{ success: boolean; token: string; user: User; message: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      api.auth.setSession(res.token, res.user);
      return res;
    },
    async register(data: {
      name: string;
      email: string;
      password: string;
      university?: string;
      campusLocation?: string;
      hostel?: string;
      phone?: string;
    }): Promise<{ success: boolean; token: string; user: User; message: string }> {
      const res = await request<{ success: boolean; token: string; user: User; message: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      api.auth.setSession(res.token, res.user);
      return res;
    },
    async demoLogin(email: string = "aarav@campus.edu", userId?: string): Promise<{ success: boolean; token: string; user: User; message: string }> {
      const res = await request<{ success: boolean; token: string; user: User; message: string }>("/auth/demo-login", {
        method: "POST",
        body: JSON.stringify({ email, userId }),
      });
      api.auth.setSession(res.token, res.user);
      return res;
    },
    async getDemoUsers(): Promise<{ success: boolean; users: User[] }> {
      return request("/auth/demo-users");
    },
  },

  listings: {
    async getAll(params: {
      q?: string;
      category?: string;
      tab?: string;
      campus?: string;
      condition?: string;
      page?: number;
      limit?: number;
    } = {}): Promise<{ success: boolean; listings: ListingItem[]; total: number }> {
      const qry = new URLSearchParams();
      if (params.q) qry.set("q", params.q);
      if (params.category && params.category !== "All") qry.set("category", params.category);
      if (params.tab && params.tab !== "All") qry.set("tab", params.tab);
      if (params.campus && params.campus !== "All") qry.set("campus", params.campus);
      if (params.condition) qry.set("condition", params.condition);

      const qs = qry.toString();
      return request(`/listings${qs ? `?${qs}` : ""}`);
    },
    async getById(id: number | string): Promise<{ success: boolean; listing: ListingItem }> {
      return request(`/listings/${id}`);
    },
    async create(data: {
      title: string;
      price: number | string;
      category: string;
      condition: string;
      place?: string;
      description?: string;
      image?: string;
    }): Promise<{ success: boolean; listing: ListingItem; message: string }> {
      return request("/listings", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    async toggleSave(id: number | string): Promise<{ success: boolean; saved: boolean; savesCount: number; message: string }> {
      return request(`/listings/${id}/save`, {
        method: "POST",
      });
    },
    async getSaved(): Promise<{ success: boolean; listings: ListingItem[]; total: number }> {
      return request("/listings/saved");
    },
    async update(
      id: number | string,
      data: Partial<ListingItem>
    ): Promise<{ success: boolean; listing: ListingItem; message: string }> {
      return request(`/listings/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    async delete(id: number | string): Promise<{ success: boolean; message: string }> {
      return request(`/listings/${id}`, {
        method: "DELETE",
      });
    },
  },

  offers: {
    async getAll(): Promise<{ success: boolean; incoming: Offer[]; outgoing: Offer[]; total: number }> {
      return request("/offers");
    },
    async create(data: {
      listingId: number;
      offerAmount: number;
      message?: string;
    }): Promise<{ success: boolean; offer: Offer; message: string }> {
      return request("/offers", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    async updateStatus(offerId: string, status: "accepted" | "rejected" | "cancelled"): Promise<{ success: boolean; offer: Offer; message: string }> {
      return request(`/offers/${offerId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
  },

  messages: {
    async getConversations(): Promise<{ success: boolean; conversations: Conversation[]; total: number }> {
      return request("/messages/conversations");
    },
    async getThread(conversationId: string): Promise<{ success: boolean; messages: MessageItem[]; total: number }> {
      return request(`/messages/conversations/${conversationId}`);
    },
    async start(listingId: number, sellerId?: string): Promise<{ success: boolean; conversation: Conversation; messages: MessageItem[] }> {
      return request("/messages/start", {
        method: "POST",
        body: JSON.stringify({ listingId, sellerId }),
      });
    },
    async send(data: {
      conversationId?: string;
      listingId?: number;
      receiverId?: string;
      text: string;
    }): Promise<{ success: boolean; message: MessageItem }> {
      return request("/messages/send", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  upload: {
    async image(file: File): Promise<{
      success: boolean;
      url: string;
      filename: string;
      size: number;
      message: string;
    }> {
      const formData = new FormData();
      formData.append("image", file);

      const token = localStorage.getItem("unideal_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Upload failed with status ${response.status}`);
      }
      return data;
    },
  },

  meta: {
    async getMeta(): Promise<{
      success: boolean;
      categories: { label: string; icon: string; count: string; color: string }[];
      locations: string[];
      conditions: string[];
      stats: {
        activeListings: number;
        verifiedStudents: number;
        totalDealsAgreed: number;
        activeOffers: number;
      };
    }> {
      return request("/meta");
    },
  },
};
