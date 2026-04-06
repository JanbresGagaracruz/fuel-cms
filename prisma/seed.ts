import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.lst_User.upsert({
    where: { UserID: 1 },
    update: {},
    create: {
      UsrNam: 'admin',
      DisplayName: 'System Administrator',
      Firstname: 'System',
      Lastname: 'Administrator',
      Email: 'admin@fuelcms.local',
      PositionName: 'System Administrator',
      enable: true,
      access_level: 4,
      password: hashedPassword,
      Psswrd: hashedPassword,
    },
  })

  console.log('✅ Admin user created:', admin.UsrNam)

  // // Create sample contracts
  // const contract1 = await prisma.lst_FuelContracts.create({
  //   data: {
  //     ContractNo: 'FC-2025-001',
  //     SupplierID: 1,
  //     Representative: 'Juan dela Cruz',
  //     EffectivityFrom: new Date('2025-01-01'),
  //     EffectivityTo: new Date('2025-12-31'),
  //     DocumentName: 'Fuel_Supply_Agreement_2025.pdf',
  //     ExpiredDate: new Date('2025-12-31'),
  //     isActive: true,
  //   },
  // })

  // const contract2 = await prisma.lst_FuelContracts.create({
  //   data: {
  //     ContractNo: 'FC-2025-002',
  //     SupplierID: 2,
  //     Representative: 'Maria Santos',
  //     EffectivityFrom: new Date('2025-03-01'),
  //     EffectivityTo: new Date('2026-02-28'),
  //     DocumentName: 'Diesel_Contract_2025.pdf',
  //     ExpiredDate: new Date('2026-02-28'),
  //     isActive: true,
  //   },
  // })

  // console.log('✅ Sample contracts created')

  // // Create packages
  // const pkg1 = await prisma.lst_FuelContractPackages.create({
  //   data: {
  //     PackageName: 'Package A – Diesel Supply (NCR)',
  //     FuelContractID: contract1.FuelContractID,
  //   },
  // })

  // const pkg2 = await prisma.lst_FuelContractPackages.create({
  //   data: {
  //     PackageName: 'Package B – Gasoline Supply (NCR)',
  //     FuelContractID: contract1.FuelContractID,
  //   },
  // })

  // const pkg3 = await prisma.lst_FuelContractPackages.create({
  //   data: {
  //     PackageName: 'Package A – Diesel (Luzon)',
  //     FuelContractID: contract2.FuelContractID,
  //   },
  // })

  // console.log('✅ Sample packages created')

  // // Create details
  // const details = [
  //   {
  //     FuelContractID: contract1.FuelContractID,
  //     FuelContractPackageId: pkg1.FuelContractPackageId,
  //     FunctionalGroup: 'Operations',
  //     LocationGroup: 'NCR',
  //     PlantName: 'Manila Plant',
  //     PlantID: 1,
  //     FuelTypeID: 1,
  //     DeliveryDate: new Date('2025-02-15'),
  //     VolumeOrdered: 50000,
  //     VolumeValidated: 49800,
  //     ContractPrice: 62.50,
  //     InvoiceNo: 'INV-2025-0001',
  //     ContractType: 'ORIGINAL',
  //   },
  //   {
  //     FuelContractID: contract1.FuelContractID,
  //     FuelContractPackageId: pkg1.FuelContractPackageId,
  //     FunctionalGroup: 'Operations',
  //     LocationGroup: 'NCR',
  //     PlantName: 'Manila Plant',
  //     PlantID: 1,
  //     FuelTypeID: 1,
  //     DeliveryDate: new Date('2025-03-15'),
  //     VolumeOrdered: 50000,
  //     VolumeValidated: 50000,
  //     ContractPrice: 62.50,
  //     InvoiceNo: 'INV-2025-0002',
  //     ContractType: 'ORIGINAL',
  //   },
  //   {
  //     FuelContractID: contract1.FuelContractID,
  //     FuelContractPackageId: pkg2.FuelContractPackageId,
  //     FunctionalGroup: 'Maintenance',
  //     LocationGroup: 'NCR',
  //     PlantName: 'Quezon Plant',
  //     PlantID: 2,
  //     FuelTypeID: 2,
  //     DeliveryDate: new Date('2025-02-20'),
  //     VolumeOrdered: 20000,
  //     VolumeValidated: 19500,
  //     ContractPrice: 65.00,
  //     InvoiceNo: 'INV-2025-0003',
  //     ContractType: 'ORIGINAL',
  //   },
  //   {
  //     FuelContractID: contract2.FuelContractID,
  //     FuelContractPackageId: pkg3.FuelContractPackageId,
  //     FunctionalGroup: 'Operations',
  //     LocationGroup: 'Luzon',
  //     PlantName: 'Bulacan Plant',
  //     PlantID: 3,
  //     FuelTypeID: 1,
  //     DeliveryDate: new Date('2025-04-01'),
  //     VolumeOrdered: 75000,
  //     VolumeValidated: null,
  //     ContractPrice: 61.80,
  //     InvoiceNo: null,
  //     ContractType: 'ORIGINAL',
  //   },
  // ]

  // for (const d of details) {
  //   await prisma.lst_FuelContractDetail.create({ data: d as any })
  // }

  // console.log('✅ Sample details created')

  // // Create activity trails
  // const activities = [
  //   { userId: 1, action: 'LOGIN', module: 'Authentication', details: 'Admin logged in' },
  //   { userId: 1, action: 'CREATE', module: 'Fuel Contracts', entityId: contract1.FuelContractID, entityName: contract1.ContractNo, details: `Created contract ${contract1.ContractNo}` },
  //   { userId: 1, action: 'CREATE', module: 'Fuel Contracts', entityId: contract2.FuelContractID, entityName: contract2.ContractNo, details: `Created contract ${contract2.ContractNo}` },
  //   { userId: 1, action: 'CREATE', module: 'Contract Packages', entityId: pkg1.FuelContractPackageId, entityName: pkg1.PackageName },
  //   { userId: 1, action: 'CREATE', module: 'Contract Packages', entityId: pkg2.FuelContractPackageId, entityName: pkg2.PackageName },
  // ]

  // for (const a of activities) {
  //   await prisma.activityTrail.create({ data: a })
  // }

  // console.log('✅ Activity trails seeded')
  // console.log('\n🎉 Seed complete!')
  console.log('   Login: admin / admin123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
