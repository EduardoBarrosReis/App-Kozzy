import mongoose from "mongoose";

const areaEnum = [
  "Suporte Técnico",
  "Problemas de Entrega",
  "Questões de Pagamento",
  "Cadastro/Dados",
  "Comercial/Vendas",
  "Financeiro",
  "Outros Assuntos"
];

const areaSchema = new mongoose.Schema({
  usuarioId: {
    type: String,
    required: true,
  },
  areas: {
    type: [String],
    enum: areaEnum,
    required: true,
  },
});

export default mongoose.model("Area", areaSchema);
