const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Configuração do Multer para upload de arquivos
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});
const upload = multer({ storage: storage });

// Configure a API Gemini (use variáveis de ambiente!)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', upload.single('curriculoPdf'), async (req, res) => {
    try {
        // 1. Obter dados do formulário
        const { nome, idade, instituicaoEnsinoMedio, cursoDesejado, instituicaoGraduacao, objetivos } = req.body;

        // 2. Verificar se o arquivo foi enviado
        if (!req.file) {
            return res.status(400).send('Nenhum PDF enviado.');
        }

        // 3. Ler e extrair texto do PDF
        const pdfPath = req.file.path;
        const dataBuffer = fs.readFileSync(pdfPath);
        const pdfData = await pdfParse(dataBuffer);
        const textoDoCurriculo = pdfData.text; // Texto bruto do currículo acadêmico

        // 4. Montar o Prompt para o Gemini
        // Este é o "coração" da sua IA [cite: 11]
        const prompt = `
      Você é um "Orientador de Carreira" acadêmico.
      Analise os dados do aluno e o currículo do curso para gerar um relatório.

      DADOS DO ALUNO:
      - Nome: ${nome}
      - Idade: ${idade}
      - Formação: ${instituicaoEnsinoMedio}
      - Curso Desejado: ${cursoDesejado} na ${instituicaoGraduacao}
      - Objetivos e Interesses Pessoais/Profissionais: ${objetivos}

      CURRÍCULO DO CURSO (Matérias Obrigatórias e Optativas):
      ---
      ${textoDoCurriculo}
      ---

      INSTRUÇÕES PARA O RELATÓRIO:
      Gere um relatório em texto que contenha:
      1. Uma breve análise do perfil do aluno (${nome}) com base em seus objetivos e interesses.
      2. Uma análise da adequação do curso de ${cursoDesejado} aos objetivos dele.
      3. Um "Caminho Acadêmico Recomendado": Sugira quais matérias OPTATIVAS do currículo o aluno deve priorizar para atingir seus objetivos.
      4. Sugestões de atividades extracurriculares ou cursos livres com base em seus interesses.
      O relatório não pode conter caracteres especiais, apenas texto puro.
    `;

        // 5. Chamar a API Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analiseGerada = response.text();

        // 6. Gerar o PDF de resposta [cite: 12, 23]
        const doc = new PDFDocument({ margin: 50 });

        // Configura a resposta para ser um PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Relatorio_${nome.replace(/\s/g, '_')}.pdf`);

        // Pipe o PDF diretamente para a resposta
        doc.pipe(res);

        // Adiciona conteúdo ao PDF (Layout definido)
        doc.fontSize(20).text(`Plano de Desenvolvimento Acadêmico`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(`Preparado para: ${nome}`);
        doc.fontSize(12).text(`Data: ${new Date().toLocaleDateString()}`);
        doc.moveDown(2);

        // Adiciona a análise gerada pela IA
        doc.fontSize(14).text('Análise e Recomendações', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(analiseGerada, {
            align: 'justify',
        });

        // Finaliza o PDF
        doc.end();

        // 7. Limpar o arquivo de upload
        fs.unlinkSync(pdfPath);

    } catch (error) {
        console.error('Erro no processamento:', error);
        res.status(500).send('Erro ao processar a solicitação.');
    }
});

module.exports = router;