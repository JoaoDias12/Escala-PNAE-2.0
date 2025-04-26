const firebaseConfig = firebase.initializeApp({
  apiKey: 'AIzaSyBR0io-r_snZTWy1pe8A0dsb4awBpANDxs',
  authDomain: 'escala-pnae.firebaseapp.com',
  databaseURL: 'https://escala-pnae-default-rtdb.firebaseio.com',
  projectId: 'escala-pnae',
  storageBucket: 'escala-pnae.firebasestorage.app',
  messagingSenderId: '289230851590',
  appId: '1:289230851590:web:a638d6c6a8409d65803d87'
})

var database = firebase.database()

function getSPTime() {
  const now = new Date()
  const options = {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }
  const formatter = new Intl.DateTimeFormat('pt-BR', options)
  const parts = formatter.formatToParts(now)

  const year = parts.find(part => part.type === 'year').value
  const month = parts.find(part => part.type === 'month').value - 1 // mês em JavaScript é 0-indexado
  const day = parts.find(part => part.type === 'day').value
  const hour = parts.find(part => part.type === 'hour').value
  const minute = parts.find(part => part.type === 'minute').value
  const second = parts.find(part => part.type === 'second').value

  return new Date(year, month, day, hour, minute, second)
}

/////////////////////////////////////////////////////////////////
//////////////////////////LOGINAREA//////////////////////////////

const names = ['Dias', 'Pamela', 'Joao', 'Cesar', 'Zaman'] // Lista de nomes permitidos
let SENHA_LOGIN = '25137'
let login = document.getElementById('login')
let allEscalas = document.getElementById('allEscalas')
let btnLogin = document.getElementById('btnLogin')
let lbIncorrect = document.getElementById('lbIncorrect')

let inptUser = document.getElementById('inptUser')
let inptPassword = document.getElementById('inptPassword')

btnLogin.addEventListener('click', e => {
  e.preventDefault()

  const username = inptUser.value.trim()
  const password = inptPassword.value

  if (password === SENHA_LOGIN) {
    if (username !== '') {
      if (names.includes(username)) {
        checkAndCreateUser(username)
      } else {
        console.log('Nome de usuário não permitido.')
        lbIncorrect.textContent = 'Nome de usuário não permitido!'

        setTimeout(function () {
          lbIncorrect.textContent = ''
        }, 1000)
      }
    }
  } else {
    console.log('Senha incorreta')
    lbIncorrect.textContent = 'Senha não permitida!'

    setTimeout(function () {
      lbIncorrect.textContent = ''
    }, 1000)
  }
})

let actualLogin = ''

/////////////////////////////////////////////////////////////////
//////////////////////////FIREBASE USER HANDLING/////////////////

function checkAndCreateUser(username) {
  const usersRef = database.ref('Users')

  usersRef.child(username).once('value', snapshot => {
    if (snapshot.exists()) {
      console.log('Usuário já existe:', username)
      actualLogin = username
      login.classList.add('hidden')
      allEscalas.classList.remove('hidden')
      loadEscalas()
    } else {
      usersRef
        .child(username)
        .set({
          name: username
        })
        .then(() => {
          console.log('Novo usuário criado:', username)
          actualLogin = username
          login.classList.add('hidden')
          allEscalas.classList.remove('hidden')
          loadEscalas()
        })
        .catch(error => {
          console.error('Erro ao criar usuário:', error)
        })
    }
  })
}

/////////////////////////////////////////////////////////////////
////////////////////////////ESCALAS CREATE///////////////////////

let Scales
let nameEscala = document.getElementById('nameEscala')

let actualScale = ''

// Função para criar nova escala no Firebase
function createNewEscala() {
  const userActual = actualLogin

  // Verifica se há usuário logado
  if (!userActual) {
    console.error('Nenhum usuário logado!')
    alert('Você precisa estar logado para criar uma escala!')
    return
  }

  // Referência para o nó do usuário Dias
  const diasRef = database.ref('Users/Dias')

  // Cria um novo nó de escala com um ID único
  const newScaleRef = diasRef.child('Escalas').push()

  // Dados da nova escala
  const newScaleData = {
    name: 'Nova Escala',
    createdBy: userActual, // ou userActual.email, dependendo do que você tem
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    peoples: {}, // Objeto vazio para ser preenchido depois
    rules: {}
  }

  // Salva no Firebase
  newScaleRef
    .set(newScaleData)
    .then(() => {
      console.log('Nova escala criada com sucesso!')

      // Opcional: Atualiza a interface ou redireciona
      loadEscalas() // Se você tiver uma função para carregar as escalas
    })
    .catch(error => {
      console.error('Erro ao criar escala:', error)
      alert('Erro ao criar escala: ' + error.message)
    })
}

function loadEscalas() {
  const listEscalas = document.getElementById('listEscalas')
  listEscalas.innerHTML = ''

  const escalasRef = database.ref('Users/Dias/Escalas')

  escalasRef.once('value').then(snapshot => {
    const escalasData = snapshot.val()

    if (!escalasData) {
      listEscalas.innerHTML = '<p>Nenhuma escala encontrada.</p>'
      return
    }

    // Cria as escalas na interface
    Object.keys(escalasData).forEach(escalaId => {
      const escala = escalasData[escalaId]

      const escalaDiv = document.createElement('div')
      escalaDiv.className = 'Escala'
      escalaDiv.value = escalaId // Armazena o ID no value

      const title = document.createElement('h2')
      title.textContent = escala.name // Mostra o nome no texto

      escalaDiv.appendChild(title)
      listEscalas.appendChild(escalaDiv)
    })

    // Configura os event listeners
    setupScaleClickListeners()
  })
}

