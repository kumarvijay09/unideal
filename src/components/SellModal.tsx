import React, { useState, useRef } from "react";
import { Icon } from "./Icons";
import { api, ListingItem, User } from "../services/api";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newListing: ListingItem) => void;
  onNotify: (msg: string) => void;
  currentUser: User | null;
  onRequireAuth: () => void;
}

const PRESET_IMAGES = [
  {
    label: "Books",
    url: "https://images.unsplash.com/photo-1516889454133-d3cd87326a6b?auto=format&fit=crop&w=900&q=85",
  },
  {
    label: "Electronics",
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
  },
  {
    label: "Calculator",
    url: "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=900&q=85",
  },
  {
    label: "Backpack",
    url: "https://images.unsplash.com/photo-1622560481156-01fc7e1693e6?auto=format&fit=crop&w=900&q=85",
  },
  {
    label: "Hostel Lamp",
    url: "https://images.unsplash.com/photo-1519219788971-8d9797e0928e?auto=format&fit=crop&w=900&q=85",
  },
  {
    label: "Bicycle",
    url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=85",
  },
  {
    label: "Kettle",
    url: "https://images.unsplash.com/photo-1594213114663-ddf3f2a02126?auto=format&fit=crop&w=900&q=85",
  },
  {
    label: "Hoodie",
    url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=900&q=85",
  },
];

