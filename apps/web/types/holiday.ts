export interface Holiday {
  id: string;
  title: string;
  description: string | null;
  holidayDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface HolidayInput {
  title: string;
  description?: string | null;
  holidayDate: string;
}
