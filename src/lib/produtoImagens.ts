import type { Produto } from '../types';

export function imagensDoProduto(produto: Pick<Produto, 'imagem' | 'imagens'>): string[] {
  if (produto.imagens?.length) return produto.imagens.filter(Boolean);
  if (produto.imagem) return [produto.imagem];
  return [];
}

export function imagemPrincipal(produto: Pick<Produto, 'imagem' | 'imagens'>): string | undefined {
  return imagensDoProduto(produto)[0];
}
