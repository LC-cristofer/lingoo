# Lingoo — app de inglês infantil por assinatura — Especificação de design (MVP)

Data: 2026-11-09
Autor: Lucas (com Claude)
Status: aguardando revisão

> **Atualização:** as seções 4, 7 e o item "Voz" da seção 8 foram substituídos por `2026-11-09-redesenho-trilha-design.md`.

## 1. Visão e objetivo

Um app web instalável (PWA) em que crianças de 5 a 8 anos aprendem inglês por música, história e brincadeira, seguindo uma trilha em forma de mapa de aventura com um mascote guia. É um infoproduto vendido por assinatura para pais. Não é um produto da Espresso Idiomas.

O modelo recebido da Giulia (simulador de e-mail para adultos) serviu de inspiração para três ideias: missão com história, personagem que reage ao que o aluno faz e feedback imediato. Todo o resto foi redesenhado para crianças.

**O que é sucesso no MVP:**
- Uma criança de 5 a 8 anos consegue completar uma lição sozinha, sem ler instruções.
- A criança pede para voltar ao app nos dias seguintes.
- Os pais conseguem assinar, acompanhar o progresso e cancelar sem ajuda.
- O fluxo de teste grátis e cobrança funciona sem intervenção manual.

As metas numéricas (conversão do teste, retenção) serão definidas depois que houver as primeiras famílias usando.

## 2. Público e compradores

- **Usuário:** criança de 5 a 8 anos, no início da alfabetização, em tablet ou celular.
- **Comprador:** pai ou mãe, que decide a compra, acompanha o progresso e cancela.
- **Premissa:** a criança tem pouco ou nenhum contato prévio com inglês.

## 3. Decisões fechadas

| Tema | Decisão |
|---|---|
| Faixa etária | 5 a 8 anos |
| Didática | Música, história e jogos curtos; sem e-mail, sem escrita livre, quase sem texto na tela |
| Trilha | Mapa de aventura com mascote guia; cada lugar do mapa é um tema |
| Recompensa | Estrelas e álbum de figurinhas, sem punição por faltar |
| Visual | Colorido, vivo e polido, com poucas cores principais |
| Produção de conteúdo | Gerado com IA (música, voz, imagem) e revisado por Lucas e Giulia |
| Assinatura | Teste grátis de 7 dias com cartão, depois cobrança automática |
| Cobrança | Plataforma de infoproduto (Hotmart, Kiwify ou similar); o app libera o acesso por webhook |
| Tecnologia | Next.js + TypeScript + Supabase, publicado na Vercel, como PWA |
| Escopo do MVP | 2 mundos, 12 lições |
| Perfis | 1 criança por assinatura no MVP |

## 4. Experiência da criança

**Mapa.** A tela inicial mostra o mundo com os lugares em sequência. A criança toca no próximo lugar liberado; os seguintes aparecem com cadeado.

**Mascote guia.** Fala em inglês, com gestos e animação, e comemora cada acerto. Quando a criança erra, repete com carinho. Nunca diz "errado".

**Estrutura fixa de cada lição (5 a 8 minutos):**
1. Música curta que apresenta as palavras do tema.
2. Mini-história narrada, com imagens, em que as palavras aparecem em contexto.
3. Dois ou três jogos simples.
4. Figurinha de recompensa, que vai para o álbum.

**Tipos de jogo no MVP:**
- Tocar na figura que o mascote falou.
- Arrastar a palavra para a imagem certa.
- Ouvir e repetir (sem avaliar a pronúncia; o reconhecimento de voz em crianças ainda é pouco confiável e fica para depois).

**Regras de interface para crianças:**
- Quase nenhum texto; tudo se entende por som e imagem.
- Botões grandes, adequados para dedos pequenos.
- Sem anúncios e sem links para fora do app.
- Qualquer acesso à área dos pais, configurações ou assinatura exige uma pergunta que só adulto resolve.
- Sem punição: faltar um dia não perde nada, e o progresso fica salvo.
- O áudio só começa depois do primeiro toque da criança (restrição dos navegadores).

## 5. Pais, acesso e assinatura

**Fluxo de compra e acesso:**
1. O responsável assina o teste de 7 dias na página de venda da plataforma de infoproduto.
2. A plataforma envia um aviso (webhook) ao app, que cria a conta do responsável com o e-mail da compra.
3. O responsável recebe um e-mail com link de acesso, sem precisar criar senha.
4. Ele cria o perfil da criança: apenas apelido e idade, sem sobrenome e sem foto.