export default function SellModal({
  isOpen,
  onClose,
  onSuccess,
  onNotify,
  currentUser,
  onRequireAuth,
}: SellModalProps) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [condition, setCondition] = useState("Like new");
  const [place, setPlace] = useState(currentUser?.campusLocation || "North Campus");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [photoMode, setPhotoMode] = useState<"upload" | "preset" | "url">("upload");
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    previewUrl: string;
  } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileProcess = async (file: File) => {
    setUploadError("");

    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const validExtensions = /\.(jpeg|jpg|png|webp|gif)$/i;
    if (!validMimes.includes(file.type) && !validExtensions.test(file.name)) {
      setUploadError("Only image files (JPEG, PNG, WEBP, GIF) are allowed.");
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError("Image file size must be less than 5MB.");
      return;
    }

    // Instant local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedFile({
        name: file.name,
        size: file.size,
        previewUrl: dataUrl,
      });
      setImage(dataUrl);
    };
    reader.readAsDataURL(file);

    // Upload to server endpoint
    setUploadingImage(true);
    try {
      const res = await api.upload.image(file);
      if (res?.url) {
        setImage(res.url);
        setUploadedFile({
          name: file.name,
          size: file.size,
          previewUrl: res.url,
        });
      }
    } catch (err: any) {
      console.warn("Backend image upload notice:", err);
      if (err.message && !err.message.includes("fetch")) {
        setUploadError(err.message);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  if (!isOpen) return null;

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-[#F3F3EE] text-[#556070]"
          >
            <Icon name="x" size={16} />
          </button>
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#EBE4FF] text-[#6D45D8]">
            <Icon name="shield" size={26} />
          </div>
          <h3 className="text-lg font-extrabold text-[#102033]">
            Student Verification Needed
          </h3>
          <p className="mt-2 text-xs leading-5 text-[#657181]">
            Please log in or register your student account before posting items on
            the campus marketplace.
          </p>
          <button
            onClick={() => {
              onClose();
              onRequireAuth();
            }}
            className="mt-6 w-full rounded-xl bg-[#102033] py-3 text-xs font-bold text-white transition hover:bg-[#6D45D8]"
          >
            Log In or Register
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ""));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError("Please enter a valid price in ₹.");
      return;
    }

    if (!image) {
      setError("Please add a photo of your item (upload an image or choose a preset).");
      return;
    }

    if (uploadingImage) {
      setError("Please wait for the image upload to complete.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.listings.create({
        title,
        price: numericPrice,
        category,
        condition,
        place,
        description,
        image,
      });

      onNotify(`🎉 "${res.listing.title}" is now live on campus marketplace!`);
      onSuccess(res.listing);
      onClose();

      // Reset form
      setTitle("");
      setPrice("");
      setDescription("");
      setImage("");
      setUploadedFile(null);
      setPhotoMode("upload");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Failed to create listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sell-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative my-8 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8">
        <button
          onClick={onClose}
          aria-label="Close sell modal"
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-[#F3F3EE] text-[#556070] transition hover:bg-[#E8E8E3] hover:text-[#102033]"
        >
          <Icon name="x" size={18} />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 rotate-[-4deg] place-items-center rounded-xl bg-[#C8FF35] text-[#102033]">
            <Icon name="plus" size={20} />
          </div>
          <div>
            <h2 id="sell-modal-title" className="text-xl font-extrabold text-[#102033]">
              Sell Something on Campus
            </h2>
            <p className="text-xs text-[#6B7582]">
              Listed under {currentUser.name} · Verified Student
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sell-title" className="mb-1 block text-xs font-bold text-[#3B4758]">
              Listing Title *
            </label>
            <input
              id="sell-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Casio Scientific Calculator or Sem 4 Textbooks"
              className="w-full rounded-xl border border-[#DCDCD6] bg-[#FCFCFA] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#6D45D8] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sell-price" className="mb-1 block text-xs font-bold text-[#3B4758]">
                Asking Price (₹) *
              </label>
              <input
                id="sell-price"
                type="text"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 750"
                className="w-full rounded-xl border border-[#DCDCD6] bg-[#FCFCFA] px-3.5 py-2.5 text-sm font-semibold outline-none transition focus:border-[#6D45D8] focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="sell-category" className="mb-1 block text-xs font-bold text-[#3B4758]">
                Category *
              </label>
              <select
                id="sell-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[#DCDCD6] bg-[#FCFCFA] px-3.5 py-2.5 text-xs font-medium outline-none"
              >
                <option value="Books">Books</option>
                <option value="Electronics">Electronics</option>
                <option value="Hostel Items">Hostel Items</option>
                <option value="Sports">Sports</option>
                <option value="Clothing">Clothing</option>
                <option value="Accessories">Accessories</option>
                <option value="Vehicles">Vehicles</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sell-condition" className="mb-1 block text-xs font-bold text-[#3B4758]">
                Condition
              </label>
              <select
                id="sell-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full rounded-xl border border-[#DCDCD6] bg-[#FCFCFA] px-3.5 py-2.5 text-xs font-medium outline-none"
              >
                <option value="Brand new">Brand new</option>
                <option value="Like new">Like new</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>

            <div>
              <label htmlFor="sell-location" className="mb-1 block text-xs font-bold text-[#3B4758]">
                Pickup Location / Hostel
              </label>
              <input
                id="sell-location"
                type="text"
                required
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="e.g. North Campus, Block B"
                className="w-full rounded-xl border border-[#DCDCD6] bg-[#FCFCFA] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#6D45D8] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-[#3B4758]">
              Item Description & Details
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mention semester, purchase date, minor flaws or what's included..."
              className="w-full rounded-xl border border-[#DCDCD6] bg-[#FCFCFA] px-3.5 py-2.5 text-xs outline-none transition focus:border-[#6D45D8] focus:bg-white"
            />
          </div>

          {/* Item Photo Section */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-xs font-bold text-[#3B4758]">
                Item Photo *
              </label>
              <div className="flex items-center gap-1 rounded-xl bg-[#F3F3EE] p-1 text-[11px] font-semibold text-[#657181]">
                <button
                  type="button"
                  onClick={() => setPhotoMode("upload")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                    photoMode === "upload"
                      ? "bg-white text-[#102033] shadow-xs font-bold"
                      : "hover:text-[#102033]"
                  }`}
                >
                  <Icon name="upload" size={12} />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoMode("preset")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                    photoMode === "preset"
                      ? "bg-white text-[#102033] shadow-xs font-bold"
                      : "hover:text-[#102033]"
                  }`}
                >
                  <Icon name="image" size={12} />
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoMode("url")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                    photoMode === "url"
                      ? "bg-white text-[#102033] shadow-xs font-bold"
                      : "hover:text-[#102033]"
                  }`}
                >
                  <Icon name="tag" size={12} />
                  URL
                </button>
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileProcess(file);
              }}
            />

            {/* Mode 1: Direct File Upload */}
            {photoMode === "upload" && (
              <div>
                {uploadedFile ? (
                  <div className="relative overflow-hidden rounded-2xl border border-[#DCDCD6] bg-[#FCFCFA] p-3 shadow-xs">
                    <div className="flex items-center gap-3.5">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                        <img
                          src={uploadedFile.previewUrl}
                          alt="Uploaded item preview"
                          className="h-full w-full object-cover"
                        />
                        {uploadingImage && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-bold text-[#102033]">
                            {uploadedFile.name}
                          </span>
                          {!uploadingImage ? (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <Icon name="check" size={10} />
                              Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-[#6D45D8]">
                              Uploading...
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#6B7582]">
                          {formatFileSize(uploadedFile.size)} ·{" "}
                          {uploadingImage
                            ? "Saving photo to server..."
                            : "Photo attached"}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCDCD6] bg-white px-2.5 py-1 text-[11px] font-bold text-[#102033] shadow-xs hover:bg-[#F3F3EE] transition"
                          >
                            <Icon name="camera" size={12} />
                            Change photo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedFile(null);
                              setImage("");
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 transition"
                          >
                            <Icon name="trash" size={12} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileProcess(file);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition ${
                        isDragging
                          ? "border-[#6D45D8] bg-[#F4F0FF]"
                          : "border-[#DCDCD6] bg-[#FCFCFA] hover:border-[#6D45D8] hover:bg-[#FAF8FF]"
                      }`}
                    >
                      <div className="mb-2 grid h-11 w-11 place-items-center rounded-2xl bg-[#EBE4FF] text-[#6D45D8] transition group-hover:scale-105">
                        <Icon name="upload" size={20} />
                      </div>
                      <p className="text-xs font-bold text-[#102033]">
                        Click to select photo or drag & drop here
                      </p>
                      <p className="mt-1 text-[11px] text-[#6B7582]">
                        Supports JPG, PNG, WEBP, or GIF up to 5MB
                      </p>
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#102033] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition group-hover:bg-[#6D45D8]">
                        <Icon name="camera" size={13} />
                        Choose from Computer
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-[#6B7582]">
                      <span>No photo on hand?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoMode("preset");
                          setImage(PRESET_IMAGES[0].url);
                        }}
                        className="font-bold text-[#6D45D8] hover:underline"
                      >
                        Pick a campus preset stock photo →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Campus Presets */}
            {photoMode === "preset" && (
              <div>
                <p className="mb-2 text-[11px] text-[#6B7582]">
                  Select a campus photo preset for quick listing:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_IMAGES.map((preset) => {
                    const isSelected = image === preset.url;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setImage(preset.url);
                          setUploadedFile(null);
                        }}
                        className={`group relative aspect-[1.1] overflow-hidden rounded-xl border-2 transition ${
                          isSelected
                            ? "border-[#6D45D8] ring-2 ring-[#6D45D8]/20 shadow-md"
                            : "border-transparent opacity-75 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                        <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1 py-0.5 text-[9px] font-bold text-white">
                          {preset.label}
                        </span>
                        {isSelected && (
                          <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-[#6D45D8] text-white">
                            <Icon name="check" size={10} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mode 3: Custom Web URL */}
            {photoMode === "url" && (
              <div className="space-y-2">
                <input
                  type="url"
                  value={image}
                  onChange={(e) => {
                    setImage(e.target.value);
                    setUploadedFile(null);
                  }}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full rounded-xl border border-[#DCDCD6] bg-[#FCFCFA] px-3.5 py-2.5 text-xs outline-none transition focus:border-[#6D45D8] focus:bg-white"
                />
                {image && (
                  <div className="relative h-28 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    <img
                      src={image}
                      alt="URL preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.opacity = "0.3";
                      }}
                    />
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                      Preview
                    </span>
                  </div>
                )}
              </div>
            )}

            {uploadError && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                {uploadError}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#102033] py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#6D45D8] disabled:opacity-50"
            >
              {loading ? "Publishing listing..." : "Publish Item to Campus Market"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
