# Projeto Smart Tutor - Aplicação Back-end (API)

Este é o servidor (back-end) do projeto Smart Tutor. Ele funciona como uma API REST que recebe os dados do front-end, processa um arquivo PDF, utiliza a IA Generativa do Google (Gemini) para criar uma análise vocacional e, por fim, gera um novo PDF formatado como relatório para o usuário.

## 🚀 Tecnologias Utilizadas

* **[Node.js](https://nodejs.org/en)**: Ambiente de execução do JavaScript no lado do servidor.
* **[Express](https://expressjs.com/pt-br/)**: Framework para a criação da API REST.
* **[Multer](https://github.com/expressjs/multer)**: Middleware para lidar com upload de arquivos (`multipart/form-data`).
* **[pdf-parse](https://www.npmjs.com/package/pdf-parse)**: Biblioteca para extrair o texto de dentro dos arquivos PDF.
* **[@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai)**: SDK oficial do Google para interagir com a API do Gemini.
* **[pdfkit](https://pdfkit.org/)**: Biblioteca para criar e formatar o PDF de relatório do zero.
* **[dotenv](https://www.npmjs.com/package/dotenv)**: Para carregar variáveis de ambiente (como a API Key).
* **[CORS](https://www.npmjs.com/package/cors)**: Middleware para permitir requisições do front-end (`http://localhost:3000`).

## ⚙️ Como Executar

1.  **Navegue até a pasta**
    ```bash
    cd backend
    ```

2.  **Instale as dependências**
    ```bash
    npm install
    ```

3.  **Configuração de Ambiente (Obrigatório)**

    Você **precisa** de uma chave de API do Google Gemini.

    * Crie um arquivo chamado `.env` na raiz desta pasta (`backend/.env`).
    * Adicione sua chave de API ao arquivo:

    ```
    GEMINI_API_KEY=SUA_CHAVE_DE_API_COPIADA_AQUI
    ```

4.  **Inicie o servidor**
    ```bash
    npm start
    ```

O servidor estará disponível em `http://localhost:5000`.

## 📋 Endpoint da API

### `POST /api/analyze`

Este é o único endpoint da aplicação. Ele é responsável por todo o fluxo de análise.

* **Tipo de Requisição**: `multipart/form-data`
* **Form Fields**:
    * `nome` (String)
    * `idade` (String)
    * `instituicaoEnsinoMedio` (String)
    * `cursoDesejado` (String)
    * `instituicaoGraduacao` (String)
    * `objetivos` (String)
* **File Field**:
    * `curriculoPdf` (File/Blob) - O PDF da grade curricular.

### Fluxo de Processamento

1.  O endpoint recebe a requisição do front-end.
2.  O `multer` salva o PDF temporariamente na pasta `/uploads`.
3.  O `pdf-parse` lê o PDF salvo e extrai todo o seu conteúdo de texto.
4.  O servidor constrói um *prompt* detalhado contendo os dados do formulário (objetivos, gostos, etc.) e o texto extraído do currículo.
5.  Este *prompt* é enviado para a API do Google Gemini (usando o modelo `gemini-1.5-flash`).
6.  A IA retorna uma análise em texto.
7.  O `pdfkit` cria um novo documento PDF em memória.
8.  O texto da análise do Gemini é formatado e inserido no novo PDF, junto com os dados do aluno.
9.  O servidor envia este novo PDF como resposta ao front-end, que o disponibiliza para download.
10. O arquivo PDF temporário da pasta `/uploads` é excluído.