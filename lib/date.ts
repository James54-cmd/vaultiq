import { format } from "date-fns";

export function formatDatePickerLabel(value?: string | null) {
  if (!value) {
    return "Pick a date";
  }

  return format(new Date(`${value}T00:00:00`), "MMM d, yyyy");
}

export function parseDateValue(value?: string | null) {
  if (!value) {
    return undefined;
  }

  return new Date(`${value}T00:00:00`);
}

export function toDateInputValue(value?: Date) {
  if (!value) {
    return "";
  }

  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
