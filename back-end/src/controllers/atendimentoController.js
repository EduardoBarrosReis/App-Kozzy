import Atendimento from "../models/Atendimento.js";
import Area from "../models/Area.js";

// Criar atendimento
export const criarAtendimento = async (req, res) => {
  try {
    const novoAtendimento = new Atendimento({
      ...req.body,
      criadoPor: req.usuario.id,
    });
    await novoAtendimento.save();
    res.status(201).json(novoAtendimento);
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar atendimento", error });
  }
};

// Listar atendimentos do usuário logado conforme áreas de acesso
export const listarAtendimentos = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    // Buscar as áreas desse usuário
    const areasUsuario = await Area.findOne({ usuarioId });

    // Se o usuário não tiver áreas cadastradas
    if (!areasUsuario) {
      return res
        .status(403)
        .json({ message: "Usuário não possui áreas de acesso definidas" });
    }

    // Buscar atendimentos apenas das áreas que o usuário pode ver
    const atendimentos = await Atendimento.find({
     categoriaAssunto: { $in: areasUsuario.areas },
    });

    res.json(atendimentos);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar atendimentos", error });
  }
};

// Buscar atendimento específico
export const buscarAtendimento = async (req, res) => {
  try {
    const atendimento = await Atendimento.findById(req.params.id);
    if (!atendimento)
      return res.status(404).json({ message: "Atendimento não encontrado" });
    res.json(atendimento);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar atendimento", error });
  }
};

// Atualizar atendimento
export const atualizarAtendimento = async (req, res) => {
  try {
    const atendimentoAtualizado = await Atendimento.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!atendimentoAtualizado)
      return res.status(404).json({ message: "Atendimento não encontrado" });
    res.json(atendimentoAtualizado);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar atendimento", error });
  }
};

// Deletar atendimento
export const deletarAtendimento = async (req, res) => {
  try {
    const atendimento = await Atendimento.findByIdAndDelete(req.params.id);
    if (!atendimento)
      return res.status(404).json({ message: "Atendimento não encontrado" });
    res.json({ message: "Atendimento deletado com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar atendimento", error });
  }
};
