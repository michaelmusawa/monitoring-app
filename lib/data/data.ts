// lib/data/nairobiWards.ts
// All 17 sub-counties and their wards in Nairobi City County
// Coordinates are approximate ward centroids — used as map defaults.

export interface Ward {
  name: string;
  lat: number;
  lng: number;
}

export interface SubCounty {
  name: string;
  lat: number; // sub-county centroid fallback
  lng: number;
  wards: Ward[];
}

export const NAIROBI_SUB_COUNTIES: SubCounty[] = [
  {
    name: "Westlands",
    lat: -1.2637,
    lng: 36.803,
    wards: [
      { name: "Kitisuru", lat: -1.231, lng: 36.772 },
      { name: "Parklands / Highridge", lat: -1.2595, lng: 36.8175 },
      { name: "Karura", lat: -1.234, lng: 36.82 },
      { name: "Kangemi", lat: -1.266, lng: 36.753 },
      { name: "Mountain View", lat: -1.258, lng: 36.762 },
    ],
  },
  {
    name: "Dagoretti North",
    lat: -1.283,
    lng: 36.753,
    wards: [
      { name: "Kilimani", lat: -1.2882, lng: 36.7874 },
      { name: "Kawangware", lat: -1.281, lng: 36.748 },
      { name: "Gatina", lat: -1.276, lng: 36.735 },
      { name: "Kileleshwa", lat: -1.2795, lng: 36.7783 },
      { name: "Kabiro", lat: -1.284, lng: 36.755 },
    ],
  },
  {
    name: "Dagoretti South",
    lat: -1.312,
    lng: 36.743,
    wards: [
      { name: "Mutu-ini", lat: -1.323, lng: 36.728 },
      { name: "Ngando", lat: -1.31, lng: 36.76 },
      { name: "Riruta", lat: -1.305, lng: 36.749 },
      { name: "Uthiru / Ruthimitu", lat: -1.299, lng: 36.72 },
      { name: "Waithaka", lat: -1.326, lng: 36.743 },
    ],
  },
  {
    name: "Langata",
    lat: -1.353,
    lng: 36.76,
    wards: [
      { name: "Karen", lat: -1.337, lng: 36.717 },
      { name: "Nairobi West", lat: -1.316, lng: 36.801 },
      { name: "Mugumu-ini", lat: -1.37, lng: 36.745 },
      { name: "South C", lat: -1.322, lng: 36.818 },
      { name: "Nyayo Highrise", lat: -1.319, lng: 36.811 },
    ],
  },
  {
    name: "Kibra",
    lat: -1.313,
    lng: 36.784,
    wards: [
      { name: "Laini Saba", lat: -1.308, lng: 36.784 },
      { name: "Lindi", lat: -1.315, lng: 36.79 },
      { name: "Makina", lat: -1.314, lng: 36.778 },
      { name: "Woodley / Kenyatta Golf Course", lat: -1.304, lng: 36.798 },
      { name: "Sarang'ombe", lat: -1.32, lng: 36.782 },
    ],
  },
  {
    name: "Roysambu",
    lat: -1.22,
    lng: 36.878,
    wards: [
      { name: "Githurai", lat: -1.19, lng: 36.91 },
      { name: "Kahawa West", lat: -1.201, lng: 36.896 },
      { name: "Zimmerman", lat: -1.216, lng: 36.887 },
      { name: "Roysambu", lat: -1.229, lng: 36.882 },
      { name: "Kahawa", lat: -1.186, lng: 36.925 },
    ],
  },
  {
    name: "Kasarani",
    lat: -1.221,
    lng: 36.901,
    wards: [
      { name: "Clay City", lat: -1.196, lng: 36.931 },
      { name: "Mwiki", lat: -1.185, lng: 36.95 },
      { name: "Kasarani", lat: -1.227, lng: 36.901 },
      { name: "Njiru", lat: -1.224, lng: 36.962 },
      { name: "Ruai", lat: -1.27, lng: 37.012 },
    ],
  },
  {
    name: "Ruaraka",
    lat: -1.249,
    lng: 36.884,
    wards: [
      { name: "Baba Dogo", lat: -1.244, lng: 36.873 },
      { name: "Utalii", lat: -1.235, lng: 36.887 },
      { name: "Mathare North", lat: -1.255, lng: 36.859 },
      { name: "Lucky Summer", lat: -1.246, lng: 36.896 },
      { name: "Korogocho", lat: -1.238, lng: 36.882 },
    ],
  },
  {
    name: "Embakasi South",
    lat: -1.336,
    lng: 36.887,
    wards: [
      { name: "Imara Daima", lat: -1.329, lng: 36.888 },
      { name: "Kwa Njenga", lat: -1.341, lng: 36.894 },
      { name: "Kwa Reuben", lat: -1.338, lng: 36.901 },
      { name: "Pipeline", lat: -1.329, lng: 36.907 },
      { name: "Kware", lat: -1.346, lng: 36.879 },
    ],
  },
  {
    name: "Embakasi North",
    lat: -1.262,
    lng: 36.898,
    wards: [
      { name: "Kariobangi North", lat: -1.255, lng: 36.882 },
      { name: "Dandora Area I", lat: -1.25, lng: 36.905 },
      { name: "Dandora Area II", lat: -1.254, lng: 36.913 },
      { name: "Dandora Area III", lat: -1.259, lng: 36.92 },
      { name: "Dandora Area IV", lat: -1.263, lng: 36.927 },
    ],
  },
  {
    name: "Embakasi Central",
    lat: -1.295,
    lng: 36.908,
    wards: [
      { name: "Kayole North", lat: -1.282, lng: 36.906 },
      { name: "Kayole Central", lat: -1.289, lng: 36.91 },
      { name: "Kayole South", lat: -1.296, lng: 36.912 },
      { name: "Komarock", lat: -1.287, lng: 36.925 },
      { name: "Matopeni / Spring Valley", lat: -1.301, lng: 36.906 },
    ],
  },
  {
    name: "Embakasi East",
    lat: -1.315,
    lng: 36.937,
    wards: [
      { name: "Upper Savanna", lat: -1.304, lng: 36.939 },
      { name: "Lower Savanna", lat: -1.316, lng: 36.945 },
      { name: "Embakasi", lat: -1.321, lng: 36.928 },
      { name: "Utawala", lat: -1.311, lng: 36.97 },
      { name: "Mihango", lat: -1.329, lng: 36.962 },
    ],
  },
  {
    name: "Embakasi West",
    lat: -1.286,
    lng: 36.887,
    wards: [
      { name: "Umoja I", lat: -1.283, lng: 36.893 },
      { name: "Umoja II", lat: -1.287, lng: 36.887 },
      { name: "Mowlem", lat: -1.278, lng: 36.898 },
      { name: "Kariobangi South", lat: -1.276, lng: 36.884 },
    ],
  },
  {
    name: "Makadara",
    lat: -1.298,
    lng: 36.86,
    wards: [
      { name: "Maringo / Hamza", lat: -1.293, lng: 36.867 },
      { name: "Viwandani", lat: -1.304, lng: 36.868 },
      { name: "Harambee", lat: -1.287, lng: 36.851 },
      { name: "Makongeni", lat: -1.296, lng: 36.855 },
    ],
  },
  {
    name: "Kamukunji",
    lat: -1.277,
    lng: 36.846,
    wards: [
      { name: "Pumwani", lat: -1.281, lng: 36.845 },
      { name: "Eastleigh North", lat: -1.272, lng: 36.847 },
      { name: "Eastleigh South", lat: -1.279, lng: 36.853 },
      { name: "Airbase", lat: -1.268, lng: 36.84 },
      { name: "California", lat: -1.276, lng: 36.838 },
    ],
  },
  {
    name: "Starehe",
    lat: -1.284,
    lng: 36.827,
    wards: [
      { name: "Nairobi Central", lat: -1.2864, lng: 36.8172 },
      { name: "Ngara", lat: -1.273, lng: 36.829 },
      { name: "Pangani", lat: -1.275, lng: 36.836 },
      { name: "Ziwani / Kariokor", lat: -1.282, lng: 36.831 },
      { name: "Landimawe", lat: -1.287, lng: 36.824 },
      { name: "Nairobi South", lat: -1.297, lng: 36.824 },
    ],
  },
  {
    name: "Mathare",
    lat: -1.258,
    lng: 36.856,
    wards: [
      { name: "Hospital", lat: -1.264, lng: 36.848 },
      { name: "Mabatini", lat: -1.255, lng: 36.854 },
      { name: "Huruma", lat: -1.251, lng: 36.86 },
      { name: "Ngei", lat: -1.257, lng: 36.862 },
      { name: "Mlango Kubwa", lat: -1.262, lng: 36.856 },
      { name: "Kiamaiko", lat: -1.258, lng: 36.851 },
    ],
  },
];

