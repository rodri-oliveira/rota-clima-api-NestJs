-- CreateEnum
CREATE TYPE "ModoTransporte" AS ENUM ('DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultaRota" (
    "id" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "modo" "ModoTransporte" NOT NULL,
    "distanciaMetros" INTEGER NOT NULL,
    "duracaoSegundos" INTEGER NOT NULL,
    "temperaturaC" DOUBLE PRECISION,
    "climaResumo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "ConsultaRota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorito" (
    "id" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "modo" "ModoTransporte" NOT NULL,
    "apelido" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "Favorito_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "ConsultaRota_usuarioId_criadoEm_idx" ON "ConsultaRota"("usuarioId", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "Favorito_usuarioId_origem_destino_modo_key" ON "Favorito"("usuarioId", "origem", "destino", "modo");

-- AddForeignKey
ALTER TABLE "ConsultaRota" ADD CONSTRAINT "ConsultaRota_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
