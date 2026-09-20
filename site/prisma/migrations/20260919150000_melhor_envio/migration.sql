-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "weightGrams" INTEGER,
ADD COLUMN     "heightCm" INTEGER,
ADD COLUMN     "widthCm" INTEGER,
ADD COLUMN     "lengthCm" INTEGER;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingServiceId" INTEGER,
ADD COLUMN     "shippingDeliveryDays" INTEGER,
ADD COLUMN     "melhorEnvioId" TEXT,
ADD COLUMN     "shippingStatus" TEXT,
ADD COLUMN     "shippingError" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_melhorEnvioId_key" ON "Order"("melhorEnvioId");