function setupScaleClickListeners() {
  const Scales = document.querySelectorAll('.Escala')

  Scales.forEach(Scale => {
    Scale.addEventListener('click', function () {
      const escalaId = this.value // Pega o ID do value

      EscalaShow.classList.remove('hidden')
      allEscalas.classList.add('hidden')

      // Busca diretamente pelo ID
      actualScale = escalaId
      peoplesPDF.innerHTML = ''
      peoples = ''
      loadPeoplesFromEscala(escalaId)
      createPeoplesPDF()
      loadPeoplesFromDatabase()
      loadEscala()
    })
  })
}

function loadPeoplesFromEscala(escalaId) {
  const database = firebase.database()
  const escalaRef = database.ref(`Users/Dias/Escalas/${escalaId}`)

  escalaRef.once('value').then(snapshot => {
    const escala = snapshot.val()

    nameEscala.textContent = escala.name
  })
}

function loadPeoplesFromDatabase() {
  if (!actualScale) {
    console.error('Nenhuma escala selecionada!')
    return
  }

  const db = firebase.database()
  const ref = db.ref(`Users/Dias/Escalas/${actualScale}/peoples`)

  ref.once(
    'value',
    function (snapshot) {
      const peoplesData = snapshot.val()

      if (peoplesData) {
        Object.keys(peoplesData).forEach(matricula => {
          if (!peoplesData[matricula].Folgas) {
            peoplesData[matricula].Folgas = []
          }

          const defaults = {
            Folga: false,
            Double: false,
            Holiday: false,
            Docket: false,
            Additionals: {}
          }

          peoplesData[matricula] = { ...defaults, ...peoplesData[matricula] }
        })

        peoples = peoplesData
        console.log('Dados carregados:', peoples)
        createPeoplesPDF()
      } else {
        console.log('Nenhum dado encontrado')
        peoples = {}
      }
    },
    function (error) {
      console.error('Erro ao carregar:', error)
    }
  )
}

document.addEventListener('keydown', function (event) {
  // if (event.key === 'P' || event.key === 'p') {
  //event.preventDefault()
  // loadEscalas()
  //}
})

// Configura o evento de clique no botão
const btnCreateEscalas = document.getElementById('btnCreateEscalas')
btnCreateEscalas.addEventListener('click', createNewEscala)

/////////////////////////////////////////////////////////////////
////////////////////////////ESCALAS PNAE/////////////////////////

let logout = document.getElementById('logout')
const peoplesPDF = document.getElementById('peoplesPDF')

logout.addEventListener('click', function () {
  location.reload()
})

let EscalaShow = document.getElementById('EscalaShow')
let btnReload = document.getElementById('btnReload')
let btnHome = document.getElementById('btnHome')
let btnSave = document.getElementById('btnSave')

let btnSavePDF = document.getElementById('btnSavePDF')

let peoples = {}

btnReload.addEventListener('click', function () {
  loadPeoplesFromEscala(actualScale)
  createPeoplesPDF()
  loadPeoplesFromDatabase()
  loadEscala()
  console.log(peoples)
})

btnHome.addEventListener('click', function () {
  EscalaShow.classList.add('hidden')
  allEscalas.classList.remove('hidden')
})

nameEscala.addEventListener('click', function () {
  const input = document.createElement('input')
  input.type = 'text'
  input.value = this.textContent
  input.id = 'nameEscala'

  this.replaceWith(input)

  nameEscala = document.getElementById('nameEscala')
  btnSave.classList.remove('hidden')
})

btnSave.addEventListener('click', function () {
  const newName = nameEscala.value || nameEscala.textContent

  const h1 = document.createElement('h1')
  h1.textContent = newName
  h1.id = 'nameEscala'

  if (!actualScale) {
    console.error('Nenhuma escala selecionada!')
    alert('Selecione uma escala antes de salvar!')
    return
  }

  const escalaRef = database.ref(`Users/Dias/Escalas/${actualScale}`)

  escalaRef
    .update({
      name: newName
    })
    .then(() => {
      console.log('Nome da escala atualizado com sucesso!')

      nameEscala.replaceWith(h1)
      nameEscala = document.getElementById('nameEscala')
      btnSave.classList.add('hidden')
      loadEscalas()
    })
    .catch(error => {
      console.error('Erro ao atualizar escala:', error)
    })
})

function calcSlacks(proximoPeriodo, escala, pessoa) {
  let dataAtual = getSPTime()
  let folgas = []

  let diaInicioFolga = peoples[pessoa].FirstDay
  let mesInicioFolga = peoples[pessoa].FirstMonth
  let dupla = peoples[pessoa].Double // Obter o valor inicial de Dupla
  let dataInicioFolga = new Date(
    dataAtual.getFullYear(),
    mesInicioFolga - 1,
    diaInicioFolga
  )

  let ultimasFolgas = []

  // Ajuste inicial para garantir que a data de início seja correta, incluindo datas anteriores
  while (dataInicioFolga <= dataAtual) {
    ultimasFolgas.push(dataInicioFolga.toDateString())

    if (dupla) {
      let dataFolga2 = new Date(dataInicioFolga)
      dataFolga2.setDate(dataInicioFolga.getDate() + 1)
    }

    dataInicioFolga.setDate(
      dataInicioFolga.getDate() + escala + 1 + (dupla ? 1 : 0)
    )
    dupla = !dupla // Alternar entre folga simples e dupla
  }

  // Loop para calcular folgas para o próximo período
  while (folgas.length < proximoPeriodo) {
    let dataFolga1 = new Date(dataInicioFolga)
    folgas.push(dataFolga1.getDate())

    if (dupla) {
      let dataFolga2 = new Date(dataInicioFolga)
      dataFolga2.setDate(dataInicioFolga.getDate() + 1)
      folgas.push(dataFolga2.getDate())
    }

    // Atualizar a data de início para a próxima folga
    dataInicioFolga.setDate(
      dataInicioFolga.getDate() + escala + 1 + (dupla ? 1 : 0)
    )
    dupla = !dupla // Alternar entre folga simples e dupla
  }

  return [...folgas]
}

