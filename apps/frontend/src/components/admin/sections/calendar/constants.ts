export const START_HOUR = 5;
export const END_HOUR = 22;
export const SLOT_HEIGHT = 28;
export const intervalOptions = [15, 30, 60];

export const statusStyles: Record<string, string> = {
  booked: "bg-sky-100 text-sky-900",
  completed: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-slate-200 text-slate-600"
};

export const statusLabels: Record<string, string> = {
  booked: "Reservada",
  completed: "Completada",
  cancelled: "Cancelada"
};

export const servicePalette = ["#38bdf8", "#f59e0b", "#10b981", "#f472b6", "#818cf8", "#14b8a6"];
