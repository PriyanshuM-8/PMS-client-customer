import { useEffect, useState, useRef } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import BottomNav from "../components/BottomNav";
import Swal from "sweetalert2";

// imgage

import vehicle from '/Image/transport.png'
import biker from '/Image/bycicle.png'
import scooter from '/Image/motorcycle.png'
import truck from '/Image/truck.png'
import car from '/Image/sport-car.png'
import auto from '/Image/rickshaw.png'
import bus from '/Image/bus.png'


const inputCls =
  "w-full bg-gray-50 border border-gray-100 text-gray-900 placeholder-gray-400 rounded-xl px-3.5 py-3 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition text-xs";
const selectCls =
  "bg-gray-50 border border-gray-100 text-gray-700 rounded-xl px-2.5 py-3 focus:outline-none focus:border-red-400 transition text-xs";

export default function Profile() {
  const { user, logout } = useAuth();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit profile form
  const [nameForm, setNameForm] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  // Phone change flow
  const [phoneStep, setPhoneStep] = useState("old"); // 'old' | 'new' | 'otp'
  const [oldPhone, setOldPhone] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");

  // Vehicle form
  const [newVehicle, setNewVehicle] = useState({
    vehicleType: "bike",
    vehicleNumber: "",
    fuelType: "petrol",
  });

  const fetchProfile = () => {
    api
      .get("/customers/me")
      .then(({ data }) => {
        const p = data.data.profile;
        const u = data.data.user;
        setProfile(p);
        setUserInfo(u);
        if (p) {
          setNameForm(p.name);
          // newPhone intentionally empty rakho — user khud naya number type kare
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const closeSheet = () => {
    setActiveSheet(null);
    setError("");
    setSuccess("");
    setPhoneStep("old");
    setPhoneOtp("");
    setOldPhone("");
    setNewPhone("");
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  // ── Photo select ──────────────────────────────────────────────────────────
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // ── Save name + photo ─────────────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let resData;
      if (photoFile) {
        const fd = new FormData();
        if (nameForm.trim()) fd.append("name", nameForm.trim());
        if (!photoFile && !nameForm.trim()) {
          setError("Nothing to update");
          setLoading(false);
          return;
        }
        fd.append("profileImage", photoFile);
        const { data } = await api.put("/customers/profile", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        resData = data;
      } else {
        const { data } = await api.put("/customers/profile", {
          name: nameForm.trim(),
        });
        resData = data;
      }
      setProfile(resData.data);
      setSuccess("Profile updated!");
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Request phone OTP ─────────────────────────────────────────────────────
  const handleRequestPhoneOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/customers/profile/phone/request", {
        phone: newPhone,
      });
      setSuccess(data.message);
      setPhoneStep("otp");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── Verify phone OTP ──────────────────────────────────────────────────────
  const handleVerifyPhoneOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/customers/profile/phone/verify", {
        otp: phoneOtp,
      });
      setProfile(data.data);
      setSuccess("Phone number updated!");
      setPhoneStep("old");
      setPhoneOtp("");
      setOldPhone("");
      setNewPhone("");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── Add vehicle ───────────────────────────────────────────────────────────
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/customers/vehicles", newVehicle);
      setProfile(data.data);
      setNewVehicle({
        vehicleType: "bike",
        vehicleNumber: "",
        fuelType: "petrol",
      });
      setSuccess("Vehicle added!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed");
    }
  };

  const handleRemoveVehicle = async (vehicleId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, remove it!",
    });
    if (!result.isConfirmed) return;
    try {
      const { data } = await api.delete(`/customers/vehicles/${vehicleId}`);
      setProfile(data.data);
      Swal.fire({
        title: "Removed!",
        text: "Vehicle has been removed.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed");
    }
  };

  const displayName = profile?.name || user?.name || "User";
  const displayPhone = profile?.phone || "—";
  const displayEmail = userInfo?.email || user?.email || "—";
  const avatarImg = profile?.profileImage;

  const menuSections = [
    {
      title: "Account",
      items: [
        // { icon: <i className="ri-user-line" />, label: 'Edit Profile', action: () => setActiveSheet('edit') },
        // { icon: <i className="ri-smartphone-line" />, label: 'Change Phone', sub: displayPhone, action: () => setActiveSheet('phone') },
        {
          icon: <i className="ri-car-line" />,
          label: "My Vehicles",
          badge: profile?.vehicles?.length ?? 0,
          action: () => setActiveSheet("vehicle"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: <i className="ri-question-line" />,
          label: "Help & FAQ",
          action: () => setActiveSheet("help"),
        },
        {
          icon: <i className="ri-phone-line" />,
          label: "Contact Us",
          sub: "+91 8957645372",
        },
      ],
    },
    {
      title: "Legal",
      items: [
        {
          icon: <i className="ri-lock-line" />,
          label: "Privacy Policy",
          action: () => setActiveSheet("privacy"),
        },
        {
          icon: <i className="ri-file-text-line" />,
          label: "Terms of Service",
          action: () => setActiveSheet("terms"),
        },
        {
          icon: <i className="ri-information-line" />,
          label: "About PM CareX",
          action: () => setActiveSheet("about"),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* ── Header ── */}
      <div className="px-5 pt-10 pb-16 bg-gradient-to-tr from-red-600 to-amber-500 rounded-b-[2.5rem] shadow-xl shadow-red-200/60">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-black text-white tracking-tight">
            Profile
          </h1>
          <button
            onClick={logout}
            className="bg-white/20 border border-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full active:scale-95 transition"
          >
            Logout
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          {/* Avatar */}
          <button
            onClick={() => setActiveSheet("edit")}
            className="relative flex-shrink-0"
          >
            <div className="w-14 h-14 rounded-full border-2 border-white/40 shadow-lg overflow-hidden bg-white/20">
              {avatarImg ? (
                <img
                  src={avatarImg}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white">
                  {displayName[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
              <i className="ri-camera-line text-red-500 text-[10px]" />
            </div>
          </button>

          <div className="min-w-0 flex-1">
            <h2 className="text-white font-black text-base leading-tight">
              {displayName}
            </h2>
            <p className="text-white/60 text-[11px] mt-0.5">{displayPhone}</p>
            <p className="text-white/40 text-[10px] mt-0.5 truncate">
              {displayEmail}
            </p>
          </div>

          <button
            onClick={() => setActiveSheet("edit")}
            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center border border-white/20 flex-shrink-0"
          >
            <i className="ri-edit-line text-white text-sm" />
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="px-5 -mt-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex justify-around">
          {[
            { label: "Orders", value: profile?.totalOrders ?? 0 },
            { label: "Vehicles", value: profile?.vehicles?.length ?? 0 },
            { label: "Wallet", value: `₹${profile?.walletBalance ?? 0}` },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-gray-900 font-black text-base">{value}</p>
              <p className="text-gray-400 text-[9px] uppercase tracking-wider mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Edit Profile Button */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => setActiveSheet("edit")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold text-xs shadow-md shadow-red-200/60 active:scale-[0.98] transition"
          >
            <i className="ri-edit-line text-sm" />
            Edit Profile
          </button>
          <button
            onClick={() => setActiveSheet("phone")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-xs shadow-sm active:scale-[0.98] transition"
          >
            <i className="ri-smartphone-line text-sm text-red-500" />
            Change Phone
          </button>
        </div>
      </div>

      {/* ── Menu ── */}
      <div className="px-5 mt-4 space-y-3">
        {menuSections.map((section) => (
          <div key={section.title}>
            <p className="text-gray-400 text-[9px] uppercase tracking-widest mb-1.5 px-1">
              {section.title}
            </p>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition text-left ${i !== 0 ? "border-t border-gray-50" : ""}`}
                >
                  <span className="text-base w-6 text-center text-gray-500 flex-shrink-0">
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-xs font-semibold">
                      {item.label}
                    </p>
                    {item.sub && (
                      <p className="text-gray-400 text-[10px] mt-0.5">
                        {item.sub}
                      </p>
                    )}
                  </div>
                  {item.badge !== undefined && (
                    <span className="bg-red-50 text-red-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-red-100">
                      {item.badge}
                    </span>
                  )}
                  <svg
                    className="w-3.5 h-3.5 text-gray-300 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 active:bg-red-50 transition"
          >
            <span className="text-base w-6 text-center">
              <i className="ri-logout-circle-line text-red-500" />
            </span>
            <p className="flex-1 text-red-500 text-xs font-bold text-left">
              Logout
            </p>
          </button>
        </div>

        <p className="text-center text-gray-300 text-[10px] pb-2">
          PM CareX v1.0.0 · Made in India
        </p>
      </div>

      {/* ── Bottom Sheets ── */}
      {activeSheet && (
        <BottomSheet onClose={closeSheet}>
          {/* ── Edit Profile (name + photo) ── */}
          {activeSheet === "edit" && (
            <SheetContent title="Edit Profile">
              <form onSubmit={handleSaveProfile} className="space-y-3">
                {/* Photo picker */}
                <div className="flex flex-col items-center gap-2 pb-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="relative w-20 h-20 rounded-full border-2 border-dashed border-red-300 overflow-hidden bg-gray-50 flex items-center justify-center"
                  >
                    {photoPreview || avatarImg ? (
                      <img
                        src={photoPreview || avatarImg}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className="ri-camera-line text-2xl text-red-400" />
                    )}
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                      <i className="ri-camera-line text-white text-xl" />
                    </div>
                  </button>
                  <p className="text-gray-400 text-[10px]">
                    Tap to change photo
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </div>

                <input
                  value={nameForm}
                  onChange={(e) => setNameForm(e.target.value)}
                  placeholder="Full Name"
                  className={inputCls}
                />

                {error && <p className="text-red-500 text-xs">{error}</p>}
                {success && (
                  <p className="text-green-500 text-xs font-bold">{success}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mb-9 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold text-xs shadow-md shadow-red-200/60 disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </SheetContent>
          )}

          {/* ── Change Phone (Twilio OTP) ── */}
          {activeSheet === "phone" && (
            <SheetContent title="Change Phone Number">
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-5">
                {["Old Number", "New Number", "Verify OTP"].map((label, i) => {
                  const stepMap = { 0: "old", 1: "new", 2: "otp" };
                  const isActive = phoneStep === stepMap[i];
                  const isDone =
                    (i === 0 && (phoneStep === "new" || phoneStep === "otp")) ||
                    (i === 1 && phoneStep === "otp");
                  return (
                    <div key={label} className="flex items-center gap-1 flex-1">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 ${
                          isDone
                            ? "bg-green-500 text-white"
                            : isActive
                              ? "bg-gradient-to-tr from-red-600 to-amber-500 text-white"
                              : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {isDone ? "✓" : i + 1}
                      </div>
                      <p
                        className={`text-[9px] font-bold truncate ${
                          isActive
                            ? "text-red-500"
                            : isDone
                              ? "text-green-500"
                              : "text-gray-300"
                        }`}
                      >
                        {label}
                      </p>
                      {i < 2 && (
                        <div
                          className={`flex-1 h-0.5 rounded-full ${
                            isDone ? "bg-green-400" : "bg-gray-100"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Step 1: Old number */}
              {phoneStep === "old" && (
                <div className="space-y-3">
                  <p className="text-gray-500 text-xs">
                    Enter your{" "}
                    <span className="font-bold text-gray-700">current</span>{" "}
                    phone number to verify identity
                  </p>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">
                      +91
                    </span>
                    <input
                      value={oldPhone}
                      onChange={(e) =>
                        setOldPhone(
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                      placeholder="Current phone number"
                      className={`${inputCls} pl-10`}
                      maxLength={10}
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs">{error}</p>}
                  <button
                    onClick={() => {
                      if (oldPhone.length !== 10)
                        return setError("Enter valid 10-digit number");
                      setError("");
                      setPhoneStep("new");
                    }}
                    disabled={oldPhone.length !== 10}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold text-xs shadow-md shadow-red-200/60 disabled:opacity-60"
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* Step 2: New number */}
              {phoneStep === "new" && (
                <form onSubmit={handleRequestPhoneOTP} className="space-y-3">
                  <p className="text-gray-500 text-xs">
                    Enter your{" "}
                    <span className="font-bold text-gray-700">new</span> phone
                    number
                  </p>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">
                      +91
                    </span>
                    <input
                      value={newPhone}
                      onChange={(e) =>
                        setNewPhone(
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                      placeholder="New phone number"
                      className={`${inputCls} pl-10`}
                      maxLength={10}
                      required
                    />
                  </div>
                  <p className="text-gray-400 text-[10px]">
                    OTP will be sent to this number via SMS
                  </p>
                  {error && <p className="text-red-500 text-xs">{error}</p>}
                  {success && (
                    <p className="text-green-500 text-xs font-bold">
                      {success}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading || newPhone.length !== 10}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold text-xs shadow-md shadow-red-200/60 disabled:opacity-60"
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneStep("old");
                      setError("");
                    }}
                    className="w-full text-gray-400 text-xs py-1"
                  >
                    ← Back
                  </button>
                </form>
              )}

              {/* Step 3: OTP verify */}
              {phoneStep === "otp" && (
                <form onSubmit={handleVerifyPhoneOTP} className="space-y-3">
                  <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                    <p className="text-green-600 text-xs font-semibold">
                      OTP sent to +91{newPhone}
                    </p>
                    <p className="text-green-500 text-[10px] mt-0.5">
                      Valid for 10 minutes
                    </p>
                  </div>
                  <input
                    value={phoneOtp}
                    onChange={(e) =>
                      setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter 6-digit OTP"
                    className={`${inputCls} text-center tracking-[0.4em] text-base font-bold`}
                    maxLength={6}
                    required
                  />
                  {error && <p className="text-red-500 text-xs">{error}</p>}
                  {success && (
                    <p className="text-green-500 text-xs font-bold">
                      {success}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading || phoneOtp.length !== 6}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold text-xs shadow-md shadow-red-200/60 disabled:opacity-60"
                  >
                    {loading ? "Verifying..." : "Verify & Update"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneStep("new");
                      setError("");
                      setSuccess("");
                    }}
                    className="w-full text-gray-400 text-xs py-1"
                  >
                    ← Change number
                  </button>
                </form>
              )}
            </SheetContent>
          )}
{/* ── Vehicles ── */}
{activeSheet === "vehicle" && (
  <SheetContent title="My Vehicles">
    {/* Vehicle List */}
    <div className="space-y-3 mb-4">
      {profile?.vehicles?.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl py-6 text-center">
          <img
            src={vehicle}
            alt="vehicle"
            className="h-20 w-20 mx-auto object-contain"
          />
          <p className="text-gray-400 text-xs mt-2">
            No vehicles added yet
          </p>
        </div>
      ) : (
        profile?.vehicles?.map((v) => (
          <div
            key={v._id}
            className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm flex items-center gap-3"
          >
            {/* Vehicle image */}
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <img
                src={
                  v.vehicleType === "bike"
                    ? biker
                    : v.vehicleType === "scooter"
                    ? scooter
                    : v.vehicleType === "car"
                    ? car
                    : v.vehicleType === "truck"
                    ? truck
                    : v.vehicleType === "bus"
                    ? bus
                    : auto
                }
                alt={v.vehicleType}
                className="w-8 h-8 object-contain"
              />
            </div>

            {/* Vehicle Info */}
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 text-xs font-bold capitalize">
                {v.vehicleType}
              </p>
              <p className="text-gray-500 text-[11px] mt-0.5">
                {v.vehicleNumber.toUpperCase()}
              </p>
              <p className="text-gray-400 text-[10px] capitalize mt-0.5">
                Fuel: {v.fuelType}
              </p>
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => handleRemoveVehicle(v._id)}
              className="text-red-500 text-[10px] font-bold bg-red-50 border border-red-100 px-3 py-1 rounded-full"
            >
              Remove
            </button>
          </div>
        ))
      )}
    </div>

    {/* Add Vehicle Form */}
    <form
      onSubmit={handleAddVehicle}
      className="border-t border-gray-100 pt-4 space-y-4"
    >
      <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">
        Add New Vehicle
      </p>

      {/* Vehicle Type Custom Selector */}
      <div>
        <p className="text-gray-500 text-[10px] font-bold mb-2">
          Select Vehicle Type
        </p>

        <div className="grid grid-cols-3 gap-2">
          {[
            { type: "bike", img: biker, label: "Bike" },
            { type: "scooter", img: scooter, label: "Scooter" },
            { type: "car", img: car, label: "Car" },
            { type: "truck", img: truck, label: "Truck" },
            { type: "bus", img: bus, label: "Bus" },
            { type: "auto", img: auto, label: "Auto" },
          ].map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() =>
                setNewVehicle({
                  ...newVehicle,
                  vehicleType: item.type,
                })
              }
              className={`rounded-2xl border p-3 flex flex-col items-center justify-center gap-2 transition-all ${
                newVehicle.vehicleType === item.type
                  ? "border-red-500 bg-red-50 shadow-sm"
                  : "border-gray-200 bg-white"
              }`}
            >
              <img
                src={item.img}
                alt={item.label}
                className="w-10 h-10 object-contain"
              />
              <span
                className={`text-[11px] font-semibold ${
                  newVehicle.vehicleType === item.type
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle Number */}
      <input
        value={newVehicle.vehicleNumber}
        onChange={(e) =>
          setNewVehicle({
            ...newVehicle,
            vehicleNumber: e.target.value.toUpperCase(),
          })
        }
        placeholder="Vehicle Number (e.g. UP00ABXXXX)"
        required
        maxLength={15}
        className={inputCls}
      />

      {/* Fuel Type */}
      <select
        value={newVehicle.fuelType}
        onChange={(e) =>
          setNewVehicle({
            ...newVehicle,
            fuelType: e.target.value,
          })
        }
        className={inputCls}
      >
        <option value="petrol">Petrol</option>
        <option value="diesel">Diesel</option>
      </select>

      {error && <p className="text-red-500 text-xs">{error}</p>}
      {success && (
        <p className="text-green-500 text-xs font-bold">{success}</p>
      )}

      <button
        type="submit"
        className="w-full py-3  mb-7 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold text-xs shadow-md shadow-red-200/60"
      >
        Add Vehicle
      </button>
    </form>
  </SheetContent>
)}

          {/* ── Privacy ── */}
          {activeSheet === "privacy" && (
            <SheetContent title="Privacy Policy">
              <div className="space-y-3 text-xs text-gray-500 leading-relaxed">
                <p className="text-gray-800 font-bold text-sm">
                  Your Privacy Matters
                </p>

                <p>
                  PM CareX is committed to protecting your personal
                  information and maintaining your trust while using our fuel
                  delivery and roadside assistance services.
                </p>

                <SectionBlock title="Information We Collect">
                  We collect basic information such as your name, phone number,
                  profile picture, vehicle details, and live location only to
                  provide booking, fuel delivery, and mechanic assistance
                  services efficiently.
                </SectionBlock>

                <SectionBlock title="Location Usage">
                  Your live location is accessed only during active bookings to
                  help nearby petrol pumps and mechanics reach you quickly. We
                  do not track your location continuously.
                </SectionBlock>

                <SectionBlock title="Communication Privacy">
                  To protect customer privacy, PM CareX may use masked
                  communication services for calls and messages between
                  customers, mechanics, and petrol pumps.
                </SectionBlock>

                <SectionBlock title="Data Security">
                  All communication is secured using HTTPS encryption. Passwords
                  are securely hashed, and sensitive account information is
                  protected from unauthorized access.
                </SectionBlock>

                <SectionBlock title="Payments">
                  Payment information is processed securely through supported
                  payment providers. PM CareX does not store your card or
                  banking details directly.
                </SectionBlock>

                <SectionBlock title="Account Deletion">
                  You may request account deletion or data removal anytime by
                  contacting our support team.
                </SectionBlock>

                <p className="text-gray-400 text-[11px]">
                  Support: support@pmpetrocarex.com
                </p>

                <p className="text-gray-300 text-[10px]">
                  Last updated: May 2026
                </p>
              </div>
            </SheetContent>
          )}

          {/* ── Terms ── */}
          {activeSheet === "terms" && (
            <SheetContent title="Terms of Service">
              <div className="space-y-3 text-xs text-gray-500 leading-relaxed">
                <SectionBlock title="Service Usage">
                  PM CareX provides on-demand fuel delivery and roadside
                  mechanic assistance services. Users must provide accurate
                  vehicle details, booking information, and live location for
                  successful service delivery.
                </SectionBlock>

                <SectionBlock title="Bookings & Cancellations">
                  Customers may cancel bookings at any time before they are completed. Once service has been completed, cancellation is not available.
                </SectionBlock>

                <SectionBlock title="Payments">
                  All payments are processed securely through supported payment
                  methods. Customers are responsible for completing payment
                  after successful service delivery.
                </SectionBlock>

                <SectionBlock title="User Responsibilities">
                  Users must not misuse the platform, provide false booking
                  details, create fake emergency requests, or interfere with
                  assigned mechanics or delivery agents.
                </SectionBlock>

                <SectionBlock title="Service Availability">
                  Service availability depends on nearby petrol pumps,
                  mechanics, operating hours, and geographic coverage area.
                </SectionBlock>

                <SectionBlock title="Liability">
                  PM CareX acts as a service facilitation platform
                  connecting customers, petrol pumps, and mechanics. Liability
                  is limited to the amount paid for the specific booking.
                </SectionBlock>

                <SectionBlock title="Account Suspension">
                  PM CareX reserves the right to suspend or terminate
                  accounts involved in suspicious activity, payment fraud,
                  abuse, or policy violations.
                </SectionBlock>

                <p className="text-gray-300 text-[10px]">
                  Last updated: May 2026
                </p>
              </div>
            </SheetContent>
          )}

          {/* ── About ── */}
          {activeSheet === "about" && (
            <SheetContent title="About PM CareX">
              <div className="text-center py-2">
                <img
                  src="/Image/Logo.png"
                  alt="PM CareX"
                  className="w-20 h-20 object-contain mx-auto drop-shadow-lg"
                />
                <p className="text-gray-400 text-xs mt-2">Version 1.0.0</p>
              </div>

              <div className="space-y-3 mt-4 text-xs text-gray-500 leading-relaxed">
                <p>
                  PM CareX is an on-demand roadside assistance platform
                  designed to provide emergency fuel delivery and mechanic
                  support directly to your live location.
                </p>

                <SectionBlock title="Our Mission">
                  To make roadside emergencies stress-free by connecting
                  customers with nearby petrol pumps and verified mechanics
                  quickly, safely, and efficiently.
                </SectionBlock>

                <SectionBlock title="Services">
                  {
                    "• Emergency Fuel Delivery\n• Mechanic Assistance\n• Battery Support\n• Puncture Repair\n• Live Booking Tracking"
                  }
                </SectionBlock>

                <SectionBlock title="Contact Us">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <i className="ri-mail-line text-red-500 text-sm"></i>
                      <span>support@pmpetrocarex.com</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <i className="ri-phone-line text-green-500 text-sm"></i>
                      <span>+91 8957645372</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <i className="ri-global-line text-blue-500 text-sm"></i>
                      <span>www.pmpetrocarex.com</span>
                    </div>
                  </div>
                </SectionBlock>

                <p className="text-center text-[10px] text-gray-300 pt-2">
                  © 2026 PM CareX. All rights reserved.
                </p>
              </div>
            </SheetContent>
          )}

          {/* ── Help ── */}
          {activeSheet === "help" && (
            <SheetContent title="Help & FAQ">
              <div className="space-y-2">
                {[
                  {
                    q: "How long does fuel delivery take?",
                    a: "Fuel delivery usually takes 20–40 minutes depending on your location, traffic conditions, and nearby petrol pump availability.",
                  },
                  {
                    q: "How does mechanic assistance work?",
                    a: "After you create a mechanic request, the nearest petrol pump receives it and assigns an available internal or approved external mechanic.",
                  },
                  {
                    q: "Can I cancel my booking?",
                    a: "Yes, bookings can be cancelled at any time before they are completed. However, you cannot cancel once the service has been completed.",
                  },
                  {
                    q: "How can I track my booking?",
                    a: "Go to My Bookings or History section to track live status such as Pending, Accepted, Assigned, On The Way, and Completed.",
                  },
                  {
                    q: "How is OTP used?",
                    a: "OTP is required only to confirm service completion. Share it with the mechanic or delivery partner only after work is completed.",
                  },
                  {
                    q: "Is my phone number safe?",
                    a: "Yes. PM CareX uses secure masked communication so your personal mobile number is not directly shared.",
                  },
                  {
                    q: "What payment methods are available?",
                    a: "You can pay using UPI, Debit Card, Credit Card, Wallet, or Cash (if supported in your area).",
                  },
                  {
                    q: "Location not detected?",
                    a: "Please enable location permission in your browser or device settings and refresh the app.",
                  },
                  {
                    q: "How do I update profile details?",
                    a: "Go to Profile section to update your name, phone number, and profile picture anytime.",
                  },
                  {
                    q: "Need more help?",
                    a: "Contact our support team through the Help section or email us at support@pmpetrocarex.com.",
                  },
                ].map(({ q, a }) => (
                  <div
                    key={q}
                    className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                  >
                    <p className="text-gray-800 text-xs font-bold">{q}</p>
                    <p className="text-gray-400 text-[11px] mt-1 leading-relaxed">
                      {a}
                    </p>
                  </div>
                ))}
              </div>
            </SheetContent>
          )}
        </BottomSheet>
      )}

      <BottomNav />
    </div>
  );
}

function BottomSheet({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-[2rem] max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="overflow-y-auto px-5 pt-1 pb-16 flex-1">{children}</div>
      </div>
    </div>
  );
}

function SheetContent({ title, children }) {
  return (
    <div>
      <h2 className="text-gray-900 font-black text-base mb-4">{title}</h2>
      {children}
    </div>
  );
}

function SectionBlock({ title, children }) {
  return (
    <div>
      <p className="text-gray-700 font-bold text-xs mb-1">{title}</p>
      <div className="text-gray-400 leading-relaxed whitespace-pre-line text-xs">
        {children}
      </div>
    </div>
  );
}