function isSlackToday(diasFolga) {
  let dataAtual = getSPTime().toDateString()
  return diasFolga.includes(dataAtual)
}

function updateSlacks(peoples) {
  Object.keys(peoples).forEach(nome => {
    let folgas = calcSlacks(6, 6, nome)
    peoples[nome].Folga = isSlackToday(folgas)
    peoples[nome].Folgas = folgas
  })
}

function createPeoplesPDF() {
  peoplesPDF.innerHTML = ''

  // Obtém a data atual no fuso de SP usando a nova função
  const currentDate = getSPTime()
  const currentMonth = currentDate.getMonth() // 0-11
  const currentYear = currentDate.getFullYear()

  // Dias no mês atual
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  // Objeto para armazenar as divs de cada time
  const timeContainers = {}

  // Primeiro passamos por todas as pessoas para criar os containers de time
  Object.keys(peoples).forEach(personKey => {
    const person = peoples[personKey]
    const rawTime = person.Time || 'SEMTIME' // Usa 'SEMTIME' se não tiver time definido
    const time = rawTime.toUpperCase() // Converte para maiúsculas

    if (!timeContainers[time]) {
      // Cria o cabeçalho do time (usando o valor original para exibição)
      const timeHeader = document.createElement('h2')
      timeHeader.textContent = time
      peoplesPDF.appendChild(timeHeader)

      // Cria o container do time
      const timeDiv = document.createElement('div')
      timeDiv.className = `Time${time.replace(/\s+/g, '')}` // Remove espaços para nome de classe
      timeContainers[time] = timeDiv
      peoplesPDF.appendChild(timeDiv)
    }
  })

  // Agora processamos cada pessoa e adicionamos ao seu respectivo container
  Object.keys(peoples).forEach(personKey => {
    const person = peoples[personKey]
    const rawTime = person.Time || 'SEMTIME' // Usa 'SEMTIME' se não tiver time definido
    const time = rawTime.toUpperCase() // Converte para maiúsculas

    // Atualiza as folgas (assumindo que updateSlacks está correto)
    updateSlacks(peoples)

    const personDiv = document.createElement('div')
    personDiv.className = 'person'

    // Cria container para os dias
    const allDaysDiv = document.createElement('div')
    allDaysDiv.className = 'allDays'

    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div')
      dayElement.className = 'day'
      dayElement.textContent = day

      // Verifica se o dia está no array de folgas
      if (person.Folgas.includes(day)) {
        dayElement.classList.add('slack')
      }

      allDaysDiv.appendChild(dayElement)
    }

    // Cria os elementos individuais
    const matricula = document.createElement('div')
    matricula.className = 'matricula'
    matricula.textContent = person.Matricula

    const name = document.createElement('div')
    name.className = 'name'
    name.textContent = person.Name

    const timeEnter = document.createElement('div')
    timeEnter.className = 'timeEnter'
    timeEnter.textContent = person.TimeEnter

    const timeExit = document.createElement('div')
    timeExit.className = 'timeExit'
    timeExit.textContent = person.TimeExit

    const totalFolgas = document.createElement('div')
    totalFolgas.className = 'totalFolgas'
    totalFolgas.textContent = person.Folgas.length

    // Monta a estrutura
    personDiv.appendChild(matricula)
    personDiv.appendChild(name)
    personDiv.appendChild(timeEnter)
    personDiv.appendChild(timeExit)
    personDiv.appendChild(allDaysDiv)
    personDiv.appendChild(totalFolgas)

    // Adiciona a pessoa ao container do seu time (usando o time em maiúsculas)
    timeContainers[time].appendChild(personDiv)
  })
}

btnSavePDF.addEventListener('click', function () {
  transformInPDF()
})

async function transformInPDF() {
  const { jsPDF } = window.jspdf // Se estiver usando CDN
  const element = document.getElementById('peoplesPDF')

  // 1. Converter HTML para canvas
  const canvas = await html2canvas(element, {
    scale: 2, // Aumenta a qualidade
    useCORS: true, // Permite imagens externas
    logging: true, // Mostra erros no console
    backgroundColor: '#ffffff' // Fundo branco
  })

  // 2. Configurações do PDF (Letter Landscape)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: 'letter'
  })

  // 3. Dimensões da página e imagem (90% da área útil)
  const pageWidth = 11 // Largura da página em polegadas (Letter landscape)
  const pageHeight = 8.5 // Altura da página

  const margin = 0.5 // Margem de 0.5" (ajuste conforme necessário)
  const usableWidth = pageWidth - margin * 2
  const usableHeight = pageHeight - margin * 2

  // 4. Calcular proporção para ocupar 90% da área útil
  const imgRatio = canvas.width / canvas.height
  let imgWidth = usableWidth * 0.9
  let imgHeight = imgWidth / imgRatio

  // Se a altura ultrapassar 90% da área, redimensionamos
  if (imgHeight > usableHeight * 0.9) {
    imgHeight = usableHeight * 0.9
    imgWidth = imgHeight * imgRatio
  }

  // 5. Centralizar na página
  const xPos = (pageWidth - imgWidth) / 2
  const yPos = (pageHeight - imgHeight) / 2

  // 6. Adicionar imagem ao PDF
  pdf.addImage(canvas, 'JPEG', xPos, yPos, imgWidth, imgHeight)
  pdf.save('Escala.pdf')
}
/////////////////////////////////////////////////////////////////
////////////////////ESCALAS ADD/REMOVE PEOPLE////////////////////

let btnAddPeople = document.getElementById('btnAddPeople')
let btnRemovePeople = document.getElementById('btnRemovePeople')

let addPeopleScreen = document.getElementById('addPeopleScreen')
let closeAddPeopleScreen = document.getElementById('closeAddPeopleScreen')
let savePeopleInPeoples = document.getElementById('savePeopleInPeoples')

