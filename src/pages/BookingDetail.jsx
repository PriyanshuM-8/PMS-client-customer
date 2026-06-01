import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../utils/api";
import { getSocket } from "../utils/socket";
import BottomNav from "../components/BottomNav";
import Swal from "sweetalert2";
import {
  FaGasPump,
  FaWrench,
  FaMapMarkerAlt,
  FaClock,
  FaRupeeSign,
  FaPhoneAlt,
  FaChevronLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaMotorcycle,
  FaTools,
  FaStar,
  FaMoneyBillWave,
} from "react-icons/fa";
import { MdLocalGasStation, MdOutlineTimer, MdBuild } from "react-icons/md";
import { HiLightningBolt } from "react-icons/hi";
import { IoMdSync } from "react-icons/io";

const STEPS = ["pending", "accepted", "assigned", "in_progress", "reached", "completed"];

const stepConfig = {
  pending:     { label: "Pending",      Icon: FaClock,        desc: "Waiting for pump to accept" },
  accepted:    { label: "Accepted",      Icon: FaCheckCircle,  desc: "Pump accepted your booking" },
  assigned:    { label: "Assigned",      Icon: FaWrench,       desc: "Service agent assigned" },
  in_progress: { label: "On the Way",   Icon: FaMotorcycle,   desc: "Agent is on the way to you" },
  reached:     { label: "Arrived",       Icon: FaMapMarkerAlt, desc: "Agent arrived at your location" },
  completed:   { label: "Completed",     Icon: FaCheckCircle,  desc: "Service completed" },
};

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [calling, setCalling] = useState(false);
  const [callInfo, setCallInfo] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fetchBooking = () => {
    api
      .get(`/bookings/my/${id}`)
      .then(({ data }) => setBooking(data.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchBooking();

    const s = getSocket();
    if (!s) return;

    const onUpdate = (data) => {
      if (data.bookingId?.toString() === id) {
        // Full refetch karo taaki latest data mile
        fetchBooking();
      }
    };

    s.on("booking:update", onUpdate);
    s.on(`booking:${id}:status`, onUpdate);

    return () => {
      s.off("booking:update", onUpdate);
      s.off(`booking:${id}:status`, onUpdate);
    };
  }, [id]);

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: "Cancel Booking?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Cancel it!",
      cancelButtonText: "No, Keep it",
    });
    if (!result.isConfirmed) return;
    setCancelling(true);
    try {
      const { data } = await api.patch(`/bookings/my/${id}/cancel`);
      setBooking(data.data);
      Swal.fire({
        title: "Booking Cancelled",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Cancel failed");
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.response?.data?.message || "Cancel failed",
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!rating) return;
    setRatingLoading(true);
    try {
      await api.post(`/bookings/my/${id}/rate`, { rating, feedback });
      setRatingSubmitted(true);
      setBooking((prev) => (prev ? { ...prev, isRated: true } : prev));
    } catch (err) {
      setError(err.response?.data?.message || "Rating failed");
    } finally {
      setRatingLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setPaymentLoading(true);
    try {
      const { data } = await api.patch(`/bookings/my/${id}/confirm-payment`);
      setBooking(data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Payment confirmation failed");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCallMechanic = async () => {
    setCalling(true);
    setError("");
    try {
      const { data } = await api.post(`/bookings/my/${id}/call`);
      setCallInfo(data);
      if (!data.devMode && data.maskedNumber)
        window.location.href = `tel:${data.maskedNumber}`;
    } catch (err) {
      setError(err.response?.data?.message || "Call failed");
    } finally {
      setCalling(false);
    }
  };

  if (!booking)
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const currentStep = STEPS.indexOf(booking.status);
  const isCancelled = booking.status === "cancelled";
  const canCancel = !["completed", "cancelled"].includes(booking.status);
  const showCallBtn =
    ["assigned", "in_progress"].includes(booking.status) && booking.mechanic;

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-28">
      {/* Header */}
      <div className="px-5 pt-12 pb-14 rounded-b-[2.5rem] bg-gradient-to-br from-red-600 via-red-500 to-amber-500 shadow-xl shadow-red-300/40">
        <div className="flex justify-between items-center">
          <Link
            to="/bookings"
            className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white"
          >
            <FaChevronLeft className="text-xs" />
          </Link>
          <h1 className="text-white font-black text-sm tracking-tight">
            Track Booking
          </h1>
          <div className="w-8" />
        </div>
        <div className="mt-4 flex justify-between items-start">
          <div className="text-white">
            <p className="opacity-60 text-[9px] uppercase tracking-widest">
              Service
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {booking.serviceType === "fuel" ? (
                <FaGasPump className="text-white text-xl" />
              ) : (
                <FaWrench className="text-white text-xl" />
              )}
              <h2 className="text-2xl font-black capitalize">
                {booking.serviceType}
              </h2>
            </div>
            {booking.estimatedArrival &&
              !isCancelled &&
              booking.status !== "completed" && (
                <div className="flex items-center gap-1.5 mt-2 bg-white/20 rounded-full px-3 py-1 w-fit">
                  <MdOutlineTimer className="text-white text-sm" />
                  <p className="text-white text-xs font-bold">
                    ETA: {booking.estimatedArrival} min
                  </p>
                </div>
              )}
          </div>
          <span
            className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
              isCancelled
                ? "bg-red-50 text-red-500"
                : booking.status === "completed"
                  ? "bg-green-50 text-green-600"
                  : "bg-white/20 text-white"
            }`}
          >
            {booking.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="px-5 -mt-5 space-y-3">
        {/* Status Timeline */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-4">
              Order Progress
            </p>
            <div className="space-y-0">
              {STEPS.map((step, i) => {
                const isDone = i < currentStep;
                const isActive = i === currentStep;
                const { label, Icon, desc } = stepConfig[step];
                const timelineEntry = booking.statusTimeline?.find(
                  (t) => t.status === step,
                );
                return (
                  <div key={step} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isDone
                            ? "bg-green-500 text-white shadow-sm"
                            : isActive
                              ? "bg-gradient-to-br from-red-600 to-amber-500 text-white shadow-md shadow-red-200/60"
                              : "bg-gray-100 text-gray-300"
                        }`}
                      >
                        {isDone ? (
                          <FaCheckCircle className="text-xs" />
                        ) : (
                          <Icon className="text-xs" />
                        )}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          className={`w-0.5 h-8 mt-1 rounded-full transition-all ${
                            isDone
                              ? "bg-green-400"
                              : isActive
                                ? "bg-gradient-to-b from-amber-400 to-gray-200"
                                : "bg-gray-100"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs font-bold ${isDone ? "text-green-600" : isActive ? "text-gray-900" : "text-gray-300"}`}
                        >
                          {label}
                        </p>
                        {timelineEntry && (
                          <p className="text-gray-300 text-[9px]">
                            {new Date(timelineEntry.time).toLocaleTimeString(
                              "en-IN",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </p>
                        )}
                      </div>
                      <p
                        className={`text-[10px] mt-0.5 ${isActive ? "text-gray-500" : "text-gray-300"}`}
                      >
                        {timelineEntry?.note || desc}
                      </p>
                      {step === "assigned" && isActive && booking.mechanic && (
                        <div className="mt-2 flex items-center gap-2 bg-purple-50 rounded-xl px-3 py-2 border border-purple-100">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-400 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                            <FaTools className="text-[10px]" />
                          </div>
                          <div>
                            <p className="text-purple-700 text-xs font-bold">
                              {booking.mechanic.name}
                            </p>
                            <p className="text-purple-400 text-[10px]">
                              Service agent assigned
                            </p>
                          </div>
                        </div>
                      )}
                      {step === "in_progress" &&
                        isActive &&
                        booking.mechanic && (
                          <div className="mt-2 flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2 border border-orange-100">
                            <FaMotorcycle className="text-orange-500 text-base flex-shrink-0" />
                            <div>
                              <p className="text-orange-700 text-xs font-bold">
                                {booking.mechanic.name} is on the way
                              </p>
                              {booking.estimatedArrival && (
                                <p className="text-orange-400 text-[10px]">
                                  Expected in ~{booking.estimatedArrival} min
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Call Mechanic */}
        {showCallBtn && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-2">
              Contact
            </p>
            <p className="text-gray-400 text-[10px] mb-3">
              Your call will be connected via our company number. Real numbers
              are hidden for privacy.
            </p>
            <button
              onClick={handleCallMechanic}
              disabled={calling}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 text-white font-bold text-xs shadow-md shadow-green-200/60 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {calling ? (
                <>
                  <IoMdSync className="animate-spin text-base" /> Connecting...
                </>
              ) : (
                <>
                  <FaPhoneAlt className="text-xs" /> Call Mechanic
                </>
              )}
            </button>
            {callInfo?.devMode && (
              <div className="mt-2 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2">
                <p className="text-yellow-600 text-[10px] font-semibold">
                  Trial: Direct call not available
                </p>
                <p className="text-yellow-500 text-[10px] mt-0.5">
                  Company number: {callInfo.maskedNumber}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Cancelled */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
            <FaTimesCircle className="text-red-400 text-3xl mx-auto mb-2" />
            <p className="text-red-600 font-bold text-sm">Booking Cancelled</p>
          </div>
        )}

        {/* Booking Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <FaMapMarkerAlt className="text-red-400 text-sm mt-0.5 flex-shrink-0" />
            <p className="text-gray-600 text-xs">{booking.address?.full}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <FaClock className="text-gray-400 text-sm flex-shrink-0" />
            <p className="text-gray-400 text-xs">
              {new Date(booking.createdAt).toLocaleString("en-IN")}
            </p>
          </div>
          {booking.pump && (
            <div className="flex items-center gap-2.5">
              <FaGasPump className="text-orange-400 text-sm flex-shrink-0" />
              <p className="text-gray-600 text-xs font-medium">
                {booking.pump.pumpName}
              </p>
            </div>
          )}
          {booking.amount > 0 && (
            <div className="flex items-center gap-2.5">
              <FaRupeeSign className="text-green-500 text-sm flex-shrink-0" />
              <p className="text-xs">
                <span className="font-black text-red-500">
                  ₹{booking.amount}
                </span>
                <span className="text-gray-400 ml-1.5 capitalize">
                  — {booking.paymentStatus}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Fuel details */}
        {booking.serviceType === "fuel" && booking.fuelDetails && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 shadow-md shadow-red-300/40">
            <div className="flex justify-between items-start">
              <div className="text-white">
                <div className="flex items-center gap-2 mb-1">
                  <MdLocalGasStation className="text-white/80 text-lg" />
                  <p className="opacity-60 text-[9px] uppercase tracking-widest">
                    Fuel Order
                  </p>
                </div>
                <p className="text-lg font-black capitalize">
                  {booking.fuelDetails.fuelType}
                </p>
              </div>
              <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs text-white font-bold">
                {booking.fuelDetails.quantity}L
              </span>
            </div>
            <div className="mt-3 h-1 w-full bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white w-3/4 shadow-[0_0_8px_white] rounded-full" />
            </div>
          </div>
        )}

        {/* Work details */}
        {booking.serviceType === "mechanic" &&
          booking.workDetails?.description && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <MdBuild className="text-amber-500 text-sm" />
                <p className="text-[9px] text-amber-600 uppercase tracking-widest font-semibold">
                  Work Details
                </p>
              </div>
              <p className="text-gray-700 text-xs">
                {booking.workDetails.description}
              </p>
              {booking.workDetails.labourCharge > 0 && (
                <p className="text-amber-600 text-xs font-bold mt-1.5">
                  Labour: ₹{booking.workDetails.labourCharge}
                </p>
              )}
            </div>
          )}

        {/* Mechanic Arrived — Work in progress */}
        {booking.status === "reached" && booking.serviceType === "mechanic" && (
          <div className="bg-white rounded-2xl border border-purple-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                <FaWrench className="text-purple-600 text-base" />
              </div>
              <div>
                <p className="text-gray-900 font-black text-xs">Mechanic Arrived!</p>
                <p className="text-gray-400 text-[10px]">Work is in progress at your location</p>
              </div>
            </div>
          </div>
        )}

        {/* Mechanic completed job — show amount */}
        {booking.status === "completed" && booking.serviceType === "mechanic" && booking.amount > 0 && (
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                <FaCheckCircle className="text-green-600 text-base" />
              </div>
              <div>
                <p className="text-gray-900 font-black text-xs">Work Completed!</p>
                <p className="text-gray-400 text-[10px]">Payment collected by mechanic</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              {booking.workDetails?.description && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Work Done</span>
                  <span className="font-semibold text-gray-700 text-right max-w-[160px]">{booking.workDetails.description}</span>
                </div>
              )}
              {(booking.workDetails?.partsChanged || []).map((p, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-gray-500">{p.partName}</span>
                  <span className="font-semibold text-gray-700">₹{p.price}</span>
                </div>
              ))}
              {booking.workDetails?.labourCharge > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Labour</span>
                  <span className="font-semibold text-gray-700">₹{booking.workDetails.labourCharge}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-900 font-black text-sm">Total Paid</span>
                <span className="text-green-600 font-black text-xl">₹{booking.amount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Boy Arrived — Payment Screen */}
        {booking.status === "reached" && booking.serviceType === "fuel" && (
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                <FaMotorcycle className="text-green-600 text-base" />
              </div>
              <div>
                <p className="text-gray-900 font-black text-xs">Delivery Boy Arrived!</p>
                <p className="text-gray-400 text-[10px]">Please complete payment to receive fuel</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-3">
              <div className="flex justify-between items-center">
                <p className="text-gray-500 text-xs">Total Amount</p>
                <p className="text-red-500 font-black text-xl">₹{booking.amount}</p>
              </div>
              {booking.priceBreakdown && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Fuel Cost</span><span>₹{booking.priceBreakdown.fuelCost}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Delivery Fee</span><span>₹{booking.priceBreakdown.deliveryFee}</span>
                  </div>
                </div>
              )}
            </div>
            <button onClick={handleConfirmPayment} disabled={paymentLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 text-white font-bold text-xs shadow-md shadow-green-200/60 flex items-center justify-center gap-2 disabled:opacity-60">
              {paymentLoading
                ? <><IoMdSync className="animate-spin text-base" /> Processing...</>
                : <><FaMoneyBillWave className="text-sm" /> Pay ₹{booking.amount} & Confirm Delivery</>}
            </button>
          </div>
        )}

        {/* Payment Confirmed — Fuel delivery in progress */}
        {booking.status === "payment_pending" && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 shadow-md shadow-green-200/60 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <HiLightningBolt className="text-white text-sm" />
              <p className="text-white/70 text-[9px] uppercase tracking-widest">Payment Confirmed</p>
            </div>
            <p className="text-white font-black text-base">Fuel delivery in progress...</p>
            <p className="text-white/60 text-[10px] mt-2">Your fuel will be delivered shortly.</p>
          </div>
        )}



        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

        {/* Rating Section — show after completed */}
        {booking.status === "completed" &&
          !booking.isRated &&
          !ratingSubmitted && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-gray-700 font-bold text-sm mb-1">
                Rate your experience
              </p>
              <p className="text-gray-400 text-[10px] mb-3">
                How was the service? Your feedback helps us improve.
              </p>
              <div className="flex items-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform active:scale-90"
                  >
                    <FaStar
                      className={`text-2xl ${star <= rating ? "text-amber-400" : "text-gray-200"}`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-xs text-gray-500 ml-1">
                    {
                      ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][
                        rating
                      ]
                    }
                  </span>
                )}
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Optional feedback..."
                rows={2}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs resize-none focus:outline-none focus:border-red-300 transition mb-3"
              />
              <button
                onClick={handleSubmitRating}
                disabled={!rating || ratingLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold text-xs shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {ratingLoading ? (
                  "Submitting..."
                ) : (
                  <>
                    <FaStar className="text-xs" /> Submit Rating
                  </>
                )}
              </button>
            </div>
          )}

        {booking.status === "completed" &&
          (booking.isRated || ratingSubmitted) && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
              <FaCheckCircle className="text-green-500 text-2xl mx-auto mb-1" />
              <p className="text-green-600 font-bold text-sm">
                Thank you for your feedback!
              </p>
            </div>
          )}

        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full py-3 rounded-xl border border-red-200 text-red-500 font-bold text-xs hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FaTimesCircle className="text-sm" />
            {cancelling ? "Cancelling..." : "Cancel Booking"}
          </button>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
