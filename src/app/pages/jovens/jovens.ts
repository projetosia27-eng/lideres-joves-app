import { Component, inject, signal, computed, ChangeDetectorRef, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DataService, StatusScore } from '../../data.service';
import { ImgbbService } from '../../imgbb.service';
import { SnackbarService } from '../../shared/snackbar.service';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-jovens',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './jovens.component.html',
  styleUrls: ['./jovens.component.css']
})
export class JovensComponent implements OnInit {
  data = inject(DataService);
  cdr = inject(ChangeDetectorRef);
  route = inject(ActivatedRoute);
  imgbb = inject(ImgbbService);
  snackbar = inject(SnackbarService);
  showModal = signal(false);
  showMessageModal = signal(false);
  jovemToDelete = signal<string | null>(null);
  
  filterType = signal<'todos' | 'novos' | 'aniversariantes'>('todos');
  showAllBirthdays = signal(false);
  messageTemplate = signal('Olá {nome}! Teremos um evento especial neste sábado. Contamos com você!');
  dataNascimentoInput = '';

  activeGeneratorCategory = signal<'leitura' | 'estudo' | 'novo' | null>(null);
  apiLoading = signal(false);
  apiError = signal('');

  // Banco de versículos inspiradores extras com textos em português embutidos (para fallback 100% offline e imediato se a API demorar ou cair)
  localVersesFallback = [
    { ref: 'João 3:16', text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.' },
    { ref: 'Filipenses 4:13', text: 'Posso todas as coisas naquele que me fortalece.' },
    { ref: 'Salmo 23:1', text: 'O Senhor é o meu pastor; de nada terei falta.' },
    { ref: 'Romanos 8:28', text: 'Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito.' },
    { ref: 'Isaías 41:10', text: 'Não tema, pois estou com você; não tenha medo, pois sou o seu Deus. Eu o fortalecerei e o ajudarei; eu o segurarei com a minha mão direita vitoriosa.' },
    { ref: 'Jeremias 29:11', text: 'Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de prosperar e não de causar dano, planos de dar a vocês esperança e um futuro.' },
    { ref: 'Proverbios 3:5-6', text: 'Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento; reconheça o Senhor em todos os seus caminhos, e ele endireitará as suas veredas.' },
    { ref: 'Mateus 6:33', text: 'Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas serão acrescentadas a vocês.' },
    { ref: 'Gálatas 5:22-23', text: 'Mas o fruto do Espírito é amor, alegria, paz, paciência, amabilidade, bondade, fidelidade, mansidão e domínio próprio. Contra essas coisas não há lei.' },
    { ref: '1 Coríntios 13:4-5', text: 'O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha. Não maltrata, não procura seus interesses, não se ira facilmente, não guarda rancor.' },
    { ref: 'Salmo 46:1', text: 'Deus é o nosso refúgio e a nossa fortaleza, auxílio sempre presente na adversidade.' },
    { ref: '2 Timóteo 1:7', text: 'Pois Deus não nos deu espírito de covardia, mas de poder, de amor e de equilíbrio.' }
  ];

  presetsLeitura = [
    {
      titulo: '📖 Guardião do Coração (Salmo 119:9)',
      texto: `Olá {nome}! Paz do Senhor! 📖 Segue nossa leitura diária recomendada para hoje:

📍 Texto Bíblico: Salmo 119:9-11
"Como o jovem manterá puro o seu caminho? Vivendo de acordo com a tua palavra."

💡 Devocional: No meio de tantas vozes do mundo, a Bíblia é o nosso mapa de navegação e o nosso escudo contra as armadilhas. Que hoje você reserve 5 minutos para ler e meditar!

❓ Reflexão: Qual área das suas decisões hoje precisa de mais direcionamento bíblico?

Tenha um dia ricamente abençoado! 🙌✨`
    },
    {
      titulo: '📖 Coragem e Ânimo (Josué 1:9)',
      texto: `Olá {nome}, tudo bem? 📖 Aqui está a nossa Leitura Diária para fortalecer a sua fé hoje:

📍 Texto Bíblico: Josué 1:9
"Não fui eu que ordenei a você? Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você..."

💡 Devocional: Deus não prometeu que o caminho seria fácil, mas garantiu que estaria presente em cada etapa. O desânimo é vencido quando lembramos quem caminha conosco!

❓ Reflexão: O seu coração está ansioso com o amanhã? Descanse nos passos do Senhor!

Tenha um ótimo e fortalecido dia! 🙏🔥`
    },
    {
      titulo: '📖 Mente Protegida (Romanos 12:2)',
      texto: `Graça e Paz, {nome}! 📖 Nossa reflexão diária está focada na nossa mente:

📍 Texto Bíblico: Romanos 12:2
"Não se moldem ao padrão deste mundo, mas transformem-se pela renovação da sua mente..."

💡 Devocional: O mundo tenta nos dizer o que pensar, vestir e desejar. A renovação mental em Deus nos dá liberdade para sermos autênticos e alinhados com a perfeita vontade de Deus.

❓ Reflexão: O que tem ocupado seus pensamentos ultimamente? Filtre tudo pelo amor de Cristo!

Deus abençoe poderosamente sua mente e suas conversas hoje! 🛡️🤍`
    },
    {
      titulo: '📖 Diferencial Jovem (1 Timóteo 4:12)',
      texto: `Olá {nome}! 📖 Uma mensagem inspiradora para encorajar sua juventude hoje:

📍 Texto Bíblico: 1 Timóteo 4:12
"Ninguém despreze a sua mocidade; pelo contrário, torne-se exemplo dos fiéis na palavra, no procedimento, no amor, no espírito, na fé, na pureza."

💡 Devocional: Ser jovem cristão não é sobre limitação, é sobre representação! Sua vida cotidiana tem um impacto gigante naqueles que te rodeiam. Seja a luz!

❓ Reflexão: Como você pode ser um testemunho vivo de amor e fé nas suas redes sociais ou ambiente de estudo hoje?

Brilhe forte hoje! 💡⚡`
    },
    {
      titulo: '📖 Renovando as Forças (Isaías 40:31)',
      texto: `Olá {nome}! 📖 Aqui está sua dose diária de força e esperança no Pai:

📍 Texto Bíblico: Isaías 40:31
"Mas os que esperam no Senhor renovam suas forças, sobem com asas como águias; correm e não se cansam, caminham e não se fatigam."

💡 Devocional: Esperar em Deus nunca é perda de tempo, é o processo de preparação para voar mais alto. Deixe de tentar resolver tudo na sua força humana; descanse no fôlego que vem de cima!

❓ Reflexão: Onde você precisa parar de correr e simplesmente esperar pela direção de Deus hoje?

Que o Senhor renove o seu ânimo completamente hoje! 🦅🔥`
    },
    {
      titulo: '📖 O Cuidado Absoluto (1 Pedro 5:7)',
      texto: `A Paz de Cristo, {nome}! 📖 Mantenha seus pensamentos protegidos hoje com essa verdade:

📍 Texto Bíblico: 1 Pedro 5:7
"Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês."

💡 Devocional: Ansiedade é carregar o amanhã nas costas sem a força do hoje. Deus quer tirar essa mala pesada de você. Ele cuida do universo, mas cuida de cada detalhe da sua história!

❓ Reflexão: Que preocupação você vai voluntariamente entregar para Jesus nas suas orações de hoje?

Uma excelente caminhada livre de pesos para você! 🕊️🎒`
    },
    {
      titulo: '📖 Guardando os Olhos (Salmo 101:3)',
      texto: `Olá {nome}! 📖 Um convite para mantermos o foco e a santidade diante das distrações:

📍 Texto Bíblico: Salmo 101:3
"Não porei coisa má diante dos meus olhos."

💡 Devocional: No mundo digital, somos bombardeados por imagens e ideias que nos afastam de quem somos em Deus. Guardar os olhos é proteger nosso coração e nossa quietude espiritual.

❓ Reflexão: Do que você precisa desviar seus olhos ou dar "unfollow" nas redes hoje para preservar sua paz de espírito?

Tenha um dia focado e protegido na luz do Senhor! 🛡️👁️`
    }
  ];

  presetsEstudo = [
    {
      titulo: '💡 Identidade Real vs. Filtros Digitais',
      texto: `Olá {nome}! Preparado para o nosso estudo semanal? 💡 Tema de hoje: "Identidade Real vs. Filtros Digitais".

📖 Base Bíblica: Efésios 2:10
"Porque somos feitura sua, criados em Cristo Jesus para as boas obras..."

🔍 Estudo Prático:
Vivemos num mundo onde o número de curtidas e visualizações dita nosso valor de mercado social. Mas em Deus, seu valor foi fixado na cruz! Você foi projetado sob medida pelo Criador.
1. Filtros escondem falhas; Deus nos cura por completo.
2. Não troque a aceitação do Criador pelo aplauso de espectadores temporários.

📌 Exercício: Separe 10 minutos hoje para listar 3 qualidades que Deus diz que você tem em Sua Palavra. Caminhe com a cabeça erguida! 🚀🛡️`
    },
    {
      titulo: '💡 Ansiedade, Pressão e Paz Real',
      texto: `Olá {nome}! Passando para compartilhar um estudo de saúde mental e espiritualidade: 💡 "Ansiedade, Pressão e Paz Real".

📖 Base Bíblica: Filipenses 4:6-7
"Não andem ansiosos de coisa alguma; em tudo, porém, sejam conhecidas as suas petições diante de Deus pela oração..."

🔍 Estudo Prático:
A bíblia não ignora nossa dor. O profeta Elias sentiu medo extremo e angústia. O remédio de Deus para o cansaço mental foi: descanso físico, alimentação espiritual e uma doce voz sussurrada.
1. Oração não é obrigação religiosa, é descarga emocional na presença de Quem te ama.
2. A paz de Deus excede o nosso entendimento lógico!

📌 Exercício: Sempre que sentir o peito apertado, respire fundo e faça uma oração simples entregando essa preocupação específica ao Senhor. Ele cuida de você! 🕊️🩹`
    },
    {
      titulo: '💡 Vencendo Procrastinação e Distrações',
      texto: `Olá {nome}! 💡 Vamos refletir sobre "Gestão do Tempo e Procrastinação":

📖 Base Bíblica: Efésios 5:15-16
"Portanto, estejam atentos para que o seu procedimento não seja de tolos... aproveitando bem cada oportunidade, because os dias são maus."

🔍 Estudo Prático:
A maior arma de distração em massa está no nosso bolso. Passamos horas rolando telas e deixamos de construir aquilo que Deus nos desafiou a fazer.
1. Procrastinar é adiar a colheita do propósito.
2. Organização diária também é espiritualidade e excelente mordomia de vida.

📌 Exercício: Escolha uma tarefa importante que você está adiando e conclua-a hoje, dedicando o resultado a Deus! ⏳🔥`
    },
    {
      titulo: '💡 Namoro Cristão e Propósitos',
      texto: `Olá {nome}! 💡 Vamos estudar hoje sobre "Relacionamentos Saudáveis e Propósitos de Deus".

📖 Base Bíblica: 2 Coríntios 6:14 & 1 Coríntios 13:4
"Não se ponham em jugo desigual com descrentes... O amor é paciente, o amor é bondoso."

🔍 Estudo Prático:
Namoro não é para passar o tempo ou preencher solidão passageira. É uma ponte que visa construir uma família de princípios.
1. Caráter precede a atração física. Busque alguém que ame o Senhor antes de amar você.
2. Jugo desigual não é só sobre crença, mas sobre a velocidade e direção dos planos de vida.

📌 Exercício: Faça uma lista das virtudes espirituais que você busca em um relacionamento e ore a cada semana por isso! 💍❤️`
    },
    {
      titulo: '💡 Vencendo o Medo do Futuro e Escolhas',
      texto: `Graça e Paz, {nome}! 💡 Nosso tema de estudo é sobre o amanhã: "Medo do Futuro, Escolhas e Vocação".

📖 Base Bíblica: Provérbios 16:3
"Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos."

🔍 Estudo Prático:
A transição para a vida adulta traz cobranças gigantes: faculdade, carreira, dinheiro e estabilidade. O segredo bíblico está na mordomia dos passos diários.
1. O sucesso bíblico é diferente do sucesso do mundo. Sucesso bíblico é estar no centro da vontade de Deus.
2. Dedique seus estudos e seu trabalho ao Senhor. Faça com excelência técnica e integridade espiritual.

📌 Exercício: Escreva seus planos profissionais em um papel e faça uma oração sincera consagrando suas mãos e mente a Ele hoje! 🛡️💼`
    },
    {
      titulo: '💡 Liderança de Impacto e Ativismo',
      texto: `Olá {nome}! 💡 Vamos refletir sobre o seu papel ativo no Reino: "Chamado a Fazer Diferença".

📖 Base Bíblica: Mateus 5:14-16
"Vocês são a luz do mundo. Não se pode esconder uma cidade construída sobre um monte..."

🔍 Estudo Prático:
A juventude na bíblia sempre foi instrumento de transformação social (Daniel, José, Ester e Timóteo).
1. Você não é só o "futuro" da igreja, você é o presente dela.
2. Sua responsabilidade moral é manifestar compaixão e verdade onde houver escuridão.

📌 Exercício: Descubra qual área do seu departamento local ou bairro precisa de suporte voluntário esta semana e se ofereça para ajudar! ⚡🌍`
    }
  ];

  presetsNovo = [
    {
      titulo: '🌱 Bem-vindo à Família!',
      texto: `Olá {nome}! 💖 Que alegria imensa ver sua decisão de caminhar ao lado de Jesus! Este é o primeiro dia do restante da sua nova história!

📖 Promessa Bíblica: 2 Coríntios 5:17
"Portanto, se alguém está em Cristo, é nova criação; as coisas antigas já passaram, eis que tudo se fez novo!"

🎯 Seus Primeiros Passos:
1. Converse com Deus todos os dias (Através da oração, com palavras simples, como quem fala com o melhor amigo).
2. Conheça Jesus de perto (Comece lendo o Evangelho de João na Bíblia).
3. Caminhe acompanhado (Nós do LideraJovem estamos aqui integralmente para te apoiar em cada dúvida!).

Você não está sozinho(a) nessa trilha! Conta comigo para tudo! 🙌🌱`
    },
    {
      titulo: '🌱 Uma Nova Rota',
      texto: `Olá {nome}! Passando para celebrar seu novo nascimento espiritual! 🌱

📖 Texto Bíblico: Colossenses 2:6-7
"Portanto, assim como vocês receberam Cristo Jesus, o Senhor, continuem a viver nele, enraizados e edificados nele..."

💡 Lembre-se sempre:
A caminhada cristã é uma maratona, não um sprint de 100 metros. Não se cobre pela perfeição imediata; foque na comunhão constante. Cada pequeno passo com Jesus é uma vitória monumental.

Estamos orgulhosos da sua decisão e ansiosos para ver os lindos frutos que Deus gerará no seu coração! 👣✨`
    },
    {
      titulo: '🌱 Incondicionalmente Amado(a)',
      texto: `Olá {nome}! Como está o seu coração? 🌱 Queria deixar essa verdade na sua mente hoje:

📖 Texto Bíblico: João 1:12
"Mas, a todos quantos o receberam, deu-lhes o poder de serem feitos filhos de Deus, a saber, aos que creem no seu nome."

💡 Descanso na Graça:
Antes, éramos distantes; agora, fomos adotados como filhos legítimos do Deus Todo-Poderoso! Seu amor por você não depende do seu desempenho de hoje, mas da obra concluída de Jesus na cruz.

Que essa certeza guarde seu coração! Conte comigo para lermos a bíblia e tirarmos qualquer dúvida! Estamos juntos! 🛡️❤️`
    },
    {
      titulo: '🌱 O Seu Passado Foi Apagado!',
      texto: `Olá {nome}! 🌱 Quero compartilhar uma certeza inabalável para o seu novo caminhar:

📖 Texto Bíblico: 1 João 1:9
"Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados e nos purificar de toda injustiça."

💡 Vida Limpa:
O inimigo adora nos acusar das coisas antigas. Mas a Cruz assinou seu perdão definitivo. Quando Deus olha para você hoje, Ele vê a perfeição e o brilho de Jesus Cristo em sua vida. Sinta-se amado e livre!

Que a graça acolhedora de Deus guie seus passos! Conte comigo para orarmos juntos! 🙏🕊️`
    },
    {
      titulo: '🌱 Unidos na Igreja Local',
      texto: `Olá {nome}! 🌱 Esse estudo rápido vai falar da importância de não andarmos sós:

📖 Texto Bíblico: Hebreus 10:24-25
"Preocupemo-nos uns pelos outros, estimulando-nos ao amor e às boas obras. Não deixemos de nos reunir..."

💡 Comunidade Viva:
Um carvão aceso fora da fogueira se apaga facilmente. Estar reunido com outros jovens nos dá suporte nos momentos difíceis, traz aprendizado e alegria compartilhada. Venha estar conosco sempre!

Você agora faz parte desse corpo! Temos um lugar especial reservado para você. Abraço forte! 🤝⛪`
    },
    {
      titulo: '🌱 O Espírito Santo Habita em Você!',
      texto: `Olá {nome}, tudo bem? 🌱 Aqui está uma verdade crucial para te dar forças hoje:

📖 Texto Bíblico: João 14:26
"Mas o Conselheiro, o Espírito Santo, que o Pai enviará em meu nome, ensinará a vocês todas as coisas e fará vocês lembrarem..."

💡 Poder Interno:
Você não precisa se esforçar para mudar sozinho de comportamento. O Espírito Santo agora mora em você! É Ele quem te convence, dá forças para vencer tentações e te enche de amor a cada dia. Fale com Ele!

Que o Consolador seja seu melhor amigo hoje! Conte comigo para o que precisar. 🛡️🔥`
    }
  ];

  async gerarComApiExterna() {
    this.apiLoading.set(true);
    this.apiError.set('');
    try {
      // Usamos um tempo limite (timeout) de 4 segundos caso o servidor externo esteja indisponível ou lento
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch('https://bible-api.com/?random=verse&translation=almeida', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Response error');
      }

      const data = await response.json();
      const reference = data.reference || 'Versículo Recomendado';
      const text = data.text ? data.text.trim() : '';

      if (!text) {
        throw new Error('Texto vazio do servidor');
      }

      const templateCompleto = `Olá {nome}! Paz do Senhor! 📖 Segue nossa leitura diária recomendada para hoje, obtida em tempo real:

📍 Texto Bíblico: ${reference}
"${text}"

💡 Devocional: No silêncio e na agitação, a voz do Senhor nos guia. Que essas palavras entrem no seu coração hoje, produzindo vida, entendimento e um desejo profundo de santidade e retidão de conduta!

❓ Reflexão: Qual atitude prática nas suas rotinas você pode iniciar hoje para viver essa direção do Senhor?

Tenha um dia grandioso em nome de Jesus! 🙌✨`;

      this.messageTemplate.set(templateCompleto);
      this.apiError.set('');
    } catch (e) {
      console.warn('Usando fallback local devido a timeout/offline na API externa', e);
      // Fallback local robusto se a API externa der erro, CORS ou offline
      const randomIndex = Math.floor(Math.random() * this.localVersesFallback.length);
      const chosen = this.localVersesFallback[randomIndex];
      
      const templateLocal = `Olá {nome}! Paz do Senhor! 📖 Segue nossa leitura recomendada de hoje:

📍 Texto Bíblico: ${chosen.ref}
"${chosen.text}"

💡 Devocional: A Palavra de Deus permanece eternamente imutável! Que você possa se alimentar dela, meditando nos privilégios de ser guiado diretamente pelas promessas divinas.

❓ Reflexão: Como podemos manifestar essa promessa aos que caminham próximos de nós hoje?

Tenha um dia repleto de paz e vitórias! 🙌✨`;

      this.messageTemplate.set(templateLocal);
    } finally {
      this.apiLoading.set(false);
    }
  }

  toggleCategory(category: 'leitura' | 'estudo' | 'novo') {
    if (this.activeGeneratorCategory() === category) {
      this.activeGeneratorCategory.set(null);
    } else {
      this.activeGeneratorCategory.set(category);
    }
  }

  aplicarPreset(texto: string) {
    this.messageTemplate.set(texto);
  }
  
  sendTo(jovem: { nome: string; telefone: string | null }) {
    if (!jovem.telefone) {
      this.snackbar.show('Este jovem não possui telefone cadastrado.');
      return;
    }
    const link = this.getWhatsAppLink(jovem.telefone, jovem.nome);
    window.open(link, '_blank');
  }



  normalizePhone(raw: string | null | undefined) {
    if (!raw) return null;
    let num = raw.replace(/\D/g, '');
    if (num.length === 10 || num.length === 11) num = '55' + num;
    return num;
  }

  eventosPendentes = computed(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return this.data.eventos().filter(e => !e.realizado && new Date(e.data) >= hoje);
  });