btnAddPeople.addEventListener('click', function () {
  addPeopleScreen.classList.remove('hidden')
})

btnRemovePeople.addEventListener('click', function () {
  removePeople()
})

closeAddPeopleScreen.addEventListener('click', function () {
  addPeopleScreen.classList.add('hidden')
})

savePeopleInPeoples.addEventListener('click', e => {
  e.preventDefault()
  addPeople()
  savePeoplesToDatabase()
})

function addPeople() {
  const matricula = document.getElementById('registry').value
  const nome = document.getElementById('addPeopleName').value
  const entrada = document.getElementById('addTimeEnterPeople').value
  const saida = document.getElementById('addTimeExitPeople').value
  const turno = document.getElementById('addPeopleTime').value
  const primeiroDia = parseInt(
    document.getElementById('addPeopleFirstDay').value
  )
  const primeiroMes = parseInt(
    document.getElementById('addPeopleFirstMonth').value
  )
  const escala = document.getElementById('addPeopleTypeScale').value
  const Role = document.getElementById('addPeopleTypeScale').value

  peoples[matricula] = {
    Matricula: matricula,
    Name: nome,
    TimeEnter: entrada,
    TimeExit: saida,
    Time: turno,
    FirstDay: primeiroDia,
    FirstMonth: primeiroMes,
    Folga: false,
    Double: false,
    Holiday: false,
    Docket: false,
    Folgas: [],
    Scale: escala,
    Additionals: {
      Role: Role
    }
  }

  addPeopleScreen.classList.add('hidden')
  return peoples[matricula]
}

function removePeople() {
  const matricula = prompt('Digite a matrícula:')
  if (!matricula) return

  if (peoples[matricula]) {
    firebase
      .database()
      .ref(`Users/Dias/Escalas/${actualScale}/peoples/${matricula}`)
      .remove()
      .then(() => {
        delete peoples[matricula]
        console.log('Removido com sucesso!')
        loadPeoplesFromEscala(actualScale)
        createPeoplesPDF()
        loadPeoplesFromDatabase()
      })
  } else {
    console.log('Matrícula não encontrada!')
  }
}

function savePeoplesToDatabase() {
  if (!actualScale) {
    console.error('Nenhuma escala selecionada!')
    return
  }

  if (!peoples || Object.keys(peoples).length === 0) {
    console.error('Nenhum dado para salvar!')
    return
  }

  const escalaPeoplesRef = database.ref(
    `Users/Dias/Escalas/${actualScale}/peoples`
  )

  escalaPeoplesRef.set(peoples, function (error) {
    if (error) {
      console.error('Erro ao salvar pessoas:', error)
    } else {
      console.log('Dados salvos com sucesso na escala:', actualScale)
    }
  })

  createPeoplesPDF()
}

/////////////////////////////////////////////////////////////////
////////////////////////////BUTTONS//////////////////////////////

let btnFolgas = document.getElementById('btnFolgas')
let btnEscalaShow = document.getElementById('btnEscalaShow')
let btnConfigsEscala = document.getElementById('btnConfigsEscala')

let peoplesEscala = document.getElementById('peoplesEscala')
let btnSavePDFEscala = document.getElementById('btnSavePDFEscala')
let peoplesConfigEscala = document.getElementById('peoplesConfigEscala')
let btnDeliverPeoples = document.getElementById('btnDeliverPeoples')

btnFolgas.addEventListener('click', function () {
  peoplesPDF.classList.remove('hidden')
  btnSavePDF.classList.remove('hidden')

  peoplesEscala.classList.add('hidden')
  btnSavePDFEscala.classList.add('hidden')
  btnDeliverPeoples.classList.add('hidden')

  peoplesConfigEscala.classList.add('hidden')
})

btnEscalaShow.addEventListener('click', function () {
  peoplesPDF.classList.add('hidden')
  btnSavePDF.classList.add('hidden')

  btnDeliverPeoples.classList.remove('hidden')
  peoplesEscala.classList.remove('hidden')
  btnSavePDFEscala.classList.remove('hidden')

  peoplesConfigEscala.classList.add('hidden')
})

btnConfigsEscala.addEventListener('click', function () {
  peoplesPDF.classList.add('hidden')
  btnSavePDF.classList.add('hidden')
  btnDeliverPeoples.classList.add('hidden')

  peoplesEscala.classList.add('hidden')
  btnSavePDFEscala.classList.add('hidden')

  peoplesConfigEscala.classList.remove('hidden')
})

/////////////////////////////////////////////////////////////////
/////////////////////////ESCALACONFIG////////////////////////////

let savePosition