export function getWards(subCountyName: string): Ward[] {
  return (
    NAIROBI_SUB_COUNTIES.find((sc) => sc.name === subCountyName)?.wards ?? []
  );
}

export function getWardCoords(
  subCountyName: string,
  wardName: string,
): { lat: number; lng: number } | null {
  const sc = NAIROBI_SUB_COUNTIES.find((s) => s.name === subCountyName);
  if (!sc) return null;
  const ward = sc.wards.find((w) => w.name === wardName);
  return ward ? { lat: ward.lat, lng: ward.lng } : { lat: sc.lat, lng: sc.lng };
}

export const ROLES = ["system admin", "admin", "user", "executive"];
export const SECTORS = [
  "Mobility And Works",
  "Health, Wellness And Nutrition",
  "Talent, Skills Development And Care",
  "Green Nairobi",
  "Business And Hustler Opportunities",
  "Built Environment And Urban Planning",
  "Boroughs, Sub County Administration And Personnel",
  "Public Service Management",
  "Innovation And Digital Economy",
  "Finance And Economic Planning",
  "Inclusivity, Public Participation And Customer Service",
  "Office Of The Governor & Deputy Governor",
  "County Secretary & Head Of County Public Service",
  "Security And Compliance",
  "Office Of The County Attorney",
  "Disaster & Emergency Management",
  "Internal Audit And Risk Management",
  "Ward Development Programme",
  "County Public Service Board",
  "County Assembly",
  "Monitoring And Evaluation",
];
