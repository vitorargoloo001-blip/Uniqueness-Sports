-- Estorno parcial não muda Payment.status (só o total vira REFUNDED), então
-- sem essa coluna o valor devolvido ao cliente não aparecia em lugar nenhum.
ALTER TABLE "Payment" ADD COLUMN "refundedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Pagamentos já estornados por completo antes dessa coluna existir.
UPDATE "Payment" SET "refundedAmount" = "amount" WHERE "status" = 'REFUNDED';