function createPosition() {
  const positionsContainer = document.getElementById('positionsContainer')

  const positionDiv = document.createElement('div')
  positionDiv.className = 'positionsEscala'

  // Obter horários únicos em maiúsculas
  const horariosUnicos = [
    ...new Set(
      Object.values(peoples)
        .filter(p => p.Time)
        .map(p => p.Time.toUpperCase())
    )
  ]

  // Obter Roles únicos (se existirem)
  const rolesUnicos = [
    ...new Set(
      Object.values(peoples)
        .filter(p => p.Additionals && p.Additionals.Role)
        .map(p => p.Additionals.Role)
        .filter(role => role) // Remove valores vazios
    )
  ]

  // HTML da posição
  positionDiv.innerHTML = `
    <div class="config-group">
      <label>Nome da Posição</label>
      <input autocomplete="off" class="inptNamePosition" type="text" class="pos-nome" required>
    </div>
    
    <div class="config-group">
      <label>Quantidade Mínima</label>
      <input class="inptQuantMinPosition" type="number" class="pos-min" min="0" value="0">
    </div>
    
    <div class="config-group">
      <label>Quantidade Fixa</label>
      <input class="inptQuantFixPosition" type="number" class="pos-fixa" min="0" value="0">
    </div>
    
    <div class="config-group">
      <label>Pessoas Fixas</label>
      <div class="options-container pessoas-container">
        ${Object.values(peoples)
          .map(
            pessoa => `
          <label class="option-item">
            <input class="inptPeopleFixPositions" type="checkbox" value="${pessoa.Matricula}">
            <span>${pessoa.Name}</span>
          </label>
        `
          )
          .join('')}
      </div>
    </div>
    
    <div class="config-group">
      <label>Horários</label>
      <div class="options-container horarios-container">
        ${horariosUnicos
          .map(
            horario => `
          <label class="option-item">
            <input class="inptTimesPositions" type="checkbox" value="${horario}">
            <span>${horario}</span>
          </label>
        `
          )
          .join('')}
      </div>
    </div>
    
    ${
      rolesUnicos.length > 0
        ? `
    <div class="config-group">
      <label>Cargos</label>
      <div class="options-container roles-container">
        ${rolesUnicos
          .map(
            role => `
          <label class="option-item">
            <input class="inptRolesPositions" type="checkbox" value="${role}">
            <span>${role}</span>
          </label>
        `
          )
          .join('')}
      </div>
    </div>
    `
        : ''
    }
    
    <button type="button" class="savePosition">Salvar Posição</button>
    <button type="button" class="removePosition">Remover Posição</button>
  `

  // Evento para remover
  positionDiv
    .querySelector('.removePosition')
    .addEventListener('click', function () {
      if (confirm('Tem certeza que deseja remover esta posição?')) {
        positionDiv.remove()
      }
    })

  positionDiv
    .querySelector('.savePosition')
    .addEventListener('click', function () {
      createInPeoplesEscala(this)
    })

  positionsContainer.appendChild(positionDiv)
}

function getPessoasSelecionadas(posElement) {
  return Array.from(
    posElement.querySelectorAll('.pessoas-container input:checked')
  ).map(el => el.value)
}

function getHorariosSelecionados(posElement) {
  return Array.from(
    posElement.querySelectorAll('.horarios-container input:checked')
  ).map(el => el.value)
}

///////////////////////////////////////////////////////////////////
function createInPeoplesEscala(button) {
  let father = button.parentElement

  let inptName = father.querySelector('.inptNamePosition').value
  let inptQuantMin = father.querySelector('.inptQuantMinPosition').value
  let inptQuantFix = father.querySelector('.inptQuantFixPosition').value
  let inptPeopleFix = father.querySelectorAll('.inptPeopleFixPositions')
  let inptRoles = father.querySelectorAll('.inptRolesPositions')
  let inptTimes = father.querySelectorAll('.inptTimesPositions')

  // Verifica se é a primeira posição sendo criada
  const firstPosition = peoplesEscala.querySelector('.escalaPosition') === null

  if (firstPosition) {
    // Cria os 7 dias da semana (domingo a sábado)
    createWeekDays()
  }

  // Adiciona ou atualiza a posição para cada dia existente
  const daysContainers = peoplesEscala.querySelectorAll('.day-container')

  daysContainers.forEach(dayContainer => {
    // Verifica se a posição já existe neste dia
    const existingPosition = Array.from(
      dayContainer.querySelectorAll('.escalaPosition')
    ).find(pos => pos.querySelector('.textNameValue')?.textContent === inptName)

    if (existingPosition) {
      // ATUALIZA a posição existente
      updateExistingPosition(
        existingPosition,
        inptName,
        inptQuantMin,
        inptQuantFix,
        inptPeopleFix,
        inptRoles,
        inptTimes
      )
    } else {
      // CRIA nova posição
      dayContainer.innerHTML += `
        <div class="escalaPosition">
          <h2 class="textNameValue">${inptName}</h2>
          <div class="spacePeopleMin"></div>
          <div class="spacePeopleFix"></div>
          <div class="spacePeoplesFixed"></div>
          <div class="spacePeoplesTimes"></div>
        </div>
      `

      const newPosition = dayContainer.lastElementChild
      setupNewPosition(
        newPosition,
        inptName,
        inptQuantMin,
        inptQuantFix,
        inptPeopleFix,
        inptRoles,
        inptTimes
      )
    }
  })
}

function updateExistingPosition(
  position,
  name,
  quantMin,
  quantFix,
  peopleFix,
  roles,
  times
) {
  // Atualiza os elementos básicos
  position.querySelector('.textNameValue').textContent = name

  // Limpa os conteúdos
  const spacePeopleMin = position.querySelector('.spacePeopleMin')
  const spacePeopleFix = position.querySelector('.spacePeopleFix')
  const spacePeoplesFixed = position.querySelector('.spacePeoplesFixed')
  const spacePeoplesTimes = position.querySelector('.spacePeoplesTimes')

  spacePeopleMin.innerHTML = ''
  spacePeopleFix.innerHTML = ''
  spacePeoplesFixed.innerHTML = ''
  spacePeoplesTimes.innerHTML = ''

  // Remove classes hidden e atributos
  spacePeopleMin.classList.remove('hidden')
  spacePeopleFix.classList.remove('hidden')
  position.removeAttribute('data-type')
  position
    .querySelectorAll('[data-role]')
    .forEach(el => el.removeAttribute('data-role'))

  // Reconstrói a posição com os novos valores
  setupNewPosition(position, name, quantMin, quantFix, peopleFix, roles, times)
}