**Acesso da criança.** Quem fica logado no aparelho é o responsável, numa sessão longa; a criança só escolhe o próprio perfil e não tem conta. Sair do perfil ou abrir a área dos pais exige a pergunta de adulto, que é uma trava de interface (o isolamento de dados é garantido pelas regras do banco sobre a sessão do responsável).

**Pergunta de adulto.** Multiplicação escrita por extenso (ex.: "sete vezes oito"), que uma criança de 8 anos não resolve sozinha.

**Estados da assinatura** (o app só reflete o que a plataforma informa):

| Estado | Efeito |
|---|---|
| Teste | Tudo liberado por 7 dias |
| Ativa | Tudo liberado |
| Atrasada | Acesso mantido por 5 dias, com aviso aos pais |
| Cancelada | Progresso e álbum ficam guardados; lições novas ficam bloqueadas; se a família voltar, nada se perde |

**Área dos pais (MVP):**
- Lições feitas, palavras aprendidas, figurinhas ganhas e dias de uso na semana.
- Estado da assinatura e botão de cancelar bem visível, que leva à plataforma. Isso reduz estornos e reclamações.
- Ajustes simples de volume.
- Aviso por e-mail antes da primeira cobrança, para reduzir cancelamentos por esquecimento.

**Fora do MVP:** limite de tempo diário, plano família com mais de um filho.

## 6. Arquitetura técnica

Um único projeto Next.js + TypeScript, com Supabase (login, banco, armazenamento de arquivos) e publicação na Vercel. O app é instalável como PWA.

**Cinco blocos, cada um com uma responsabilidade:**

1. **Área da criança.** Mapa, lição e jogos, em tela cheia.
2. **Área dos pais.** Painel de progresso, assinatura e cadastro do perfil, atrás da pergunta de adulto.
3. **Webhook de pagamento.** Rota que recebe o aviso da plataforma, confere a autenticidade do aviso conforme o método da plataforma (token ou assinatura), ignora avisos repetidos (guarda o ID de cada evento) e ignora avisos mais antigos que o último aplicado, e então atualiza o estado da assinatura.
5. **E-mail.** Provedor de e-mail transacional (Resend ou similar) para o link de acesso e o aviso antes da primeira cobrança; o SMTP padrão do Supabase não serve para produção.
4. **Conteúdo.** As lições ficam como dados, não dentro do código.

**Conteúdo como dado.** Cada lição é uma lista ordenada de etapas (música, história, jogo, jogo, figurinha), e cada etapa aponta para arquivos de áudio e imagem. Novas lições e mundos entram cadastrando dados e subindo arquivos, sem reprogramar o app.

**Jogos como componentes reutilizáveis.** Um componente por tipo de jogo, que recebe os dados da etapa e devolve `acerto`, `erro` ou `concluido` (este último para jogos sem avaliação, como ouvir e repetir). A lição só orquestra a sequência.

**Dados principais:**
- Responsável (e-mail, vínculo com a assinatura).
- Assinatura (estado, datas de início do teste, renovação e cancelamento).
- Perfil da criança (apelido, idade, ligado ao responsável).
- Lição concluída (perfil, lição, data).
- Figurinha ganha (perfil, figurinha, data).
- Catálogo de conteúdo (mundos, lições, etapas, arquivos).

**Segurança dos dados.** Regras de acesso no banco por usuário, para que uma família nunca veja dados de outra. O webhook valida a assinatura do aviso antes de alterar qualquer estado.

**Mídia.** Áudio e imagens ficam no armazenamento do Supabase, com cache no aparelho para a lição abrir rápido. O cache guarda só o mundo atual (o iOS limita o armazenamento de PWAs).

**Sem internet.** No MVP, a lição exige conexão para começar; o progresso de uma lição concluída offline fica guardado no aparelho e é enviado quando a conexão voltar.

**Testes prioritários:**
- Lógica dos jogos (acerto, erro, fim da lição).
- Fluxo de assinatura (teste, ativa, atrasada, cancelada) e liberação de acesso.
- Regras de acesso do banco (isolamento entre famílias).

## 7. Conteúdo do MVP (2 mundos, 12 lições)

**Mundo 1 — Floresta (natureza)**
1. Hello e My name is
2. Animais da floresta
3. Animais de estimação e da fazenda
4. Cores
5. Mais cores
6. Números de 1 a 10

**Mundo 2 — Vilarejo (dia a dia)**
7. Família
8. Casa e cômodos
9. Objetos da casa
10. Frutas
11. Comidas
12. I like e I want