  // Tamanhos padrões
  tamanhosChinelo = ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];
  tamanhosRoupa = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'];

  isValidDate = signal(false);
  
  newJovem = {
    nome: '',
    idade: 18,
    dataNascimento: '',
    tamanhoChinelo: '',
    tamanhoRoupa: '',
    telefone: '',
    fotoUrl: '',
    score: 'verde' as StatusScore,
    novoConvertido: false
  };

  get contactsSupported(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'contacts' in navigator;
  }

  // Formata telefone para padrão brasileiro
  private formatPhoneBR(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
    }
    
    return phone;
  }

  async importContact() {
    if (!this.contactsSupported) {
      this.snackbar.show('A importação de contatos não é suportada neste navegador ou dispositivo.');
      return;
    }

    try {
      // Abre o seletor nativo de contatos solicitando o nome e o telefone
      const props = ['name', 'tel'];
      const opts = { multiple: false };
      
      const nav = navigator as unknown as { 
        contacts: { 
          select: (props: string[], opts: { multiple: boolean }) => Promise<{ name?: string[]; tel?: string[] }[]> 
        } 
      };
      
      const contacts = await nav.contacts.select(props, opts);
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        // Nome completo
        if (contact.name && contact.name.length > 0) {
          this.newJovem.nome = contact.name[0];
        }
        // Telefone formatado
        if (contact.tel && contact.tel.length > 0) {
          const rawPhone = contact.tel[0];
          this.newJovem.telefone = this.formatPhoneBR(rawPhone);
        }
        this.cdr.detectChanges();
        this.snackbar.show('Contato importado com sucesso!');
      }
    } catch (err: unknown) {
      console.error('Erro ao importar contato:', err);
      const errorWithName = err as { name?: string; message?: string };
      // O AbortError acontece caso o usuário feche a lista de contatos nativa sem selecionar
      if (errorWithName?.name !== 'AbortError') {
        this.snackbar.show('Erro ao carregar contato do celular: ' + (errorWithName?.message || 'Erro desconhecido'));
      }
    }
  }

  filteredJovens = computed(() => {
    if (this.filterType() === 'novos') {
      return this.data.jovens().filter(j => j.novoConvertido);
    }
    if (this.filterType() === 'aniversariantes') {
      return this.showAllBirthdays() ? this.data.aniversariantesAll() : this.data.aniversariantesMes();
    }
    return this.data.jovens();
  });

  aniversariantesList = computed(() => this.showAllBirthdays() ? this.data.aniversariantesAll() : this.data.aniversariantesMes());

  calculateAge() {
    if (!this.newJovem.dataNascimento) return;
    const birthDate = new Date(this.newJovem.dataNascimento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    this.newJovem.idade = age;
  }

  // Função para validar data no formato DD/MM/YYYY
  private isValidDateString(dateString: string): boolean {
    if (!dateString || dateString.length !== 10) return false;
    
    const parts = dateString.split('/');
    if (parts.length !== 3) return false;

    const dia = parseInt(parts[0], 10);
    const mes = parseInt(parts[1], 10);
    const ano = parseInt(parts[2], 10);

    // Validações básicas
    if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return false;
    if (mes < 1 || mes > 12) return false;
    if (ano < 1900 || ano > new Date().getFullYear()) return false;

    // Validar dias por mês
    const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // Verificar ano bissexto
    if ((ano % 4 === 0 && ano % 100 !== 0) || (ano % 400 === 0)) {
      diasPorMes[1] = 29;
    }

    if (dia < 1 || dia > diasPorMes[mes - 1]) return false;

    // Verificar se a data não é no futuro
    const dateObj = new Date(ano, mes - 1, dia);
    if (dateObj > new Date()) return false;

    return true;
  }

  // Verifica se o formulário é válido para salvar
  isFormValid(): boolean {
    return !!(this.newJovem.nome && this.isValidDateString(this.dataNascimentoInput));
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const filter = params['filter'];
      if (filter === 'aniversariantes') {
        this.filterType.set('aniversariantes');
      }

      const eventoId = params['avisoEvento'];
      if (eventoId) {
        this.showMessageModal.set(true);
        // Wait a tick for modal to render and select to exist
        setTimeout(() => {
          const select = document.getElementById('eventSelect') as HTMLSelectElement;
          if (select) {
            select.value = eventoId;
            // dispatch change event to run the selecting logic
            select.dispatchEvent(new Event('change'));
          } else {
             // Fallback if select doesn't exist yet but data does
             const evento = this.data.eventos().find(e => e.id === eventoId);
             if (evento) {
                const parts = evento.data.split('-');
                const dataStr = parts.length === 3 ? `${parts[2]}/${parts[1]}` : evento.data;
                this.messageTemplate.set(`Olá {nome}! Teremos o evento "${evento.nome}" no dia ${dataStr}. Contamos com você!`);
             }
          }
        }, 100);
      }
    });
  }

  onFileSelected(event: Event, targetObj: { fotoUrl?: string | null }) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.snackbar.show('Por favor, selecione um arquivo de imagem (JPG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 512;
        const MAX_HEIGHT = 512;
        let width = img.width;
        let height = img.height;

        // Validating dimensions
        if (width <= 0 || height <= 0) return;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill background with white to avoid black on transparent PNG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', 0.85);

          this.imgbb.uploadImage(base64).then(url => {
            targetObj.fotoUrl = url;
            this.cdr.detectChanges();
          }).catch(err => {
            console.error(err);
            targetObj.fotoUrl = base64;
            this.cdr.detectChanges();
          });
        }
      };
      img.onerror = () => {
        this.snackbar.show('Erro ao carregar a imagem. Verifique se o arquivo não está corrompido e tente novamente (formatos ideais: JPG, PNG).');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  onDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    
    let formatted = '';
    if (value.length > 0) {
      formatted = value.substring(0, 2);
      if (value.length > 2) {
        formatted += '/' + value.substring(2, 4);
      }
      if (value.length > 4) {
        formatted += '/' + value.substring(4, 8);
      }
    }
    input.value = formatted;
    this.dataNascimentoInput = formatted;

    if (formatted.length === 10) {
      // Validar data usando função de validação
      if (this.isValidDateString(formatted)) {
        const parts = formatted.split('/');
        const dia = parseInt(parts[0], 10);
        const mes = parseInt(parts[1], 10);
        const ano = parseInt(parts[2], 10);
        
        const mesStr = String(mes).padStart(2, '0');
        const diaStr = String(dia).padStart(2, '0');
        this.newJovem.dataNascimento = `${ano}-${mesStr}-${diaStr}`;
        this.calculateAge();
        this.isValidDate.set(true);
      } else {
        this.newJovem.dataNascimento = '';
        this.isValidDate.set(false);
      }
    } else {
      this.newJovem.dataNascimento = '';
      this.isValidDate.set(false);
    }
  }

  onNativeDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value; // Format is YYYY-MM-DD
    if (!value) {
      this.isValidDate.set(false);
      return;
    }

    this.newJovem.dataNascimento = value;
    this.calculateAge();

    const parts = value.split('-');
    if (parts.length === 3) {
      const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
      this.dataNascimentoInput = formatted;
      this.isValidDate.set(this.isValidDateString(formatted));
    }
  }

  getBadgeClass(score: StatusScore): string {
    switch (score) {
      case 'verde': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
      case 'amarelo': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
      case 'vermelho': return 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20';
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700';
    }
  }

  getDotClass(score: StatusScore): string {
    switch (score) {
      case 'verde': return 'bg-emerald-500';
      case 'amarelo': return 'bg-amber-500';
      case 'vermelho': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  }

  openModal() {
    this.showModal.set(true);
    this.dataNascimentoInput = '';
    this.isValidDate.set(false);
    this.newJovem = { nome: '', idade: 18, dataNascimento: '', tamanhoChinelo: '', tamanhoRoupa: '', telefone: '', fotoUrl: '', score: 'verde', novoConvertido: false };
  }

  openMessageModal() {
    this.showMessageModal.set(true);
  }

  selecionarEventoParaMensagem(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (!select.value) return;
    const evento = this.data.eventos().find(e => e.id === select.value);
    if (evento) {
      // Create a nice message
      const parts = evento.data.split('-');
      const dataStr = parts.length === 3 ? `${parts[2]}/${parts[1]}` : evento.data;
      this.messageTemplate.set(`Olá {nome}! Teremos o evento "${evento.nome}" no dia ${dataStr}. Contamos com você!`);
      // Reset select
      select.value = '';
    }
  }

  getWhatsAppLink(telefone: string | null, nome: string): string {
    if (!telefone) return '#';
    let num = telefone.replace(/\D/g, '');
    if (num.length === 10 || num.length === 11) {
      num = '55' + num;
    }
    const msg = this.messageTemplate().replace('{nome}', nome.split(' ')[0]);
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveJovem() {
    if (!this.isFormValid()) {
      this.snackbar.show('Por favor, preencha o nome e uma data de nascimento válida (DD/MM/YYYY)');
      return;
    }
    this.data.addJovem(this.newJovem);
    this.closeModal();
  }

  deletarJovem(id: string) {
    this.jovemToDelete.set(id);
  }

  confirmDelete() {
    const id = this.jovemToDelete();
    if (id) {
      this.data.deleteJovem(id);
      this.jovemToDelete.set(null);
    }
  }

  exportBirthdaysToPDF() {
    const doc = new jsPDF();
    const data = this.aniversariantesList();
    const headers = ['Nome', 'Data Nasc.', 'Dia', 'Telefone'];
    
    const rows = data.map(j => [
      j.nome,
      j.dataNascimento ? new Date(j.dataNascimento).toLocaleDateString('pt-BR') : '--',
      this.data.getAniversarioDia(j.dataNascimento),
      j.telefone || '--'
    ]);

    const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long' });
    const titulo = this.showAllBirthdays() ? 'Aniversariantes - Todos' : `Aniversariantes de ${mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1)}`;

    doc.setFontSize(18);
    doc.text(titulo, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Lista gerada em ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // indigo-600
      styles: { fontSize: 9 }
    });

    doc.save(`aniversariantes_${mesAtual}.pdf`);
  }

  cancelDelete() {
    this.jovemToDelete.set(null);
  }
}
