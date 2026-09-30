import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProdutosService } from './services/produtos';
import { Produto } from './models/produto.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styles: []
})
export class App implements OnInit {
  produtos: Produto[] = [];
  novoProduto = { nome: '', preco: 0 };
  produtoEditando: Produto | null = null;
  mensagemErro: string = '';
  mensagemSucesso: string = '';
  idBusca: number | null = null;

  // Controle visual para destruir e recriar a tabela no DOM
  carregandoTabela: boolean = false;

  constructor(
    private produtosService: ProdutosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarProdutos();
  }

  private normalizarProduto(p: any): Produto {
    return {
      id: p?.id ?? p?.Id ?? p?.ID,
      nome: p?.nome ?? p?.Nome ?? '',
      preco: Number(p?.preco ?? p?.Preco ?? 0)
    };
  }

  carregarProdutos(): void {
    this.mensagemErro = '';
    this.idBusca = null;

    // 1. Remove a tabela da tela (Força destruição no HTML)
    this.carregandoTabela = true;
    this.cdr.detectChanges();

    this.produtosService.listarTodos().subscribe({
      next: (resposta: any) => {
        const listaBruta = resposta?.dados ?? (Array.isArray(resposta) ? resposta : []);
        
        // 2. Atualiza os dados com uma nova referência de array
        this.produtos = listaBruta.map((p: any) => this.normalizarProduto(p));

        // 3. Recoloca a tabela no DOM e FORÇA RENDERIZAÇÃO
        this.carregandoTabela = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar produtos:', err);
        this.mensagemErro = 'Não foi possível carregar a lista de produtos.';
        this.carregandoTabela = false;
        this.cdr.detectChanges();
      }
    });
  }

  buscarPorId(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (!this.idBusca || this.idBusca <= 0) {
      this.carregarProdutos();
      return;
    }

    this.carregandoTabela = true;
    this.cdr.detectChanges();

    this.produtosService.buscarPorId(this.idBusca).subscribe({
      next: (resposta: any) => {
        const p = resposta?.dados ?? resposta;
        if (p && (p.id || p.Id || p.ID)) {
          this.produtos = [this.normalizarProduto(p)];
        } else {
          this.produtos = [];
          this.mensagemErro = `Produto com ID ${this.idBusca} não foi encontrado.`;
        }
        this.carregandoTabela = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar produto:', err);
        this.produtos = [];
        this.mensagemErro = `Produto com ID ${this.idBusca} não foi encontrado.`;
        this.carregandoTabela = false;
        this.cdr.detectChanges();
      }
    });
  }

  adicionar(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    const nome = this.novoProduto.nome ? this.novoProduto.nome.trim() : '';
    const preco = Number(this.novoProduto.preco);

    if (!nome) {
      this.mensagemErro = 'O nome do produto é obrigatório.';
      return;
    }

    if (isNaN(preco) || preco < 0.01) {
      this.mensagemErro = 'O preço deve ser maior que R$ 0,00.';
      return;
    }

    const payload = {
      Nome: nome,
      Preco: preco
    };

    this.produtosService.criar(payload).subscribe({
      next: (resposta: any) => {
        this.novoProduto = { nome: '', preco: 0 };
        this.mensagemSucesso = resposta?.mensagem || 'Produto cadastrado com sucesso!';
        
        // Dispara a busca e força a recriação da tabela
        this.carregarProdutos();
      },
      error: (err) => {
        console.error('Erro no POST C#:', err);
        this.mensagemErro = err.error?.mensagem || 'Erro ao adicionar produto no banco de dados.';
        this.cdr.detectChanges();
      }
    });
  }

  iniciarEdicao(produto: Produto): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.produtoEditando = { ...produto };
  }

  cancelarEdicao(): void {
    this.produtoEditando = null;
  }

  salvarEdicao(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (!this.produtoEditando) return;

    const id = this.produtoEditando.id;
    const nome = this.produtoEditando.nome ? this.produtoEditando.nome.trim() : '';
    const preco = Number(this.produtoEditando.preco);

    if (!id) {
      this.mensagemErro = 'Erro: ID do produto não foi encontrado para edição.';
      return;
    }

    if (isNaN(preco) || preco < 0.01) {
      this.mensagemErro = 'O preço deve ser maior que R$ 0,00.';
      return;
    }

    const payload = {
      Id: id,
      Nome: nome,
      Preco: preco
    };

    this.produtosService.atualizar(id, payload).subscribe({
      next: (resposta: any) => {
        this.produtoEditando = null;
        this.mensagemSucesso = resposta?.mensagem || 'Produto atualizado com sucesso!';
        this.carregarProdutos();
      },
      error: (err) => {
        console.error('Erro no PUT C#:', err);
        this.mensagemErro = err.error?.mensagem || 'Erro ao salvar edição.';
        this.cdr.detectChanges();
      }
    });
  }

  remover(id: number | undefined): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (!id) {
      this.mensagemErro = 'Não foi possível identificar o ID do produto para remoção.';
      return;
    }

    if (confirm('Tem certeza que deseja remover este produto?')) {
      this.produtosService.remover(id).subscribe({
        next: (resposta: any) => {
          this.mensagemSucesso = resposta?.mensagem || 'Produto removido com sucesso!';
          this.carregarProdutos();
        },
        error: (err) => {
          console.error('Erro no DELETE C#:', err);
          this.mensagemErro = err.error?.mensagem || 'Erro ao remover produto.';
          this.cdr.detectChanges();
        }
      });
    }
  }
}