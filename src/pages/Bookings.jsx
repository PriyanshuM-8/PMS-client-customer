import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import BottomNav from "../components/BottomNav";
import {
  FaGasPump,
  FaWrench,
  FaChevronRight,
  FaClipboardList,
} from "react-icons/fa";

const statusConfig = {
  pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-600 border-amber-200",
  },
  accepted: {
    label: "Accepted",
    cls: "bg-blue-50 text-blue-600 border-blue-200",
  },
  assigned: {
    label: "Assigned",
    cls: "bg-purple-50 text-purple-600 border-purple-200",
  },
  in_progress: {
    label: "In Progress",
    cls: "bg-orange-50 text-orange-600 border-orange-200",
  },
  completed: {
    label: "Completed",
    cls: "bg-green-50 text-green-600 border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    cls: "bg-red-50 text-red-500 border-red-200",
  },
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api
      .get("/bookings/my")
      .then(({ data }) =>
        setBookings(Array.isArray(data.data) ? data.data : []),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-28">
      {/* Header */}
      <div className="px-5 pt-12 pb-6 bg-gradient-to-br from-red-600 via-red-500 to-amber-500 rounded-b-[2.5rem] shadow-xl shadow-red-300/40">
        <h1 className="text-2xl font-black text-white tracking-tight">
          History
        </h1>
        <p className="text-white/60 text-xs mt-0.5">
          All your past & active orders
        </p>
        <div className="flex gap-1.5 mt-4 overflow-x-auto pb-0.5">
          {["all", "pending", "in_progress", "completed", "cancelled"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-all capitalize ${
                  filter === f
                    ? "bg-white text-red-600 shadow-sm"
                    : "bg-white/20 text-white"
                }`}
              >
                {f === "all" ? "All" : f.replace("_", " ")}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="px-5 mt-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm mt-2">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FaClipboardList className="text-red-400 text-2xl" />
            </div>
            <p className="text-gray-700 font-bold text-sm">No bookings found</p>
            <p className="text-gray-400 text-xs mt-1">
              Your booking history will appear here
            </p>
          </div>
        ) : (
          filtered.map((b) => {
            const s = statusConfig[b.status] || statusConfig.pending;
            return (
              <Link
                to={`/bookings/${b._id}`}
                key={b._id}
                className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-amber-500 rounded-xl flex items-center justify-center shadow-sm shadow-red-200 flex-shrink-0">
                  {b.serviceType === "fuel" ? (
                    <FaGasPump className="text-white text-base" />
                  ) : (
                    <FaWrench className="text-white text-base" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-xs font-bold capitalize">
                    {b.serviceType} Service
                  </p>
                  {b.serviceType === "fuel" && b.fuelDetails && (
                    <p className="text-gray-400 text-[10px] capitalize">
                      {b.fuelDetails.fuelType} · {b.fuelDetails.quantity}L
                    </p>
                  )}
                  <p className="text-gray-300 text-[10px] mt-0.5">
                    {new Date(b.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {b.amount > 0 && (
                    <p className="text-xs font-black text-red-500">
                      ₹{b.amount}
                    </p>
                  )}
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${s.cls}`}
                  >
                    {s.label}
                  </span>
                  <FaChevronRight className="text-gray-300 text-[9px]" />
                </div>
              </Link>
            );
          })
        )}
      </div>
      <BottomNav />
    </div>
  );
}