function setupNewPosition(
  position,
  name,
  quantMin,
  quantFix,
  peopleFix,
  roles,
  times
) {
  let min = 0
  let fix = 0
  let fixed = 0

  const spacePeopleMin = position.querySelector('.spacePeopleMin')
  const spacePeopleFix = position.querySelector('.spacePeopleFix')
  const spacePeoplesFixed = position.querySelector('.spacePeoplesFixed')
  const spacePeoplesTimes = position.querySelector('.spacePeoplesTimes')

  // Configura quantidade mínima
  if (quantMin != 0) {
    for (let i = 0; i < quantMin; i++) {
      spacePeopleMin.innerHTML += `<div class="spPplMin"></div>`
      min++
    }
  } else {
    spacePeopleMin.classList.add('hidden')
  }

  // Configura quantidade fixa
  if (quantFix != 0) {
    for (let i = 0; i < quantFix; i++) {
      spacePeopleFix.innerHTML += `<div class="spPplFix"></div>`
      fix++
    }
  } else {
    spacePeopleFix.classList.add('hidden')
  }

  // Configura pessoas fixas
  peopleFix.forEach(inptFix => {
    if (inptFix.checked) {
      spacePeoplesFixed.innerHTML += `<h2 data-people="${
        peoples[inptFix.value].Matricula
      }"></h2>`
      fixed++
    }
  })

  // Configura horários
  times.forEach(inptTime => {
    if (inptTime.checked) {
      spacePeoplesTimes.innerHTML += `<h2>${inptTime.value}</h2>`
    }
  })

  // Configura roles
  roles.forEach(inptRole => {
    if (inptRole.checked) {
      spacePeopleMin.setAttribute('data-role', inptRole.value)
      spacePeopleFix.setAttribute('data-role', inptRole.value)
    }
  })

  // Define o tipo da posição
  if (min > 0) {
    position.setAttribute('data-type', 'min')
  } else if (fix > 0) {
    position.setAttribute('data-type', 'fix')
  } else if (fixed > 0) {
    position.setAttribute('data-type', 'fixed')
  }
}

function createWeekDays() {
  const now = getSPTime()
  const currentDay = now.getDay() // 0 (domingo) a 6 (sábado)
  const currentDate = now.getDate()

  // Encontra o domingo mais recente (início da semana)
  const startDate = new Date(now)
  startDate.setDate(currentDate - currentDay)

  // Limpa o container principal
  peoplesEscala.innerHTML = ''

  // Cria os 7 dias da semana
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(startDate)
    dayDate.setDate(startDate.getDate() + i)

    const dayName = getDayName(dayDate.getDay())
    const formattedDate = formatDate(dayDate)

    peoplesEscala.innerHTML += `
      <div class="day-container">
        <h1 class="day-title">${dayName} - ${formattedDate}</h1>
      </div>
    `
  }
}

