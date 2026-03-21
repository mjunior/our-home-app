# CONTEXT.md - Contexto do Projeto Our Home App

## Objetivo do Projeto
O `Our Home App` é uma aplicação web financeira dedicada a auxiliar usuários na gestão do saldo livre mensal e na projeção de risco financeiro para o próximo mês. 

## Tecnologias Utilizadas
- **Node.js 20+**: Ambiente de execução de JavaScript no servidor.
- **npm 10+**: Gerenciador de pacotes utilizado para instalar dependências da aplicação.
- **Prisma**: ORM (Object-Relational Mapping) que simplifica a manipulação de dados e a interação com o banco de dados.
- **SQLite (Desenvolvimento)**: Utilizado para desenvolvimento local por meio de uma URI no `DATABASE_URL`.
- **PostgreSQL (Produção)**: indicado para o ambiente de produção, onde as credenciais devem ser definidas na `DATABASE_URL`.

## Estrutura do Projeto
1. **Setup**: O projeto requer a instalação de pacotes, que pode ser feito com `npm install`.
2. **Banco de Dados**:
   - Para ambientes de desenvolvimento, deve-se usar SQLite, enquanto PostgreSQL é necessário para produção.
   - O schema do banco deve ser validado e aplicado usando scripts npm.
3. **Execução**: O aplicativo pode ser executado localmente com `npm run dev`, que utiliza Vite para servir a aplicação.
4. **Docker**: O projeto inclui suporte a contêineres, com comandos para construção e inicialização em um ambiente Docker para produção.
5. **Testes**: O sistema conta com testes de unidade e de ponta a ponta (E2E), que podem ser invocados por meio de comandos npm.

## Resultado Esperado
O `Our Home App` deve fornecer uma interface intuitiva para gerenciamento financeiro, permitindo ao usuário visualizar seu saldo livre e as projeções de risco, promovendo uma melhor gestão financeira pessoal.