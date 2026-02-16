import type { RowRecord } from "@/utils/dataHelpers";
import { FilterBar } from "@/components/FilterBar";

type StudentFiltersProps = {
  searchText: string;
  onSearchTextChange: (value: string) => void;
  selectedCabang: string;
  onCabangChange: (value: string) => void;
  selectedKelas: string;
  onKelasChange: (value: string) => void;
  selectedNis: string;
  onNisChange: (value: string) => void;
  scheduleCabangOptions: string[];
  scheduleKelasOptions: string[];
  filteredStudents: RowRecord[];
  totalStudents: number;
  activeMenu: string;
  getRowValue: (row: RowRecord, key: string) => string;
};

export function StudentFilters(props: StudentFiltersProps) {
  return <FilterBar {...props} />;
}
