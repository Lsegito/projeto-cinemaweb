import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getGeneros, createGenero, updateGenero, deleteGenero } from '../../services/api';
import { type Genero } from '../../types';

const generoSchema = z.object({
  nome: z.string().trim().min(2, 'O nome deve ter pelo menos 2 caracteres'),
});

type GeneroSchema = z.infer<typeof generoSchema>;

const extrairMensagemErro = (error: unknown, padrao: string): string => {
  const msg = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg || padrao;
};

const GenerosManager = () => {
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<GeneroSchema>({
    resolver: zodResolver(generoSchema),
    defaultValues: { nome: '' },
  });

  const carregarGeneros = async () => {
    try {
      setLoading(true);
      const response = await getGeneros();
      setGeneros([...response.data].sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (error) {
      console.error('Erro ao carregar gêneros', error);
      setErro('Não foi possível carregar os gêneros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarGeneros(); }, []);

  const onSubmit = async (data: GeneroSchema) => {
    setErro('');
    try {
      if (editingId) {
        await updateGenero(editingId, { nome: data.nome });
      } else {
        await createGenero({ nome: data.nome });
      }
      cancelarEdicao();
      carregarGeneros();
    } catch (error) {
      setErro(extrairMensagemErro(error, 'Erro ao salvar gênero. Verifique se o nome já existe.'));
    }
  };

  const iniciarEdicao = (genero: Genero) => {
    setErro('');
    setEditingId(genero.id);
    reset({ nome: genero.nome });
  };

  const cancelarEdicao = () => {
    setEditingId(null);
    reset({ nome: '' });
  };

  const removerGenero = async (genero: Genero) => {
    if (!confirm(`Tem certeza que deseja excluir o gênero "${genero.nome}"?`)) return;
    setErro('');
    try {
      await deleteGenero(genero.id);
      if (editingId === genero.id) cancelarEdicao();
      carregarGeneros();
    } catch (error) {
      setErro(extrairMensagemErro(error, 'Não foi possível excluir. Verifique se há filmes usando este gênero.'));
    }
  };

  return (
    <div>
      <h2 className="mb-4">Gerenciamento de Gêneros</h2>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title">{editingId ? 'Editar Gênero' : 'Novo Gênero'}</h5>
          <form onSubmit={handleSubmit(onSubmit)} className="row g-2 align-items-start">
            <div className="col-md-8">
              <input
                {...register('nome')}
                className={`form-control ${errors.nome ? 'is-invalid' : ''}`}
                placeholder="Ex.: Ação, Comédia, Drama..."
              />
              <div className="invalid-feedback">{errors.nome?.message}</div>
            </div>
            <div className="col-md-4 d-flex gap-2">
              <button type="submit" className="btn btn-success flex-fill" disabled={isSubmitting}>
                <i className={`bi ${editingId ? 'bi-check-lg' : 'bi-plus-circle'} me-2`}></i>
                {editingId ? 'Salvar' : 'Adicionar'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={cancelarEdicao}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {erro && <div className="alert alert-danger">{erro}</div>}

      {loading ? (
        <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>
      ) : generos.length === 0 ? (
        <div className="alert alert-info">Nenhum gênero cadastrado.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover shadow-sm">
            <thead className="table-dark">
              <tr>
                <th>Nome</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {generos.map((genero) => (
                <tr key={genero.id} className={editingId === genero.id ? 'table-warning' : ''}>
                  <td className="align-middle fw-bold">{genero.nome}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-primary me-2" onClick={() => iniciarEdicao(genero)}>
                      <i className="bi bi-pencil"></i> Editar
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => removerGenero(genero)}>
                      <i className="bi bi-trash"></i> Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GenerosManager;
