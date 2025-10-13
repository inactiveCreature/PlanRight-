export type ZoneCode = "R1" | "R2" | "R3"

export interface ZoneOption {
  value: ZoneCode
  label: string
  help?: string
}

export const ZONES: ZoneOption[] = [
  { 
    value: "R1", 
    label: "R1 — General Residential",
    help: "Standard residential zone with standard setback requirements"
  },
  { 
    value: "R2", 
    label: "R2 — Low Density Residential",
    help: "Lower density residential with potentially different setback requirements"
  },
  { 
    value: "R3", 
    label: "R3 — Medium Density Residential",
    help: "Medium density residential with potentially different setback requirements"
  }
]

