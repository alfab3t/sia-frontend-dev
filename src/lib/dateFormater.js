const BULAN_INDONESIA = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const BULAN_INDONESIA_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agt",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const HARI_INDONESIA = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const parseValidDate = (dateString) => {
  if (dateString === null || dateString === undefined || dateString === "") {
    return null;
  }

  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
};

/**
 * Format: 23 Nov 2025
 */
export const formatDate = (dateString) => {
  const date = parseValidDate(dateString);
  if (!date) return "-";

  const day = date.getDate();
  const month = BULAN_INDONESIA_SHORT[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

/**
 * Format: 23 November 2025
 */
export const formatDateLong = (dateString) => {
  const date = parseValidDate(dateString);
  if (!date) return "-";

  const day = date.getDate();
  const month = BULAN_INDONESIA[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

/**
 * Format: Senin, 23 Nov 2025
 */
export const formatDateWithDay = (dateString) => {
  const date = parseValidDate(dateString);
  if (!date) return "-";

  const dayName = HARI_INDONESIA[date.getDay()];
  const day = date.getDate();
  const month = BULAN_INDONESIA_SHORT[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${month} ${year}`;
};

/**
 * Format: 23/11/2025
 */
export const formatDateSlash = (dateString) => {
  const date = parseValidDate(dateString);
  if (!date) return "-";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Format: 23-11-2025
 */
export const formatDateDash = (dateString) => {
  const date = parseValidDate(dateString);
  if (!date) return "-";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

/**
 * Format: 23 Nov 2025, 14:30
 */
export const formatDateTime = (dateString) => {
  const date = parseValidDate(dateString);
  if (!date) return "-";

  const day = date.getDate();
  const month = BULAN_INDONESIA_SHORT[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

/**
 * Format: 14:30:45
 */
export const formatTime = (dateString, withSeconds = false) => {
  const date = parseValidDate(dateString);
  if (!date) return "-";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  if (withSeconds) {
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  return `${hours}:${minutes}`;
};

/**
 * Format: "2 jam yang lalu", "3 hari yang lalu"
 */
export const formatRelativeTime = (dateString) => {
  const date = parseValidDate(dateString);
  if (!date) return "-";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30.44);
  const diffYear = Math.floor(diffDay / 365.25);

  if (diffSec < 60) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  if (diffDay < 30) return `${diffDay} hari yang lalu`;
  if (diffMonth < 12) return `${diffMonth} bulan yang lalu`;
  return `${diffYear} tahun yang lalu`;
};

/**
 * Format: YYYY-MM-DD
 */
export const formatDateForInput = (dateString) => {
  const date = parseValidDate(dateString);
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Cek apakah tanggal valid
 */
export const isValidDate = (dateString) => {
  return parseValidDate(dateString) !== null;
};

const DateFormatter = {
  formatDate,
  formatDateLong,
  formatDateWithDay,
  formatDateSlash,
  formatDateDash,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatDateForInput,
  isValidDate,
};

export default DateFormatter;
