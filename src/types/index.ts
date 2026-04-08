import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    accessLevel: number
    position: string
    plantId: number | null
    username: string
  }
  interface Session {
    user: User & {
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    accessLevel: number
    position: string
    plantId: number | null
    username: string
  }
}

// App types
export type ContractType = 'ORIGINAL' | 'AMENDMENT' | 'RENEWAL' | 'ADDENDUM' 

export interface FuelContract {
  FuelContractID: number
  ContractNo: string
  SupplierID: number | null
  Representative: string | null
  EffectivityFrom: Date | null
  EffectivityTo: Date | null
  DocumentName: string | null
  ExpiredDate: Date | null
  isActive: boolean | null
  date_entry: Date | null
  packages?: FuelContractPackage[]
  details?: FuelContractDetail[]
  _count?: { packages: number; details: number }
}

export interface FuelContractPackage {
  FuelContractPackageId: number
  PackageName: string
  FuelContractID: number
  CreatedAt: Date | null
  details?: FuelContractDetail[]
  _count?: { details: number }
}

export interface FuelContractDetail {
  FuelContractDetailID: number
  FuelContractID: number
  FunctionalGroup: string | null
  LocationGroup: string | null
  PlantID: number | null
  PlantName: string | null
  FuelTypeID: number | null
  DeliveryDate: Date | null
  VolumeOrdered: number | null
  VolumeValidated: number | null
  ContractPrice: number | null
  InvoiceNo: string | null
  FuelContractPackageId: number | null
  ContractType: ContractType | null
  date_entry: Date | null
}

export interface ActivityTrail {
  id: number
  userId: number
  action: string
  module: string
  entityId: number | null
  entityName: string | null
  details: string | null
  ipAddress: string | null
  createdAt: Date
}

export interface DashboardStats {
  totalContracts: number
  activeContracts: number
  expiringSoon: number
  totalVolume: number
  totalPackages: number
  recentActivity: ActivityTrail[]
}
