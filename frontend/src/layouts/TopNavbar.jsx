import { useNavigate} from "react-router-dom";
import { useState, useRef, useEffect, useContext } from "react";
import AppContext from "../context/AppContext";
import ImageCropModal from "../components/ImageCropModal";
import SearchModal from "../components/SearchModal";
import {
  Bell,
  Search,
  Settings,
  LogOut,
  Upload,
  Camera,
  Trash2,
  FolderKanban,
  CheckSquare,
  Users,
} from "lucide-react";
export default function TopNavbar({
  sidebarOpen,
  setSidebarOpen,
}) {
  const navigate = useNavigate();
  const { projects, tasks, members } = useContext(AppContext);
  const userEmail = localStorage.getItem("userEmail") || "";

  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

const [showCropModal, setShowCropModal] = useState(false);

const [selectedImage, setSelectedImage] = useState(null);

const [profileImage, setProfileImage] = useState(
  localStorage.getItem("profileImage") || null
);
useEffect(() => {
  const handleProfileImageUpdate = () => {
    setProfileImage(localStorage.getItem("profileImage"));
  };

  window.addEventListener("profileImageUpdated", handleProfileImageUpdate);

  return () => {
    window.removeEventListener("profileImageUpdated", handleProfileImageUpdate);
  };
}, []);
const [searchText, setSearchText] = useState("");
const [showSearchResults, setShowSearchResults] = useState(false);
const [showMobileSearch, setShowMobileSearch] = useState(false);
useEffect(() => {
  function handleClickOutside(event) {
    if (
      profileMenuRef.current &&
      !profileMenuRef.current.contains(event.target)
    ) {
      setShowPhotoMenu(false);
      setShowPhotoOptions(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

useEffect(() => {
  function handleOutsideClick(event) {
    if (
      showMobileSearch &&
      searchModalRef.current &&
      !searchModalRef.current.contains(event.target)
    ) {
      setShowMobileSearch(false);
    }
  }

  document.addEventListener("mousedown", handleOutsideClick);

  return () => {
    document.removeEventListener("mousedown", handleOutsideClick);
  };
}, [showMobileSearch]);

  const handleLogout = () => {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userId");
  window.location.href = "/";
};
const handleImageSelect = (event) => {
  const file = event.target.files[0];

  if (!file) return;

  const imageUrl = URL.createObjectURL(file);

  setSelectedImage(imageUrl);

  setShowCropModal(true);

  setShowPhotoOptions(false);
};

const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    streamRef.current = stream;

    setShowCamera(true);

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }, 100);
  } catch {
    alert("Unable to access camera.");
  }
};

const stopCamera = () => {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach((track) => track.stop());
  }

  setShowCamera(false);
};
const capturePhoto = () => {
  const canvas = canvasRef.current;
  const video = videoRef.current;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  const image = canvas.toDataURL("image/png");

  setSelectedImage(image);

stopCamera();

setShowCropModal(true);

setShowPhotoOptions(false);
};
  const userInitial = userEmail
    ? userEmail.charAt(0).toUpperCase()
    : "U";
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
const canvasRef = useRef(null);
const streamRef = useRef(null);
  const profileMenuRef = useRef(null);
  const searchModalRef = useRef(null);
  const filteredResults =
  searchText.trim() === ""
    ? []
    : [
        ...projects.map(project => ({
          id: project.id,
          type: "project",
          name: project.name,
        })),
        ...tasks.map(task => ({
          id: task.id,
          type: "task",
          name: task.name,
        })),
        ...members.map(member => ({
          id: member.id,
          type: "member",
          name: member.full_name || member.name || member.email,
        })),
      ].filter(item =>
        item.name?.toLowerCase().includes(searchText.toLowerCase())
      );

const handleSearchClick = (item) => {
  setShowSearchResults(false);
  setShowMobileSearch(false);

  switch (item.type) {
    case "project":
  navigate(`/projects/${item.id}`, {
    state: {
      highlightProjectId: item.id,
    },
  });
  break;

    case "task":
  navigate("/tasks", {
    state: {
      highlightTaskId: item.id,
    },
  });
  break;

    case "member":
  navigate("/teams", {
    state: {
      highlightMemberId: item.id,
    },
  });
  break;

    default:
      break;
  }
};

  return (
    <>
    <div className="h-16 bg-white/5 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 md:px-6 relative z-50">
      <div className="relative flex items-center gap-3">
  <button
    onClick={() => setSidebarOpen(!sidebarOpen)}
    className="md:hidden text-2xl text-white"
  >
    ☰
  </button>

  <input
  type="text"
  placeholder="Search projects, tasks, members..."
  value={searchText}
  onChange={(e) => {
  const value = e.target.value;

  setSearchText(value);

  setShowSearchResults(value.trim().length > 0);
}}
  onFocus={() => {
  if (searchText.trim()) {
    setShowSearchResults(true);
  }
}}
  className="hidden md:block bg-black/20 border border-white/10 text-white placeholder-slate-400 rounded-lg px-4 py-2 w-80 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
/>
{showSearchResults && (
  <div className="absolute top-14 left-0 w-full md:w-80 bg-slate-900 border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-[9999]">

    {filteredResults.length === 0 ? (
      <div className="px-4 py-3 text-slate-400 text-sm">
        No results found
      </div>
    ) : (
      filteredResults.map((item) => (
        <button
          key={`${item.type}-${item.id}`}
          onClick={() => handleSearchClick(item)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition text-left"
        >
          {item.type === "project" && (
            <FolderKanban size={18} className="text-cyan-400" />
          )}

          {item.type === "task" && (
            <CheckSquare size={18} className="text-green-400" />
          )}

          {item.type === "member" && (
            <Users size={18} className="text-purple-400" />
          )}

          <div>
            <p className="text-white">{item.name}</p>
            <p className="text-xs text-slate-400 capitalize">
              {item.type}
            </p>
          </div>
        </button>
      ))
    )}

  </div>
)}
</div>

      <div className="flex items-center gap-2 md:gap-4">
        {userEmail && (
  <span className="hidden md:block text-slate-300 text-sm font-medium mr-2">
    {userEmail}
  </span>
)}
<button
  onClick={() => setShowMobileSearch((prev) => !prev)}
  className="md:hidden hover:scale-110 transition text-slate-300 hover:text-white"
>
  <Search size={22} />
</button>

        <button
  onClick={() => navigate("/notifications")}
  className="hover:scale-110 transition text-slate-300 hover:text-white"
>
  <Bell size={22} />
</button>

        <div className="relative" ref={profileMenuRef}>
  <button
  onClick={() => setShowPhotoMenu(!showPhotoMenu)}
  className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-white/10 flex items-center justify-center"
>
  {profileImage ? (
    <img
      src={profileImage}
      alt="Profile"
      className="w-full h-full object-cover"
    />
  ) : (
    <span className="text-white font-bold">
      {userInitial}
    </span>
  )}
</button>
<input
  type="file"
  accept="image/*"
  ref={fileInputRef}
  onChange={handleImageSelect}
  className="hidden"
/>

  {showPhotoMenu && (
  <div className="absolute right-0 mt-3 w-64 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-visible z-[9999]">

    <div className="px-5 py-5 flex flex-col items-center border-b border-white/10">

      <div
  onClick={() => setShowPhotoOptions(!showPhotoOptions)}
  className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-cyan-500 mb-3 cursor-pointer"
>

        {profileImage ? (
          <img
            src={profileImage}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-2xl font-bold text-white">
            {userInitial}
          </div>
        )}

      </div>

      <p className="text-sm text-slate-300 break-all text-center">
        {userEmail}
      </p>

    </div>
    {showPhotoOptions && (
  <div className="absolute top-28 left-1/2 -translate-x-1/2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">

    <button
      onClick={() => fileInputRef.current.click()}
      className="w-full flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-white/10"
    >
      <Upload size={18} className="text-cyan-400" />
      Upload from Device
    </button>

    <button
      onClick={startCamera}
      className="w-full flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-white/10"
    >
      <Camera size={18} className="text-cyan-400" />
      Take Photo
    </button>

    {profileImage && (
      <button
        onClick={async () => {
          try {
            const token = localStorage.getItem("token");
            await fetch(`${import.meta.env.VITE_API_URL}/users/me/avatar`, {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${token}`
              }
            });
            setProfileImage(null);
            localStorage.removeItem("profileImage");
            setShowPhotoOptions(false);
          } catch (err) {
            console.error("Failed to remove photo", err);
          }
        }}
        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10"
      >
        <Trash2 size={18} />
        Remove Photo
      </button>
    )}

  </div>
)}

    <div className="border-t border-white/10">

      <button
  onClick={() => navigate("/settings")}
  className="w-full flex items-center gap-3 px-5 py-3 text-slate-200 hover:bg-white/10 transition"
>
  <Settings size={18} />
  Settings
</button>

      <button
  onClick={handleLogout}
  className="w-full flex items-center gap-3 px-5 py-3 text-red-400 hover:bg-red-500/10 transition"
>
  <LogOut size={18} />
  Logout
</button>

    </div>

  </div>
)}
</div>
      </div>
    </div>

        {showCamera && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999]">
        <div className="bg-slate-900 rounded-2xl p-6 border border-white/10 w-[420px]">

          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-xl"
          />

          <canvas
            ref={canvasRef}
            className="hidden"
          />

          <div className="flex justify-between mt-5">

            <button
              onClick={stopCamera}
              className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
            >
              Cancel
            </button>

            <button
              onClick={capturePhoto}
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Capture
            </button>

          </div>

        </div>
      </div>
    )}
    <SearchModal
  open={showMobileSearch}
  onClose={() => setShowMobileSearch(false)}
  searchText={searchText}
  setSearchText={setSearchText}
  filteredResults={filteredResults}
  handleSearchClick={handleSearchClick}
  modalRef={searchModalRef}
/>

    {showCropModal && (
  <ImageCropModal
  image={selectedImage}
  onCancel={() => {
    setShowCropModal(false);
    setSelectedImage(null);
  }}
  onSave={async (croppedImage) => {
    // Show the cropped image instantly for good UX
    setProfileImage(croppedImage);
    localStorage.setItem("profileImage", croppedImage);

    setShowCropModal(false);
    setShowPhotoMenu(false);
    setShowPhotoOptions(false);
    setSelectedImage(null);

    // Send it to the backend
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me/avatar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ avatar_base64: croppedImage })
      });
      
      if (response.ok) {
        const data = await response.json();
        // The backend returns the permanent URL path (e.g. /uploads/users/...)
        // Prefix it with the API host for absolute URL
        const backendHost = import.meta.env.VITE_API_URL.replace("/api", "").replace(/\/$/, "");
        const fullUrl = `${backendHost}${data.profile_image}`;
        
        setProfileImage(fullUrl);
        localStorage.setItem("profileImage", fullUrl);
        window.dispatchEvent(new Event("profileImageUpdated"));
      }
    } catch (err) {
      console.error("Failed to save profile picture to backend", err);
    }
  }}
/>
)}
  </>
);
}