function getDayName(dayIndex) {
  const days = [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado'
  ]
  return days[dayIndex]
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}`
}

////////////////////////////////////////////////////////////////

function deliverPeoples() {
  // Zera completamente a escala antes de redistribuir
  document.querySelectorAll('.day-container').forEach(dayContainer => {
    dayContainer.querySelectorAll('.escalaPosition').forEach(position => {
      position.querySelectorAll('[data-assigned="true"]').forEach(assigned => {
        assigned.removeAttribute('data-assigned')
        assigned.removeAttribute('data-people')
        assigned.textContent = ''
      })
    })
  })

  // Objetos para controle
  const globalUsage = {}
  Object.keys(peoples).forEach(matricula => {
    globalUsage[matricula] = 0
  })

  // Para cada dia
  document
    .querySelectorAll('.day-container')
    .forEach((dayContainer, dayIndex) => {
      const dayTitle = dayContainer.querySelector('.day-title').textContent
      const [_, dateStr] = dayTitle.split(' - ')
      const [day, month] = dateStr.split('/').map(Number)
      const dailyUsed = new Set()

      // Ordena as posições de forma diferente cada dia
      const positions = Array.from(
        dayContainer.querySelectorAll('.escalaPosition')
      )
      const rotatedPositions = rotatePositions(positions, dayIndex)

      // Processa posições fixas primeiro
      rotatedPositions.forEach((position, posIndex) => {
        const fixedElements = position.querySelectorAll(
          '.spacePeoplesFixed h2[data-people]'
        )
        fixedElements.forEach(el => {
          const matricula = el.dataset.people
          if (isPersonAvailable(peoples[matricula], day, month)) {
            el.textContent = peoples[matricula].Name
            dailyUsed.add(matricula)
            globalUsage[matricula]++
          } else {
            const requiredRole = position.querySelector(
              '.spacePeopleMin, .spacePeopleFix'
            )?.dataset.role
            const replacement = findBestPersonForPosition(
              getRequiredTimes(position),
              day,
              month,
              Array.from(dailyUsed),
              globalUsage,
              position.dataset.type,
              posIndex,
              0,
              requiredRole
            )
            if (replacement) {
              el.textContent = replacement.Name
              el.dataset.people = replacement.Matricula
              dailyUsed.add(replacement.Matricula)
              globalUsage[replacement.Matricula]++
            }
          }
        })
      })

      // Processa posições min e fix
      rotatedPositions.forEach((position, posIndex) => {
        const requiredRole = position.querySelector(
          '.spacePeopleMin, .spacePeopleFix'
        )?.dataset.role

        processPositionWithRotation(
          position.querySelector('.spacePeopleMin'),
          'spPplMin',
          day,
          month,
          dailyUsed,
          globalUsage,
          getRequiredTimes(position),
          position.dataset.type,
          posIndex,
          requiredRole
        )

        processPositionWithRotation(
          position.querySelector('.spacePeopleFix'),
          'spPplFix',
          day,
          month,
          dailyUsed,
          globalUsage,
          getRequiredTimes(position),
          position.dataset.type,
          posIndex,
          requiredRole
        )
      })
    })

  saveEscala()
}

// Função modificada para incluir requiredRole
function processPositionWithRotation(
  container,
  slotClass,
  day,
  month,
  dailyUsed,
  globalUsage,
  requiredTimes,
  positionType,
  posIndex,
  requiredRole
) {
  if (!container || container.classList.contains('hidden')) return

  const slots = container.querySelectorAll(`.${slotClass}`)
  slots.forEach((slot, slotIndex) => {
    if (!slot.dataset.assigned) {
      const assignedPerson = findBestPersonForPosition(
        requiredTimes,
        day,
        month,
        Array.from(dailyUsed),
        globalUsage,
        positionType,
        posIndex,
        slotIndex,
        requiredRole
      )

      if (assignedPerson) {
        slot.textContent = assignedPerson.Name
        slot.dataset.people = assignedPerson.Matricula
        slot.dataset.assigned = 'true'
        dailyUsed.add(assignedPerson.Matricula)
        globalUsage[assignedPerson.Matricula]++
      }
    }
  })
}

function findBestPersonForPosition(
  requiredTimes,
  day,
  month,
  excludedMatriculas,
  globalUsage,
  positionType,
  posIndex,
  slotIndex = 0,
  requiredRole = null
) {
  let candidates = Object.values(peoples).filter(person => {
    // Verifica disponibilidade básica
    const available =
      isPersonAvailable(person, day, month) &&
      !excludedMatriculas.includes(person.Matricula)

    if (!available) return false

    // Verifica os tempos (case insensitive)
    if (requiredTimes.length > 0) {
      const personTime = person.Time ? person.Time.toUpperCase() : ''
      if (!requiredTimes.some(t => t.toUpperCase() === personTime)) return false
    }

    // Verifica role se necessário
    if (requiredRole) {
      return person.Additionals && person.Additionals.Role === requiredRole
    }

    return true
  })

  if (candidates.length === 0) return null

  // Prioriza pessoas menos utilizadas globalmente
  candidates.forEach(person => {
    let score = 0
    score +=
      (1 -
        globalUsage[person.Matricula] /
          Math.max(...Object.values(globalUsage))) *
      50
    score += (posIndex % (person.Matricula.charCodeAt(0) % 7)) * 5
    score += slotIndex * 2
    if (positionType === 'fix') score += 10
    person.score = score
  })

  candidates.sort((a, b) => b.score - a.score)

  return candidates[0]
}

// Rotaciona a ordem das posições para cada dia
function rotatePositions(positions, dayIndex) {
  const rotationOffset = dayIndex % positions.length
  return [
    ...positions.slice(rotationOffset),
    ...positions.slice(0, rotationOffset)
  ]
}

// Função para obter tempos requeridos de uma posição
function getRequiredTimes(position) {
  const times = []
  const timeElements = position.querySelectorAll('.spacePeoplesTimes h2')
  timeElements.forEach(el => {
    // Normaliza para uppercase para garantir consistência
    times.push(el.textContent.trim().toUpperCase())
  })
  return times
}

function isPersonAvailable(person, day, month) {
  if (person.Holiday || person.Docket) return false

  if (person.Folgas && person.Folgas.includes(day)) return false

  return true
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

async function saveEscala() {
  try {
    if (!actualLogin || !actualScale) {
      throw new Error('Usuário ou escala não identificados')
    }

    // 1. Primeiro obtemos os dados atuais para preservar o que não vamos modificar
    const snapshot = await database
      .ref(`Users/${actualLogin}/Escalas/${actualScale}`)
      .once('value')
    const currentData = snapshot.val() || {}

    // 2. Captura apenas os dados que queremos atualizar
    const positionsData = []
    const positionElements = document.querySelectorAll(
      '#positionsContainer .positionsEscala'
    )

    positionElements.forEach(position => {
      const positionObj = {
        html: position.outerHTML,
        values: {
          name: position.querySelector('.inptNamePosition')?.value || '',
          quantMin:
            position.querySelector('.inptQuantMinPosition')?.value || '0',
          quantFix:
            position.querySelector('.inptQuantFixPosition')?.value || '0',
          peopleFix: Array.from(
            position.querySelectorAll('.inptPeopleFixPositions:checked')
          ).map(el => el.value),
          times: Array.from(
            position.querySelectorAll('.inptTimesPositions:checked')
          ).map(el => el.value),
          roles: Array.from(
            position.querySelectorAll('.inptRolesPositions:checked')
          ).map(el => el.value)
        }
      }
      positionsData.push(positionObj)
    })

    // 3. Prepara apenas os dados que serão atualizados
    const updateData = {
      positionsData: positionsData,
      peoplesEscala: document.getElementById('peoplesEscala').innerHTML,
      updatedAt: Date.now(),
      updatedBy: actualLogin
    }

    // 4. Se existir nome da escala e não estivermos atualizando, mantemos o existente
    if (currentData.name && !document.getElementById('escalaName')?.value) {
      updateData.name = currentData.name
    } else if (document.getElementById('escalaName')?.value) {
      updateData.name = document.getElementById('escalaName').value
    }

    // 5. ATUALIZAÇÃO SEGURA - usa update() em vez de set() para não apagar outros campos
    await database
      .ref(`Users/${actualLogin}/Escalas/${actualScale}`)
      .update(updateData)

    console.log('Escala salva com sucesso (SEM APAGAR PEOPLES)!')
    return true
  } catch (error) {
    console.error('Erro ao salvar escala:', error)
    return false
  }
}

async function loadEscala() {
  try {
    if (!actualLogin || !actualScale) {
      console.log('Usuário ou escala não identificados - criando nova escala')
      return false
    }

    const snapshot = await database
      .ref(`Users/${actualLogin}/Escalas/${actualScale}`)
      .once('value')
    const escalaData = snapshot.val()

    if (!escalaData) {
      console.log('Nenhuma escala salva encontrada - iniciando nova escala')
      return false
    }

    // Carrega o peoplesEscala se existir
    if (escalaData.peoplesEscala) {
      document.getElementById('peoplesEscala').innerHTML =
        escalaData.peoplesEscala
    }

    // Carrega as posições com seus valores
    const positionsContainer = document.getElementById('positionsContainer')
    positionsContainer.innerHTML = ''

    // Verifica se positionsData existe e é um array
    if (escalaData.positionsData && Array.isArray(escalaData.positionsData)) {
      escalaData.positionsData.forEach(positionObj => {
        if (!positionObj || !positionObj.html) return

        // Cria um elemento temporário para reconstruir a posição
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = positionObj.html
        const positionElement = tempDiv.firstChild

        // Preenche os valores salvos se existirem
        if (positionObj.values) {
          const values = positionObj.values

          // Preenche inputs de texto/número
          const nameInput = positionElement.querySelector('.inptNamePosition')
          if (nameInput && values.name) nameInput.value = values.name

          const quantMinInput = positionElement.querySelector(
            '.inptQuantMinPosition'
          )
          if (quantMinInput && values.quantMin)
            quantMinInput.value = values.quantMin

          const quantFixInput = positionElement.querySelector(
            '.inptQuantFixPosition'
          )
          if (quantFixInput && values.quantFix)
            quantFixInput.value = values.quantFix

          // Marca checkboxes de pessoas fixas
          if (values.peopleFix && Array.isArray(values.peopleFix)) {
            values.peopleFix.forEach(value => {
              const checkbox = positionElement.querySelector(
                `.inptPeopleFixPositions[value="${value}"]`
              )
              if (checkbox) checkbox.checked = true
            })
          }

          // Marca checkboxes de horários
          if (values.times && Array.isArray(values.times)) {
            values.times.forEach(value => {
              const checkbox = positionElement.querySelector(
                `.inptTimesPositions[value="${value}"]`
              )
              if (checkbox) checkbox.checked = true
            })
          }

          // Marca checkboxes de cargos
          if (values.roles && Array.isArray(values.roles)) {
            values.roles.forEach(value => {
              const checkbox = positionElement.querySelector(
                `.inptRolesPositions[value="${value}"]`
              )
              if (checkbox) checkbox.checked = true
            })
          }
        }

        positionsContainer.appendChild(positionElement)
      })

      // Reativa os event listeners
      reattachPositionEventListeners()
    }

    return true
  } catch (error) {
    console.error('Erro ao carregar escala:', error)
    return false
  }
}

function reattachPositionEventListeners() {
  // Remove listeners antigos
  document.querySelectorAll('.removePosition').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true))
  })

  document.querySelectorAll('.savePosition').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true))
  })

  // Adiciona novos listeners
  document.querySelectorAll('.removePosition').forEach(button => {
    button.addEventListener('click', function () {
      if (confirm('Tem certeza que deseja remover esta posição?')) {
        this.closest('.positionsEscala').remove()
      }
    })
  })

  document.querySelectorAll('.savePosition').forEach(button => {
    button.addEventListener('click', function () {
      createInPeoplesEscala(this)
    })
  })
}
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
async function restorePeoples() {
  try {
    const peoplesData = {
      15343: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 6,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '15343',
        Name: 'Marcos Vinicius de Souza',
        Scale: '6/1 - 6/2',
        Time: 'h1',
        TimeEnter: '16:15',
        TimeExit: '22:15'
      },
      15702: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 1,
        FirstMonth: 1,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '15702',
        Name: 'Florisvaldo Freitas Silva',
        Scale: '6/1 - 6/2',
        Time: 'h2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      },
      16240: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 8,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '16240',
        Name: 'Laiza da Conceição da Silva',
        Scale: '6/1 - 6/2',
        Time: 'h2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      },
      18171: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 7,
        FirstMonth: 1,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '18171',
        Name: 'Vitor Oliveira Barbosa',
        Scale: '6/1 - 6/2',
        Time: 'h2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      },
      20860: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 12,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '20860',
        Name: 'Gabriel de Souza Lima',
        Scale: '6/1 - 6/2',
        Time: 'h2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      },
      25137: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 1,
        FirstMonth: 1,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '25137',
        Name: 'João Vitor Dias',
        Scale: '6/1 - 6/2',
        Time: 'h2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      },
      25533: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 4,
        FirstMonth: 1,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '25533',
        Name: 'Matheus Pereira Ramos',
        Scale: '6/1 - 6/2',
        Time: 'h2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      },
      26175: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 10,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '26175',
        Name: 'Bruno Correia da Silva',
        Scale: '6/1 - 6/2',
        Time: 'h2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      },
      27978: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 1,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '27978',
        Name: 'Victor Augusto Ramos Clemente',
        Scale: '6/1 - 6/2',
        Time: 'h1',
        TimeEnter: '16:15',
        TimeExit: '22:15'
      },
      96600: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 13,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '96600',
        Name: 'Antonio Jose Alves Viana',
        Scale: '6/1 - 6/2',
        Time: 'H2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      },
      98015: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 12,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '98015',
        Name: 'Gabriel Martins Filho',
        Scale: '6/1 - 6/2',
        Time: 'H1',
        TimeEnter: '16:15',
        TimeExit: '22:15'
      },
      98017: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 3,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '98017',
        Name: 'Bruno Machado Sidomo',
        Scale: '6/1 - 6/2',
        Time: 'H1',
        TimeEnter: '16:15',
        TimeExit: '22:15'
      },
      98026: {
        Additionals: { Role: 'Balanceiro' },
        Docket: false,
        Double: false,
        FirstDay: 2,
        FirstMonth: 4,
        Folga: false,
        Folgas: [],
        Holiday: false,
        Matricula: '98026',
        Name: 'João Severino de Lira',
        Scale: '6/1 - 6/2',
        Time: 'H2',
        TimeEnter: '17:45',
        TimeExit: '23:45'
      }
    }

    await database
      .ref(`Users/${actualLogin}/Escalas/${actualScale}/peoples`)
      .set(peoplesData)
    console.log('Peoples restaurados com sucesso!')
    return true
  } catch (error) {
    console.error('Erro ao restaurar peoples:', error)
    return false
  }
}
