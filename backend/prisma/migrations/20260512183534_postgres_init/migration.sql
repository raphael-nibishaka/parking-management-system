-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PARKING_ATTENDANT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PARKING_ATTENDANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parking" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalSpaces" INTEGER NOT NULL,
    "availableSpaces" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "feePerHour" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParkingSession" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "parkingId" TEXT NOT NULL,
    "entryAt" TIMESTAMP(3) NOT NULL,
    "exitAt" TIMESTAMP(3),
    "chargedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParkingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Parking_code_key" ON "Parking"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ParkingSession_ticketNumber_key" ON "ParkingSession"("ticketNumber");

-- CreateIndex
CREATE INDEX "ParkingSession_parkingId_idx" ON "ParkingSession"("parkingId");

-- CreateIndex
CREATE INDEX "ParkingSession_entryAt_idx" ON "ParkingSession"("entryAt");

-- CreateIndex
CREATE INDEX "ParkingSession_exitAt_idx" ON "ParkingSession"("exitAt");

-- CreateIndex
CREATE INDEX "ParkingSession_plateNumber_idx" ON "ParkingSession"("plateNumber");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- AddForeignKey
ALTER TABLE "ParkingSession" ADD CONSTRAINT "ParkingSession_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "Parking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