O vocabulário exato de cada lição será definido no roteiro de cada uma, com a revisão da Giulia.

## 8. Identidade visual

- **Nome e ícone:** o produto se chama **Lingoo**, e o ícone do app é uma lagartinha verde. O desenho deve ser original, sem lembrar a lagarta de "A Lagarta Muito Faminta" (verde com cabeça vermelha) nem outras lagartas famosas. O verde do ícone usa o verde-folha da paleta.
- **Mascote:** um gatinho laranja, simpático e expressivo. O desenho deve ser original, sem lembrar personagens conhecidos (por exemplo, o Garfield ou o Gato de Botas). A aparência final será validada com testes de geração de imagem. A paleta precisa de um laranja próprio para o pelo, além das cores base.
- **Paleta base** (a ajustar depois dos testes): amarelo-sol `#FFC93C`, azul-céu `#4AA8F0`, verde-folha `#5CC46B`, coral `#FF7A6B`, creme `#FFF8EC`, azul-marinho `#2B2D42` para textos.
- **Tipografia:** Baloo 2 nos títulos e Nunito nos textos (ambas gratuitas no Google Fonts).
- **Estilo:** cantos arredondados, traço suave, poucas cores principais, visual colorido e polido.
- **Área dos pais:** mesma paleta, com mais branco e menos ilustração, para transmitir calma e confiança.
- **Voz:** narração clara, calorosa e devagar, em inglês neutro.
- **Música:** originais, curtas (30 a 60 segundos), com refrão repetitivo e melodia simples. Não usar músicas existentes.

Um guia de estilo do mascote e dos personagens deve ser escrito antes de gerar os primeiros materiais, para manter consistência entre as lições.

## 9. Produção de conteúdo

Etapas de cada lição:
1. Roteiro (palavras, história e jogos).
2. Letra e música geradas com IA.
3. Voz e ilustrações geradas com IA.
4. Montagem no app.
5. Revisão do inglês e da didática pela Giulia.
6. Teste com uma criança antes de publicar.

**Etapa zero recomendada:** produzir uma única lição-protótipo e testá-la com algumas crianças antes de produzir as 12. Serve para validar mascote, músicas e jogos a baixo custo.

## 10. Privacidade e conformidade

- Dados mínimos da criança: apelido, idade e progresso.
- Sem rastreadores de publicidade e sem anúncios.
- Consentimento dado pelo responsável.
- Por envolver dados de crianças, vale revisar os termos de uso, a política de privacidade e o tratamento de dados com um profissional da área jurídica antes do lançamento (a LGPD tem regras específicas para dados de crianças).
- Verificar também as condições de uso comercial das ferramentas de IA usadas para música, voz e imagem.

## 11. Fora do escopo do MVP

- Plano família com vários filhos.
- Limite de tempo diário.
- Reconhecimento e avaliação de pronúncia.
- Avatar e casinha para personalizar.
- Segunda trilha para 3 a 5 anos.
- Pagamento integrado ao app (Stripe, Asaas, Mercado Pago).
- Aplicativos nativos nas lojas.

## 12. Decisões em aberto

- Nome do mascote (gatinho laranja) e aparência final. Candidatos em avaliação: Mango, Pip, Kiki, Sunny, Tango.
- Papel da lagartinha verde dentro do app (apenas ícone da marca, ou também personagem).
- Disponibilidade do nome Lingoo: pesquisar marca no INPI e domínio livre, já que existem apps de idiomas com nomes parecidos.
- Plataforma de infoproduto escolhida, confirmando que ela oferece teste de 7 dias com cartão e envio de webhook.
- Preço e planos (mensal e anual).
- Ferramentas de IA para música, voz e imagem.

## 13. Riscos

- **Consistência visual e de voz** entre lições geradas por IA. Mitigação: guia de estilo e a lição-protótipo.
- **Cancelamentos por esquecimento** no teste com cartão. Mitigação: aviso antes da cobrança e cancelamento fácil.
- **Conteúdo curto demais.** Com 12 lições, o conteúdo cobre o teste e poucos dias depois. Mitigação: produzir o mundo 3 enquanto as primeiras famílias usam.
- **Qualidade do inglês e da didática** em conteúdo gerado. Mitigação: revisão obrigatória da Giulia antes de publicar.
- **Dependência de uma plataforma externa** para a cobrança. Mitigação: guardar o estado da assinatura no próprio banco e manter a opção de migrar para um gateway integrado depois.
